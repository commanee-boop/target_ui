from __future__ import annotations

import base64
import json
import os
import re
import shutil
import sqlite3
import tempfile
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

# Prefer RTSP-over-TCP before OpenCV initializes FFmpeg.  TCP works more
# reliably across Wi-Fi, VPN, and NAT than the UDP default used by many feeds.
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")

import cv2
import numpy as np
from flask import Flask, Response, jsonify, request, stream_with_context
from ultralytics import YOLO


ROOT = Path(__file__).resolve().parent
PUBLIC_MODELS_DIR = ROOT / "public" / "models"
REPORT_DATABASE_PATH = ROOT / "target_detection_reports.sqlite3"
DEFAULT_MODEL_NAME = "exp-7.pt"
TARGET_KEYS = ("MV", "AMV", "LMV", "AFV", "CV", "MCV")
MODEL_CACHE: dict[str, YOLO] = {}
YOLO_CONF = 0.25
YOLO_IOU = 0.7
YOLO_IMGSZ = 1280
VIDEO_SNAPSHOT_INTERVAL_SEC = 10.0
VIDEO_TIMELINE_MIN_INTERVAL_SEC = 0.1
VIDEO_TIMELINE_MAX_SAMPLES = 720
TIMELINE_IMAGE_MAX_WIDTH = 960
TIMELINE_IMAGE_QUALITY = 88
SNAPSHOT_IMAGE_MAX_WIDTH = 960
SNAPSHOT_IMAGE_QUALITY = 88
STREAM_TIMELINE_INTERVAL_SEC = 1.5
STREAM_SNAPSHOT_INTERVAL_SEC = 4.0
STREAM_ANALYSIS_MAX_SAMPLES = 12
STREAM_ANALYSIS_MAX_SECONDS = 18.0
STREAM_EMPTY_READ_RETRY_LIMIT = 40
STREAM_EMPTY_READ_DELAY_SEC = 0.15
REMOTE_REQUEST_TIMEOUT_SEC = 12.0
STREAM_PREVIEW_FPS = 10.0
STREAM_PREVIEW_JPEG_QUALITY = 80
STREAM_OPEN_TIMEOUT_MSEC = 10_000
STREAM_READ_TIMEOUT_MSEC = 8_000
LIVE_VIDEO_TARGET_FPS = 8.0
LIVE_VIDEO_IMGSZ = 1280
LIVE_TRACK_TTL_SEC = 2.0
LIVE_TRACK_IOU_THRESHOLD = 0.35
LIVE_UNIQUE_CENTER_DISTANCE_RATIO = 0.05

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".webm"}

app = Flask(__name__)
VIDEO_SESSIONS: dict[str, dict] = {}
VIDEO_SESSIONS_LOCK = threading.Lock()
REPORT_DATABASE_LOCK = threading.Lock()


def open_stream_capture(source_url: str):
    """Open a network stream with bounded waits where OpenCV supports it."""
    try:
        return cv2.VideoCapture(
            source_url,
            cv2.CAP_FFMPEG,
            [
                cv2.CAP_PROP_OPEN_TIMEOUT_MSEC,
                STREAM_OPEN_TIMEOUT_MSEC,
                cv2.CAP_PROP_READ_TIMEOUT_MSEC,
                STREAM_READ_TIMEOUT_MSEC,
            ],
        )
    except (TypeError, cv2.error):
        return cv2.VideoCapture(source_url, cv2.CAP_FFMPEG)


def stream_preview_frames(source_url: str, model: YOLO):
    """Run Ultralytics on a camera/video source and relay annotated MJPEG frames."""
    capture = None
    frame_interval = 1.0 / STREAM_PREVIEW_FPS

    try:
        while True:
            if capture is None or not capture.isOpened():
                if capture is not None:
                    capture.release()
                capture = open_stream_capture(source_url)
                if not capture.isOpened():
                    time.sleep(1.0)
                    continue

            frame_started_at = time.perf_counter()
            ok, frame = capture.read()
            if not ok or frame is None:
                capture.release()
                capture = None
                time.sleep(0.3)
                continue

            try:
                result = model.predict(
                    source=frame,
                    imgsz=YOLO_IMGSZ,
                    conf=YOLO_CONF,
                    iou=YOLO_IOU,
                    verbose=False,
                )[0]
                frame = result.plot(boxes=True, labels=True)
            except Exception:
                # Preserve the camera preview if an individual inference frame fails.
                pass

            encoded_ok, encoded_frame = cv2.imencode(
                ".jpg",
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), STREAM_PREVIEW_JPEG_QUALITY],
            )
            if encoded_ok:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + encoded_frame.tobytes()
                    + b"\r\n"
                )

            remaining_delay = frame_interval - (time.perf_counter() - frame_started_at)
            if remaining_delay > 0:
                time.sleep(remaining_delay)
    finally:
        if capture is not None:
            capture.release()


def video_session_payload(session: dict) -> dict:
    return {
        "sessionId": session["id"],
        "status": session["status"],
        "metrics": session["metrics"],
        "total": session["total"],
        "media": session["media"],
        "framesProcessed": session["framesProcessed"],
        "detections": session.get("detections", []),
        "timelineEvents": session.get("timelineEvents", []),
        "snapshots": session.get("snapshots", []),
        "previewImage": session.get("previewImage"),
        "streamPath": f"/api/video-sessions/{session['id']}/stream",
        "playback": session.get("playback", {}),
    }


