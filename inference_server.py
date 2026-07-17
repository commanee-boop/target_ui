from __future__ import annotations

import base64
import os
import re
import tempfile
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import cv2
import numpy as np
from flask import Flask, jsonify, request
from ultralytics import YOLO


ROOT = Path(__file__).resolve().parent
PUBLIC_MODELS_DIR = ROOT / "public" / "models"
DEFAULT_MODEL_NAME = "rm-img.pt"
TARGET_KEYS = ("MV", "AMV", "LMV", "AFV", "CV", "MCV")
MODEL_CACHE: dict[str, YOLO] = {}
YOLO_CONF = 0.7
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

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".webm"}

app = Flask(__name__)


def normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def empty_metrics() -> dict[str, int]:
    return {key: 0 for key in TARGET_KEYS}


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
    preview_image = result.plot()
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
            plotted_frame = result.plot()
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
    capture = cv2.VideoCapture(source_url)
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
            plotted_frame = result.plot()

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
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/api/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return ("", 204)
    models = list_models()
    return jsonify(
        {
            "status": "ready" if models else "missing-models",
            "models": models,
            "defaultModel": DEFAULT_MODEL_NAME,
            "inference": {
                "conf": YOLO_CONF,
                "iou": YOLO_IOU,
                "imgsz": YOLO_IMGSZ,
            },
        }
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

            if source_kind == "video":
                payload = run_video_detection(model, source_path, selected_targets)
            else:
                payload = run_image_detection(model, source_path, selected_targets)
    else:
        source_kind = request.form.get("sourceKind") or guess_url_source_kind(source_url)
        if source_kind == "image":
            payload = run_image_detection_source(model, load_remote_image(source_url), selected_targets)
        else:
            payload = run_stream_detection(
                model,
                source_url,
                selected_targets,
                source_kind=source_kind if source_kind in {"video", "stream"} else "stream",
            )

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
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "8000")), debug=False)