def stream_annotated_video_session(session_id: str):
    """Run inference and emit an annotated video at a stable preview rate."""
    with VIDEO_SESSIONS_LOCK:
        session = VIDEO_SESSIONS.get(session_id)
    if session is None:
        return

    capture = cv2.VideoCapture(str(session["path"]))
    if not capture.isOpened():
        with VIDEO_SESSIONS_LOCK:
            session["status"] = "error"
            session["error"] = "Unable to open uploaded video"
        return

    source_fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_stride = max(1, round(source_fps / LIVE_VIDEO_TARGET_FPS)) if source_fps else 1
    frame_index = 0
    frame_interval = 1.0 / LIVE_VIDEO_TARGET_FPS

    try:
        while True:
            with VIDEO_SESSIONS_LOCK:
                if not session.get("active", False):
                    break
                playback = session["playback"]
                if playback.pop("restartRequested", False):
                    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    frame_index = 0
                    playback["currentTime"] = 0.0
                seek_time = playback.pop("seekTime", None)
                if seek_time is not None:
                    capture.set(cv2.CAP_PROP_POS_MSEC, float(seek_time) * 1000)
                    frame_index = int(round(float(seek_time) * source_fps)) if source_fps else 0
                    playback["currentTime"] = float(seek_time)
                paused = bool(playback.get("paused", False))
                playback_rate = float(playback.get("rate", 1.0))

            if paused:
                time.sleep(0.08)
                continue

            ok, frame = capture.read()
            if not ok or frame is None:
                capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frame_index = 0
                continue

            if frame_index % frame_stride:
                frame_index += 1
                continue

            frame_started_at = time.perf_counter()
            try:
                result = session["model"].predict(
                    source=frame,
                    imgsz=LIVE_VIDEO_IMGSZ,
                    conf=YOLO_CONF,
                    iou=YOLO_IOU,
                    verbose=False,
                )[0]
            except Exception as error:
                with VIDEO_SESSIONS_LOCK:
                    session["status"] = "error"
                    session["error"] = f"Video inference failed: {error}"
                return
            detection = serialize_result(result, session["selectedTargets"])
            plotted_frame = result.plot(boxes=True, labels=True)
            video_time_sec = float(capture.get(cv2.CAP_PROP_POS_MSEC) or 0) / 1000
            if video_time_sec <= 0 and source_fps > 0:
                video_time_sec = frame_index / source_fps

            timeline_moment = None
            snapshot_moment = None
            if detection["total"] > 0:
                duration_sec = session["media"].get("durationSec")
                with VIDEO_SESSIONS_LOCK:
                    last_snapshot_time = float(session.get("lastSnapshotTime", -float("inf")))

                if video_time_sec - last_snapshot_time >= STREAM_SNAPSHOT_INTERVAL_SEC:
                    snapshot_moment = build_detection_moment(
                        detection,
                        time_sec=video_time_sec,
                        duration_sec=duration_sec,
                        image=plotted_frame,
                        image_max_width=SNAPSHOT_IMAGE_MAX_WIDTH,
                        image_quality=SNAPSHOT_IMAGE_QUALITY,
                    )
            encoded_ok, encoded_frame = cv2.imencode(
                ".jpg",
                plotted_frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), STREAM_PREVIEW_JPEG_QUALITY],
            )

            with VIDEO_SESSIONS_LOCK:
                confirmed_detections, newly_visible = update_live_tracks(
                    session,
                    detection["detections"],
                    time.monotonic(),
                )
                newly_counted = register_unique_detections(session, detection["detections"])
                for confirmed in newly_counted:
                    session["cumulativeMetrics"][confirmed["targetKey"]] += 1

                # Timeline is an event stream: add a point only when tracking
                # sees a new object, not every frame where the same object remains.
                if newly_visible:
                    new_metrics = empty_metrics()
                    for confirmed in newly_visible:
                        new_metrics[confirmed["targetKey"]] += 1
                    timeline_moment = build_detection_moment(
                        {
                            "detections": newly_visible,
                            "metrics": new_metrics,
                            "total": len(newly_visible),
                        },
                        time_sec=video_time_sec,
                        duration_sec=session["media"].get("durationSec"),
                        image=plotted_frame,
                    )

                session["metrics"] = session["cumulativeMetrics"].copy()
                session["total"] = sum(session["cumulativeMetrics"].values())
                session["detections"] = confirmed_detections[:12]
                session["framesProcessed"] += 1
                session["status"] = "streaming"
                session["playback"]["currentTime"] = round(video_time_sec, 2)
                if timeline_moment is not None:
                    session["timelineEvents"].append(timeline_moment)
                    session["timelineEvents"] = session["timelineEvents"][-VIDEO_TIMELINE_MAX_SAMPLES:]
                    session["lastTimelineTime"] = video_time_sec
                if snapshot_moment is not None:
                    session["snapshots"].append(snapshot_moment)
                    session["snapshots"] = session["snapshots"][-STREAM_ANALYSIS_MAX_SAMPLES:]
                    session["lastSnapshotTime"] = video_time_sec
                    session["previewImage"] = snapshot_moment["image"]

            if encoded_ok:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + encoded_frame.tobytes()
                    + b"\r\n"
                )
            frame_index += 1

            # VideoCapture reads from disk as fast as it can. Pace the MJPEG
            # output so a selected video plays while detections are generated,
            # instead of finishing the clip immediately.
            remaining_delay = (frame_interval / max(playback_rate, 0.25)) - (time.perf_counter() - frame_started_at)
            if remaining_delay > 0:
                time.sleep(remaining_delay)
    finally:
        capture.release()


def normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def empty_metrics() -> dict[str, int]:
    return {key: 0 for key in TARGET_KEYS}


def report_database_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(str(REPORT_DATABASE_PATH))
    connection.row_factory = sqlite3.Row
    return connection


def initialize_report_database() -> None:
    """Create the local, persistent report store on first server start."""
    with REPORT_DATABASE_LOCK, report_database_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS detection_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )


def report_metric_value(value: object) -> int:
    try:
        return max(0, int(float(value or 0)))
    except (TypeError, ValueError):
        return 0


def normalize_report_payload(payload: dict) -> dict:
    """Keep persisted report records predictable even when requests are edited."""
    metrics = payload.get("metrics") if isinstance(payload.get("metrics"), dict) else {}
    tags = payload.get("tags") if isinstance(payload.get("tags"), list) else []
    kind = "image" if str(payload.get("kind", "")).lower() == "image" else "video"
    return {
        "name": str(payload.get("name") or "").strip()[:180],
        "source": str(payload.get("source") or "-").strip()[:1000],
        "ext": str(payload.get("ext") or ("JPG" if kind == "image" else "MP4")).upper()[:12],
        "kind": kind,
        "duration": str(payload.get("duration") or ("ภาพนิ่ง" if kind == "image" else "-"))[:60],
        "date": str(payload.get("date") or "-")[:60],
        "time": str(payload.get("time") or "-")[:60],
        "size": str(payload.get("size") or "-")[:60],
        "resolution": str(payload.get("resolution") or "-")[:60],
        "fps": str(payload.get("fps") or "-")[:30],
        "recorder": str(payload.get("recorder") or "admin")[:120],
        "tags": [str(tag).upper() for tag in tags if str(tag).upper() in TARGET_KEYS],
        "metrics": {
            target: report_metric_value(metrics.get(target, 0))
            for target in TARGET_KEYS
        },
        "image": str(payload.get("image") or "")[:8_000_000],
        "model": str(payload.get("model") or "-")[:120],
        "modelFile": str(payload.get("modelFile") or "-")[:255],
    }


initialize_report_database()


def box_iou(first_box: list[float], second_box: list[float]) -> float:
    """Return IoU for two [x1, y1, x2, y2] detection boxes."""
    first_x1, first_y1, first_x2, first_y2 = first_box
    second_x1, second_y1, second_x2, second_y2 = second_box
    intersection_width = max(0.0, min(first_x2, second_x2) - max(first_x1, second_x1))
    intersection_height = max(0.0, min(first_y2, second_y2) - max(first_y1, second_y1))
    intersection = intersection_width * intersection_height
    first_area = max(0.0, first_x2 - first_x1) * max(0.0, first_y2 - first_y1)
    second_area = max(0.0, second_x2 - second_x1) * max(0.0, second_y2 - second_y1)
    union = first_area + second_area - intersection
    return intersection / union if union > 0 else 0.0


def is_same_unique_object(first: dict, second: dict, width: int, height: int) -> bool:
    """Match a detection to a previously counted object without double-counting it."""
    if first["targetKey"] != second["targetKey"]:
        return False
    if box_iou(first["box"], second["box"]) >= LIVE_TRACK_IOU_THRESHOLD:
        return True

    first_x1, first_y1, first_x2, first_y2 = first["box"]
    second_x1, second_y1, second_x2, second_y2 = second["box"]
    first_center = ((first_x1 + first_x2) / 2, (first_y1 + first_y2) / 2)
    second_center = ((second_x1 + second_x2) / 2, (second_y1 + second_y2) / 2)
    center_distance = ((first_center[0] - second_center[0]) ** 2 + (first_center[1] - second_center[1]) ** 2) ** 0.5
    frame_diagonal = (max(width, 1) ** 2 + max(height, 1) ** 2) ** 0.5
    return center_distance / frame_diagonal <= LIVE_UNIQUE_CENTER_DISTANCE_RATIO


def register_unique_detections(session: dict, detections: list[dict]) -> list[dict]:
    """Return only detections not yet counted during this live-video session."""
    known_objects = session.setdefault("seenObjects", [])
    media = session.get("media", {})
    width = int(media.get("width") or 1)
    height = int(media.get("height") or 1)
    newly_counted = []
    matched_known_indices: set[int] = set()

    for detection in detections:
        matching_index = next(
            (
                index
                for index, known in enumerate(known_objects)
                if index not in matched_known_indices
                and is_same_unique_object(known, detection, width, height)
            ),
            None,
        )
        if matching_index is None:
            known_objects.append({**detection})
            matched_known_indices.add(len(known_objects) - 1)
            newly_counted.append(detection)
        else:
            known_objects[matching_index].update(detection)
            matched_known_indices.add(matching_index)

    return newly_counted


def update_live_tracks(session: dict, detections: list[dict], observed_at: float) -> tuple[list[dict], list[dict]]:
    """Keep high-confidence detections visible across adjacent video frames."""
    active_tracks = [
        track for track in session.get("tracks", [])
        if observed_at - float(track.get("lastSeenAt", 0)) <= LIVE_TRACK_TTL_SEC
    ]

    newly_confirmed = []
    matched_track_indices: set[int] = set()
    for detection in detections:
        matching_index = next(
            (
                index
                for index, track in enumerate(active_tracks)
                if index not in matched_track_indices
                if track["targetKey"] == detection["targetKey"]
                and box_iou(track["box"], detection["box"]) >= LIVE_TRACK_IOU_THRESHOLD
            ),
            None,
        )
        if matching_index is None:
            active_tracks.append({**detection, "lastSeenAt": observed_at})
            matched_track_indices.add(len(active_tracks) - 1)
            newly_confirmed.append(detection)
        else:
            active_tracks[matching_index].update(detection)
            active_tracks[matching_index]["lastSeenAt"] = observed_at
            matched_track_indices.add(matching_index)

    session["tracks"] = active_tracks
    visible_tracks = [{key: value for key, value in track.items() if key != "lastSeenAt"} for track in active_tracks]
    return visible_tracks, newly_confirmed


def list_models() -> list[dict[str, str | int]]:
    if not PUBLIC_MODELS_DIR.exists():
        return []

    models = []
    for model_path in sorted(PUBLIC_MODELS_DIR.glob("*.pt")):
        models.append(
            {
                "id": model_path.stem,
                "fileName": model_path.name,
                "path": str(model_path),
                "sizeBytes": model_path.stat().st_size,
            }
        )
    return models


def resolve_model_path(model_id: str | None, model_file_name: str | None) -> Path:
    available = {model["id"]: Path(model["path"]) for model in list_models()}
    if not available:
        raise FileNotFoundError("No .pt model found in public/models")

    for candidate in (model_file_name, model_id):
        if not candidate:
            continue

        direct_path = PUBLIC_MODELS_DIR / Path(candidate).name
        if direct_path.exists():
            return direct_path

        normalized_candidate = normalize_token(Path(candidate).stem)
        for current_id, current_path in available.items():
            if normalize_token(current_id) == normalized_candidate:
                return current_path

    default_path = PUBLIC_MODELS_DIR / DEFAULT_MODEL_NAME
    if default_path.exists():
        return default_path

    return next(iter(available.values()))


def get_model(model_path: Path) -> YOLO:
    cache_key = str(model_path.resolve())
    if cache_key not in MODEL_CACHE:
        MODEL_CACHE[cache_key] = YOLO(str(model_path))
    return MODEL_CACHE[cache_key]


def map_label_to_target(label: str) -> str:
    normalized = normalize_token(label)
    mapping = {
        "mv": "MV",
        "militaryvehicle": "MV",
        "militaryvehicles": "MV",
        "vehicle": "MV",
        "vehicles": "MV",
        "venhicle": "MV",
        "venhicles": "MV",
        "amv": "AMV",
        "armoredmilitaryvehicle": "AMV",
        "lmv": "LMV",
        "lightmilitaryvehicle": "LMV",
        "afv": "AFV",
        "armoredfightingvehicle": "AFV",
        "cv": "CV",
        "combatvehicle": "CV",
        "mcv": "MCV",
        "militarycargovehicle": "MCV",
    }
    return mapping.get(normalized, "MV")


def encode_preview(image, *, max_width: int = 960, quality: int = 82) -> str | None:
    if image is None:
        return None

    output_image = image
    height, width = image.shape[:2]
    if max_width and width > max_width:
        scale = max_width / float(width)
        output_image = cv2.resize(
            image,
            (max_width, max(int(height * scale), 1)),
            interpolation=cv2.INTER_AREA,
        )

    success, encoded = cv2.imencode(
        ".jpg",
        output_image,
        [int(cv2.IMWRITE_JPEG_QUALITY), quality],
    )
    if not success:
        return None
    return f"data:image/jpeg;base64,{base64.b64encode(encoded.tobytes()).decode('ascii')}"


def format_timestamp(seconds: float | None) -> str:
    if seconds is None:
        return "00:00:00"

    total_seconds = max(int(round(seconds)), 0)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def metrics_summary_text(metrics: dict[str, int]) -> str:
    return ", ".join(
        f"{key}: {value}"
        for key, value in metrics.items()
        if int(value or 0) > 0
    )


def build_media_payload(
    *,
    source_kind: str,
    width: int | None = None,
    height: int | None = None,
    fps: float | None = None,
    duration_sec: float | None = None,
    frame_count: int | None = None,
    timeline_interval_sec: float | None = None,
    snapshot_interval_sec: float | None = None,
) -> dict:
    normalized_fps = round(float(fps), 2) if fps and fps > 0 else None
    normalized_duration = round(float(duration_sec), 2) if duration_sec and duration_sec > 0 else None
    is_motion_source = source_kind in {"video", "stream"}

    return {
        "sourceKind": source_kind,
        "width": int(width) if width else None,
        "height": int(height) if height else None,
        "resolution": f"{int(width)} x {int(height)}" if width and height else "-",
        "fps": normalized_fps,
        "durationSec": normalized_duration,
        "durationLabel": "ภาพนิ่ง" if source_kind == "image" else format_timestamp(normalized_duration),
        "frameCount": int(frame_count) if frame_count else None,
        "sampleIntervalSec": snapshot_interval_sec if is_motion_source else None,
        "timelineIntervalSec": timeline_interval_sec if is_motion_source else None,
        "snapshotIntervalSec": snapshot_interval_sec if is_motion_source else None,
    }


def build_detection_moment(
    payload: dict,
    *,
    time_sec: float,
    duration_sec: float | None,
    image,
    image_max_width: int = TIMELINE_IMAGE_MAX_WIDTH,
    image_quality: int = TIMELINE_IMAGE_QUALITY,
) -> dict | None:
    detections = payload.get("detections") or []
    if not detections or int(payload.get("total") or 0) <= 0:
        return None

    primary_detection = max(
        detections,
        key=lambda detection: (
            int(payload["metrics"].get(detection["targetKey"], 0)),
            float(detection["confidence"]),
        ),
    )
    ordered_targets = list(dict.fromkeys(detection["targetKey"] for detection in detections))

    return {
        "time": format_timestamp(time_sec),
        "timeSec": round(float(time_sec), 2),
        "left": round((float(time_sec) / duration_sec) * 100, 2) if duration_sec and duration_sec > 0 else 0,
        "type": primary_detection["targetKey"],
        "targets": ordered_targets,
        "confidence": primary_detection["confidence"],
        "summaryText": metrics_summary_text(payload["metrics"]) or f"{payload['total']} detections",
        "total": int(payload["total"]),
        "metrics": payload["metrics"],
        "detections": detections[:12],
        "image": encode_preview(image, max_width=image_max_width, quality=image_quality),
    }


def build_video_sample_times(duration_sec: float | None, interval_sec: float) -> list[float]:
    if not duration_sec or duration_sec <= 0:
        return [0.0]

    sample_times = [0.0]
    current_time = max(float(interval_sec), 0.1)
    while current_time < duration_sec:
        sample_times.append(round(current_time, 2))
        current_time += max(float(interval_sec), 0.1)

    final_time = max(duration_sec - 0.001, 0.0)
    if abs(sample_times[-1] - final_time) >= 1.0:
        sample_times.append(round(final_time, 2))

    return sample_times


def resolve_timeline_interval(duration_sec: float | None) -> float:
    if not duration_sec or duration_sec <= 0:
        return VIDEO_TIMELINE_MIN_INTERVAL_SEC

    adaptive_interval = duration_sec / VIDEO_TIMELINE_MAX_SAMPLES
    return round(max(VIDEO_TIMELINE_MIN_INTERVAL_SEC, adaptive_interval), 2)


def resolve_frame_index(time_sec: float, fps: float, total_frames: int) -> int:
    if total_frames <= 0:
        return 0

    if fps > 0:
        frame_index = int(round(time_sec * fps))
    else:
        frame_index = int(round(time_sec))

    return min(max(frame_index, 0), total_frames - 1)


def serialize_result(result, selected_targets: set[str]) -> dict:
    metrics = empty_metrics()
    detections = []
    class_summary: dict[str, int] = {}
    model_names = result.names or {}

    for box in result.boxes or []:
        cls_index = int(box.cls.item())
        raw_label = str(model_names.get(cls_index, cls_index))
        mapped_target = map_label_to_target(raw_label)
        class_summary[raw_label] = class_summary.get(raw_label, 0) + 1

        if selected_targets and mapped_target not in selected_targets:
            continue

        metrics[mapped_target] += 1
        detections.append(
            {
                "label": raw_label,
                "targetKey": mapped_target,
                "confidence": round(float(box.conf.item()), 4),
                "box": [round(float(value), 2) for value in box.xyxy[0].tolist()],
            }
        )

    raw_total = sum(class_summary.values())
    filtered_total = sum(metrics.values())

    return {
        "metrics": metrics,
        "detections": detections,
        "classSummary": class_summary,
        "rawTotal": raw_total,
        "filteredOutTotal": max(raw_total - filtered_total, 0),
        "total": filtered_total,
    }


def guess_source_kind(filename: str, mime_type: str) -> str:
    suffix = Path(filename).suffix.lower()
    mime_type = (mime_type or "").lower()
    if suffix in VIDEO_EXTENSIONS or mime_type.startswith("video/"):
        return "video"
    return "image"


def guess_url_source_kind(source_url: str) -> str:
    parsed = urlparse(source_url)
    suffix = Path(parsed.path).suffix.lower()
    scheme = (parsed.scheme or "").lower()
    path_text = parsed.path.lower()

    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if path_text.endswith(".m3u8") or path_text.endswith(".ts"):
        return "stream"
    if scheme in {"rtsp", "rtmp", "udp", "tcp", "mms"}:
        return "stream"
    return "stream"


def load_remote_image(source_url: str):
    request_obj = Request(
        source_url,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
    )
    with urlopen(request_obj, timeout=REMOTE_REQUEST_TIMEOUT_SEC) as response:
        payload = response.read()

    image_array = np.frombuffer(payload, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode image from URL")
    return image


def apply_timeline_positions(moments: list[dict], duration_sec: float | None) -> list[dict]:
    normalized_duration = round(float(duration_sec), 2) if duration_sec and duration_sec > 0 else None
    for moment in moments:
        time_sec = float(moment.get("timeSec") or 0)
        moment["left"] = round((time_sec / normalized_duration) * 100, 2) if normalized_duration else 0
    return moments


def run_image_detection(model: YOLO, source_path: Path, selected_targets: set[str]) -> dict:
    return run_image_detection_source(model, str(source_path), selected_targets)


def run_image_detection_source(model: YOLO, source, selected_targets: set[str]) -> dict:
    result = model.predict(
        source=source,
        imgsz=YOLO_IMGSZ,
        conf=YOLO_CONF,
        iou=YOLO_IOU,
        verbose=False,
    )[0]
    payload = serialize_result(result, selected_targets)
    preview_image = result.plot(boxes=True, labels=True)
    height, width = result.orig_shape
    media = build_media_payload(
        source_kind="image",
        width=width,
        height=height,
        duration_sec=None,
    )
    payload["previewImage"] = encode_preview(preview_image)
    payload["timelineEvents"] = []
    payload["snapshots"] = []
    if payload["total"] > 0:
        moment = build_detection_moment(
            payload,
            time_sec=0.0,
            duration_sec=None,
            image=preview_image,
            image_max_width=SNAPSHOT_IMAGE_MAX_WIDTH,
            image_quality=SNAPSHOT_IMAGE_QUALITY,
        )
        if moment is not None:
            payload["snapshots"] = [moment]
    payload["durationSec"] = media["durationSec"]
    payload["media"] = media
    return payload


def run_video_detection(model: YOLO, source_path: Path, selected_targets: set[str]) -> dict:
    capture = cv2.VideoCapture(str(source_path))
    return run_seekable_video_detection(model, capture, selected_targets, open_error="Unable to open uploaded video")


def run_seekable_video_detection(
    model: YOLO,
    capture,
    selected_targets: set[str],
    *,
    source_kind: str = "video",
    open_error: str = "Unable to open video source",
) -> dict:
    if not capture.isOpened():
        raise ValueError(open_error)

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    duration_sec = round(total_frames / fps, 2) if fps > 0 and total_frames > 0 else None
    timeline_interval_sec = resolve_timeline_interval(duration_sec)
    timeline_sample_times = build_video_sample_times(duration_sec, timeline_interval_sec)
    snapshot_sample_times = build_video_sample_times(duration_sec, VIDEO_SNAPSHOT_INTERVAL_SEC)
    sample_requests: dict[int, dict[str, object]] = {}

    def register_sample(sample_time: float, sample_type: str) -> None:
        frame_index = resolve_frame_index(sample_time, fps, total_frames)
        request_payload = sample_requests.setdefault(
            frame_index,
            {
                "frameIndex": frame_index,
                "sampleTypes": set(),
                "requestedTimes": [],
            },
        )
        request_payload["sampleTypes"].add(sample_type)
        request_payload["requestedTimes"].append(sample_time)

    for sample_time in timeline_sample_times:
        register_sample(sample_time, "timeline")

    for sample_time in snapshot_sample_times:
        register_sample(sample_time, "snapshot")

    metric_frame_indices = {
        resolve_frame_index(sample_time, fps, total_frames)
        for sample_time in snapshot_sample_times
    }

    aggregate_metrics = empty_metrics()
    aggregate_class_summary: dict[str, int] = {}
    preview_image = None
    preview_detections = []
    preview_score = -1
    analyzed_frames = 0
    timeline_events = []
    snapshots = []

    try:
        for frame_index in sorted(sample_requests):
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok:
                continue

            result = model.predict(
                source=frame,
                imgsz=YOLO_IMGSZ,
                conf=YOLO_CONF,
                iou=YOLO_IOU,
                verbose=False,
            )[0]
            payload = serialize_result(result, selected_targets)
            plotted_frame = result.plot(boxes=False, labels=False)
            actual_time_sec = (frame_index / fps) if fps > 0 else min(sample_requests[frame_index]["requestedTimes"])
            if frame_index in metric_frame_indices:
                for key in TARGET_KEYS:
                    aggregate_metrics[key] += int(payload["metrics"].get(key, 0))
                for label, count in payload["classSummary"].items():
                    aggregate_class_summary[label] = aggregate_class_summary.get(label, 0) + count

            preview_candidate_score = int(payload["total"])
            if preview_image is None or preview_candidate_score > preview_score:
                preview_image = plotted_frame
                preview_detections = payload["detections"]
                preview_score = preview_candidate_score

            sample_types = sample_requests[frame_index]["sampleTypes"]
            if "timeline" in sample_types:
                timeline_moment = build_detection_moment(
                    payload,
                    time_sec=actual_time_sec,
                    duration_sec=duration_sec,
                    image=plotted_frame,
                    image_max_width=TIMELINE_IMAGE_MAX_WIDTH,
                    image_quality=TIMELINE_IMAGE_QUALITY,
                )
                if timeline_moment is not None:
                    timeline_events.append(timeline_moment)

            if "snapshot" in sample_types:
                snapshot_moment = build_detection_moment(
                    payload,
                    time_sec=actual_time_sec,
                    duration_sec=duration_sec,
                    image=plotted_frame,
                    image_max_width=SNAPSHOT_IMAGE_MAX_WIDTH,
                    image_quality=SNAPSHOT_IMAGE_QUALITY,
                )
                if snapshot_moment is not None:
                    snapshots.append(snapshot_moment)

            analyzed_frames += 1
    finally:
        capture.release()

    media = build_media_payload(
        source_kind=source_kind,
        width=width,
        height=height,
        fps=fps,
        duration_sec=duration_sec,
        frame_count=total_frames,
        timeline_interval_sec=timeline_interval_sec,
        snapshot_interval_sec=VIDEO_SNAPSHOT_INTERVAL_SEC,
    )
    return {
        "metrics": aggregate_metrics,
        "detections": preview_detections,
        "classSummary": aggregate_class_summary,
        "previewImage": encode_preview(preview_image),
        "total": sum(aggregate_metrics.values()),
        "timelineEvents": timeline_events,
        "snapshots": snapshots,
        "framesAnalyzed": analyzed_frames,
        "frameStride": None,
        "durationSec": duration_sec,
        "media": media,
    }


def run_stream_detection(
    model: YOLO,
    source_url: str,
    selected_targets: set[str],
    *,
    source_kind: str = "stream",
) -> dict:
    capture = open_stream_capture(source_url)
    if not capture.isOpened():
        raise ValueError("Unable to open stream source")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    aggregate_metrics = empty_metrics()
    aggregate_class_summary: dict[str, int] = {}
    preview_image = None
    preview_detections = []
    preview_score = -1
    timeline_events = []
    snapshots = []
    analyzed_frames = 0
    empty_reads = 0
    last_timeline_time = -STREAM_TIMELINE_INTERVAL_SEC
    last_snapshot_time = -STREAM_SNAPSHOT_INTERVAL_SEC
    started_at = time.perf_counter()

    try:
        while analyzed_frames < STREAM_ANALYSIS_MAX_SAMPLES:
            elapsed_since_start = time.perf_counter() - started_at
            if analyzed_frames and elapsed_since_start >= STREAM_ANALYSIS_MAX_SECONDS:
                break

            ok, frame = capture.read()
            if not ok or frame is None:
                empty_reads += 1
                if empty_reads >= STREAM_EMPTY_READ_RETRY_LIMIT:
                    break
                time.sleep(STREAM_EMPTY_READ_DELAY_SEC)
                continue

            empty_reads = 0
            if not width or not height:
                height, width = frame.shape[:2]

            actual_time_sec = elapsed_since_start
            needs_timeline_sample = analyzed_frames == 0 or (actual_time_sec - last_timeline_time) >= (STREAM_TIMELINE_INTERVAL_SEC - 0.05)
            needs_snapshot_sample = analyzed_frames == 0 or (actual_time_sec - last_snapshot_time) >= (STREAM_SNAPSHOT_INTERVAL_SEC - 0.05)

            if not needs_timeline_sample and not needs_snapshot_sample:
                continue

            result = model.predict(
                source=frame,
                imgsz=YOLO_IMGSZ,
                conf=YOLO_CONF,
                iou=YOLO_IOU,
                verbose=False,
            )[0]
            payload = serialize_result(result, selected_targets)
            plotted_frame = result.plot(boxes=False, labels=False)

            for key in TARGET_KEYS:
                aggregate_metrics[key] += int(payload["metrics"].get(key, 0))
            for label, count in payload["classSummary"].items():
                aggregate_class_summary[label] = aggregate_class_summary.get(label, 0) + count

            preview_candidate_score = int(payload["total"])
            if preview_image is None or preview_candidate_score >= preview_score:
                preview_image = plotted_frame
                preview_detections = payload["detections"]
                preview_score = preview_candidate_score

            if needs_timeline_sample:
                timeline_moment = build_detection_moment(
                    payload,
                    time_sec=actual_time_sec,
                    duration_sec=None,
                    image=plotted_frame,
                    image_max_width=TIMELINE_IMAGE_MAX_WIDTH,
                    image_quality=TIMELINE_IMAGE_QUALITY,
                )
                if timeline_moment is not None:
                    timeline_events.append(timeline_moment)
                last_timeline_time = actual_time_sec

            if needs_snapshot_sample:
                snapshot_moment = build_detection_moment(
                    payload,
                    time_sec=actual_time_sec,
                    duration_sec=None,
                    image=plotted_frame,
                    image_max_width=SNAPSHOT_IMAGE_MAX_WIDTH,
                    image_quality=SNAPSHOT_IMAGE_QUALITY,
                )
                if snapshot_moment is not None:
                    snapshots.append(snapshot_moment)
                last_snapshot_time = actual_time_sec

            analyzed_frames += 1
    finally:
        capture.release()

    if preview_image is None:
        raise ValueError("No frames available from stream source")

    duration_candidates = [
        float(moment.get("timeSec") or 0)
        for moment in [*timeline_events, *snapshots]
    ]
    duration_candidates.append(time.perf_counter() - started_at)
    duration_sec = round(max(duration_candidates), 2) if duration_candidates else None
    media = build_media_payload(
        source_kind=source_kind,
        width=width,
        height=height,
        fps=fps,
        duration_sec=duration_sec,
        frame_count=None,
        timeline_interval_sec=STREAM_TIMELINE_INTERVAL_SEC,
        snapshot_interval_sec=STREAM_SNAPSHOT_INTERVAL_SEC,
    )

    return {
        "metrics": aggregate_metrics,
        "detections": preview_detections,
        "classSummary": aggregate_class_summary,
        "previewImage": encode_preview(preview_image),
        "total": sum(aggregate_metrics.values()),
        "timelineEvents": apply_timeline_positions(timeline_events, duration_sec),
        "snapshots": snapshots,
        "framesAnalyzed": analyzed_frames,
        "frameStride": None,
        "durationSec": duration_sec,
        "media": media,
    }


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/api/reports", methods=["GET", "POST", "OPTIONS"])
def reports():
    if request.method == "OPTIONS":
        return ("", 204)

    if request.method == "POST":
        incoming = request.get_json(silent=True)
        if not isinstance(incoming, dict):
            return jsonify({"error": "Report JSON is required"}), 400

        record = normalize_report_payload(incoming)
        if not record["name"]:
            return jsonify({"error": "Report name is required"}), 400

        created_at = datetime.now(timezone.utc).isoformat()
        with REPORT_DATABASE_LOCK, report_database_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO detection_reports (created_at, payload) VALUES (?, ?)",
                (created_at, json.dumps(record, ensure_ascii=False, separators=(",", ":"))),
            )
            report_id = cursor.lastrowid

        return jsonify({"report": {**record, "id": report_id, "createdAt": created_at}}), 201

    records = []
    with REPORT_DATABASE_LOCK, report_database_connection() as connection:
        rows = connection.execute(
            "SELECT id, created_at, payload FROM detection_reports ORDER BY id DESC"
        ).fetchall()
    for row in rows:
        try:
            payload = json.loads(row["payload"])
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            records.append({**payload, "id": row["id"], "createdAt": row["created_at"]})
    return jsonify({"reports": records})


@app.route("/api/reports/<int:report_id>", methods=["DELETE", "OPTIONS"])
def delete_report(report_id: int):
    if request.method == "OPTIONS":
        return ("", 204)

    with REPORT_DATABASE_LOCK, report_database_connection() as connection:
        cursor = connection.execute("DELETE FROM detection_reports WHERE id = ?", (report_id,))
    if cursor.rowcount == 0:
        return jsonify({"error": "Report not found"}), 404
    return ("", 204)


@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return ("", 204)
    models = list_models()
    default_model_path = PUBLIC_MODELS_DIR / DEFAULT_MODEL_NAME
    return jsonify(
        {
            # The UI is configured for DEFAULT_MODEL_NAME, so another checkpoint
            # in this directory must not make the configured model look ready.
            "status": "ready" if default_model_path.is_file() else "missing-models",
            "apiVersion": 2,
            "features": {
                "videoSessions": True,
            },
            "models": models,
            "defaultModel": DEFAULT_MODEL_NAME,
            "inference": {
                "conf": YOLO_CONF,
                "iou": YOLO_IOU,
                "imgsz": YOLO_IMGSZ,
            },
        }
    )


@app.route("/api/stream", methods=["GET", "OPTIONS"])
def stream_preview():
    if request.method == "OPTIONS":
        return ("", 204)

    source_url = (request.args.get("sourceUrl") or "").strip()
    if not source_url:
        return jsonify({"error": "sourceUrl is required"}), 400

    try:
        model_path = resolve_model_path(request.args.get("modelId"), request.args.get("modelFileName"))
        model = get_model(model_path)
    except Exception as error:
        return jsonify({"error": f"Unable to load detection model: {error}"}), 500

    # Fail before opening the long-lived response so the browser can show its
    # fallback preview when an address is unavailable or malformed.
    probe = open_stream_capture(source_url)
    is_available = probe.isOpened()
    probe.release()
    if not is_available:
        return jsonify({"error": "Unable to open stream source"}), 502

    return Response(
        stream_with_context(stream_preview_frames(source_url, model)),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/api/video-sessions", methods=["POST", "OPTIONS"])
def create_video_session():
    if request.method == "OPTIONS":
        return ("", 204)

    source_file = request.files.get("source")
    if source_file is None or not source_file.filename:
        return jsonify({"error": "Video file is required"}), 400

    selected_targets = {
        target.strip().upper()
        for target in request.form.get("selectedTargets", "").split(",")
        if target.strip()
    }
    model_path = resolve_model_path(request.form.get("modelId"), request.form.get("modelFileName"))
    try:
        model = get_model(model_path)
    except Exception as error:
        return jsonify({"error": f"Unable to start video detection: failed to load model ({error})"}), 500

    session_dir = Path(tempfile.mkdtemp(prefix="target-ui-live-video-"))
    video_path = session_dir / Path(source_file.filename).name
    source_file.save(video_path)

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        capture.release()
        shutil.rmtree(session_dir, ignore_errors=True)
        return jsonify({"error": "Unable to open uploaded video"}), 422

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    capture.release()

    session_id = uuid.uuid4().hex
    session = {
        "id": session_id,
        "directory": session_dir,
        "path": video_path,
        "model": model,
        "selectedTargets": selected_targets,
        "active": True,
        "status": "ready",
        "metrics": empty_metrics(),
        "total": 0,
        "framesProcessed": 0,
        "tracks": [],
        "seenObjects": [],
        "cumulativeMetrics": empty_metrics(),
        "detections": [],
        "timelineEvents": [],
        "snapshots": [],
        "previewImage": None,
        "playback": {
            "paused": False,
            "rate": 1.0,
            "currentTime": 0.0,
        },
        "lastTimelineTime": -float("inf"),
        "lastSnapshotTime": -float("inf"),
        "media": build_media_payload(
            source_kind="video",
            width=width,
            height=height,
            fps=fps,
            duration_sec=round(frame_count / fps, 2) if fps and frame_count else None,
            frame_count=frame_count,
            timeline_interval_sec=STREAM_TIMELINE_INTERVAL_SEC,
            snapshot_interval_sec=STREAM_SNAPSHOT_INTERVAL_SEC,
        ),
    }
    with VIDEO_SESSIONS_LOCK:
        VIDEO_SESSIONS[session_id] = session
    return jsonify(video_session_payload(session)), 201


@app.route("/api/video-sessions/<session_id>", methods=["GET", "DELETE"])
def video_session_status(session_id: str):
    with VIDEO_SESSIONS_LOCK:
        session = VIDEO_SESSIONS.get(session_id)
        if session is None:
            return jsonify({"error": "Video session not found"}), 404

        if request.method == "GET":
            payload = video_session_payload(session)
            if session.get("error"):
                payload["error"] = session["error"]
            return jsonify(payload)

        session["active"] = False
        VIDEO_SESSIONS.pop(session_id, None)

    shutil.rmtree(session["directory"], ignore_errors=True)
    return ("", 204)


@app.route("/api/video-sessions/<session_id>/controls", methods=["POST"])
def control_video_session(session_id: str):
    payload = request.get_json(silent=True) or {}
    action = str(payload.get("action") or "").lower()

    with VIDEO_SESSIONS_LOCK:
        session = VIDEO_SESSIONS.get(session_id)
        if session is None:
            return jsonify({"error": "Video session not found"}), 404

        playback = session["playback"]
        duration_sec = float(session["media"].get("durationSec") or 0)
        if action == "play":
            playback["paused"] = False
        elif action == "pause":
            playback["paused"] = True
        elif action == "stop":
            playback["restartRequested"] = True
            playback["paused"] = True
            playback["currentTime"] = 0.0
        elif action == "restart":
            playback["restartRequested"] = True
            playback["paused"] = False
        elif action == "seek":
            try:
                seek_time = max(0.0, float(payload.get("value", 0)))
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid seek time"}), 400
            playback["seekTime"] = min(seek_time, duration_sec) if duration_sec else seek_time
        elif action == "rate":
            try:
                rate = float(payload.get("value", 1))
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid playback rate"}), 400
            if rate not in {1.0, 1.5, 2.0}:
                return jsonify({"error": "Playback rate must be 1.0, 1.5, or 2.0"}), 400
            playback["rate"] = rate
        else:
            return jsonify({"error": "Unsupported video control"}), 400

        return jsonify(video_session_payload(session))


@app.route("/api/video-sessions/<session_id>/stream", methods=["GET"])
def video_session_stream(session_id: str):
    with VIDEO_SESSIONS_LOCK:
        session = VIDEO_SESSIONS.get(session_id)
    if session is None:
        return jsonify({"error": "Video session not found"}), 404

    return Response(
        stream_with_context(stream_annotated_video_session(session_id)),
        mimetype="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/api/detect", methods=["POST", "OPTIONS"])
def detect():
    if request.method == "OPTIONS":
        return ("", 204)

    source_file = request.files.get("source")
    source_url = (request.form.get("sourceUrl") or "").strip()
    if (source_file is None or not source_file.filename) and not source_url:
        return jsonify({"error": "Source file or sourceUrl is required"}), 400

    selected_targets = {
        target.strip().upper()
        for target in request.form.get("selectedTargets", "").split(",")
        if target.strip()
    }
    model_path = resolve_model_path(request.form.get("modelId"), request.form.get("modelFileName"))
    model = get_model(model_path)
    started_at = time.perf_counter()

    if source_file is not None and source_file.filename:
        source_kind = request.form.get("sourceKind") or guess_source_kind(source_file.filename, source_file.mimetype)
        with tempfile.TemporaryDirectory(prefix="target-ui-inference-") as temp_dir_name:
            temp_dir = Path(temp_dir_name)
            source_path = temp_dir / Path(source_file.filename).name
            source_file.save(source_path)

            try:
                if source_kind == "video":
                    payload = run_video_detection(model, source_path, selected_targets)
                else:
                    payload = run_image_detection(model, source_path, selected_targets)
            except ValueError as error:
                return jsonify({"error": str(error)}), 422
    else:
        source_kind = request.form.get("sourceKind") or guess_url_source_kind(source_url)
        try:
            if source_kind == "image":
                payload = run_image_detection_source(model, load_remote_image(source_url), selected_targets)
            else:
                payload = run_stream_detection(
                    model,
                    source_url,
                    selected_targets,
                    source_kind=source_kind if source_kind in {"video", "stream"} else "stream",
                )
        except ValueError as error:
            return jsonify({"error": str(error)}), 422

    payload["sourceKind"] = payload.get("media", {}).get("sourceKind") or source_kind
    payload["model"] = {
        "id": model_path.stem,
        "fileName": model_path.name,
        "classNames": list(getattr(model, "names", {}).values()),
    }
    payload["inference"] = {
        "conf": YOLO_CONF,
        "iou": YOLO_IOU,
        "imgsz": YOLO_IMGSZ,
    }
    payload["elapsedMs"] = round((time.perf_counter() - started_at) * 1000, 2)
    return jsonify(payload)


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "8000")),
        debug=False,
        threaded=True,
    )
