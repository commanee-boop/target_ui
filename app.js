const { createApp } = Vue;

createApp({
  data() {
    return {
      clockTime: "10:15:37",
      clockDate: "08/07/69",
      currentView: "detect",
      theme: "dark",
      running: false,
      fullscreenActive: false,
      sidebarCollapsed: false,
      inputMode: "url",
      streamUrl: "",
      sourceSlots: [
        { id: 1, url: "", fileName: "", fileUrl: "", fileType: "" }
      ],
      nextSourceId: 2,
      selectedTargets: [],
      selectedModel: "yolo-25",
      selectedReportId: 1,
      reportPageSize: 10,
      selectedFileName: "",
      connectLabel: "Connect",
      connectionText: "Stream disconnected",
      selectedSnapshot: null,
      saveDialog: {
        open: false,
        confirm: false,
        source: null,
        fileName: ""
      },
      logIndex: 0,
      timer: null,
      clockTimer: null,
      metrics: {
        AMV: 15,
        LMV: 23,
        AFV: 7,
        CV: 4,
        MCV: 6
      },
      logs: [
        { id: 1, time: "10:15:30", message: "เชื่อมต่อแหล่งข้อมูล: https://example.com/stream" },
        { id: 2, time: "10:15:31", message: "โหลดโมเดล AI สำเร็จ" },
        { id: 3, time: "10:15:32", message: "เริ่มการประมวลผลวิดีโอ" },
        { id: 4, time: "10:15:35", message: "ตรวจพบ AMV <strong>(Confidence: 0.92)</strong>" },
        { id: 5, time: "10:15:36", message: "ตรวจพบ LMV <strong>(Confidence: 0.88)</strong>" },
        { id: 6, time: "10:15:37", message: "ตรวจพบ AMV <strong>(Confidence: 0.95)</strong>" },
        { id: 7, time: "10:15:40", message: "ตรวจพบ AFV <strong>(Confidence: 0.90)</strong>" }
      ],
      generatedEvents: [
        "ตรวจพบ MCV <strong>(Confidence: 0.87)</strong>",
        "ตรวจพบ CV <strong>(Confidence: 0.91)</strong>",
        "อัปเดตกรอบตรวจจับบนภาพ Live",
        "สร้าง Snapshot อัตโนมัติ",
        "ตรวจพบ AMV <strong>(Confidence: 0.94)</strong>"
      ],
      detectionModels: [
        { id: "yolo-25", name: "YOLO 25", detail: "Fast object detection model" },
        { id: "yolo-v10", name: "YOLO v10", detail: "Balanced speed and precision" },
        { id: "yolo-v8", name: "YOLO v8", detail: "General purpose detection" },
        { id: "faster-rcnn", name: "Faster R-CNN", detail: "High precision detection" }
      ],
      reportRecords: [
        {
          id: 1,
          name: "convoy_2025_05_20_01",
          source: "https://stream.example.com/convoy1",
          ext: "MP4",
          kind: "video",
          duration: "00:02:15",
          date: "20 พ.ค. 2025",
          time: "10:15:30",
          size: "1.24 GB",
          resolution: "1920 x 1080",
          fps: "25",
          recorder: "admin",
          tags: ["AMV", "LMV"],
          metrics: { AMV: 18, LMV: 32, AFV: 5, CV: 2, MCV: 0 },
          image: "assets/surveillance-road.png"
        },
        {
          id: 2,
          name: "border_area_night",
          source: "https://stream.example.com/night",
          ext: "MP4",
          kind: "video",
          duration: "00:01:45",
          date: "20 พ.ค. 2025",
          time: "02:45:10",
          size: "856 MB",
          resolution: "1920 x 1080",
          fps: "25",
          recorder: "admin",
          tags: ["AMV", "AFV", "CV"],
          metrics: { AMV: 6, LMV: 0, AFV: 3, CV: 1, MCV: 0 },
          image: "assets/surveillance-road.png"
        },
        {
          id: 3,
          name: "checkpoint_photo_01",
          source: "อัปโหลดโดย admin",
          ext: "JPG",
          kind: "image",
          duration: "ภาพนิ่ง",
          date: "19 พ.ค. 2025",
          time: "16:20:05",
          size: "2.45 MB",
          resolution: "2560 x 1440",
          fps: "-",
          recorder: "admin",
          tags: ["AMV", "LMV"],
          metrics: { AMV: 4, LMV: 7, AFV: 0, CV: 0, MCV: 0 },
          image: "assets/surveillance-road.png"
        },
        {
          id: 4,
          name: "military_base_overview",
          source: "อัปโหลดโดย user02",
          ext: "MP4",
          kind: "video",
          duration: "00:03:05",
          date: "19 พ.ค. 2025",
          time: "09:10:22",
          size: "2.11 GB",
          resolution: "1920 x 1080",
          fps: "25",
          recorder: "user02",
          tags: ["AFV", "CV", "MCV"],
          metrics: { AMV: 0, LMV: 0, AFV: 12, CV: 3, MCV: 8 },
          image: "assets/surveillance-road.png"
        },
        {
          id: 5,
          name: "vehicle_column_03",
          source: "อัปโหลดโดย admin",
          ext: "PNG",
          kind: "image",
          duration: "ภาพนิ่ง",
          date: "18 พ.ค. 2025",
          time: "14:33:18",
          size: "3.12 MB",
          resolution: "3840 x 2160",
          fps: "-",
          recorder: "admin",
          tags: ["AMV", "LMV", "MCV"],
          metrics: { AMV: 9, LMV: 14, AFV: 0, CV: 0, MCV: 3 },
          image: "assets/surveillance-road.png"
        },
        {
          id: 6,
          name: "desert_patrol_01",
          source: "https://stream.example.com/desert",
          ext: "MP4",
          kind: "video",
          duration: "00:01:30",
          date: "18 พ.ค. 2025",
          time: "11:05:44",
          size: "678 MB",
          resolution: "1280 x 720",
          fps: "30",
          recorder: "admin",
          tags: ["LMV"],
          metrics: { AMV: 0, LMV: 11, AFV: 0, CV: 0, MCV: 0 },
          image: "assets/surveillance-road.png"
        }
      ],
      reportStats: {
        files: "236",
        videos: "98",
        images: "138",
        detections: "12,845",
        storage: "128.7 GB"
      },
      snapshots: ["AMV", "LMV", "AFV", "AMV", "CV", "MCV"].map((type, index) => ({
        type,
        time: `00:00:${String(index * 10).padStart(2, "0")}`
      }))
    };
  },
  computed: {
    totalCount() {
      return Object.values(this.metrics).reduce((sum, value) => sum + value, 0);
    },
    themeTitle() {
      return this.theme === "light" ? "เปลี่ยนเป็นโหมดมืด" : "เปลี่ยนเป็นโหมดสว่าง";
    },
    fileAccept() {
      return "video/*,image/*";
    },
    sourceStatus() {
      const count = this.activeSources.length;
      if (this.inputMode === "url") return count ? `${count} stream source${count > 1 ? "s" : ""} ready` : "Stream disconnected";
      return count ? `${count} media source${count > 1 ? "s" : ""} ready` : "Select up to 4 video or picture files";
    },
    sourceStatusClass() {
      return this.activeSources.length ? "is-connected" : "is-disconnected";
    },
    activeSources() {
      return this.sourceSlots
        .filter((slot) => this.inputMode === "url" ? slot.url.trim() : slot.fileName)
        .map((slot, index) => ({
          id: slot.id,
          label: this.inputMode === "url" ? slot.url.trim() : slot.fileName,
          src: this.inputMode === "url" ? slot.url.trim() : slot.fileUrl,
          mediaKind: this.inputMode === "url" ? "stream" : slot.fileType,
          cameraLabel: `CAM ${index + 1}`
        }));
    },
    previewSourceCount() {
      return Math.max(1, Math.min(this.activeSources.length, 4));
    },
    monitoringSources() {
      return this.activeSources.length
        ? this.activeSources
        : [{ id: "default-source", label: "Preview source", cameraLabel: "CAM 1" }];
    },
    sourceMetrics() {
      return this.monitoringSources.map((source, index) => {
        const scale = index + 1;
        const metrics = {
          AMV: this.metrics.AMV + index * 2,
          LMV: Math.max(0, this.metrics.LMV - scale),
          AFV: this.metrics.AFV + index,
          CV: this.metrics.CV + (index % 2),
          MCV: this.metrics.MCV + index
        };
        const total = Object.values(metrics).reduce((sum, value) => sum + value, 0);

        return { source, metrics, total };
      });
    },
    sourceSnapshots() {
      return this.monitoringSources.map((source) => ({
        source,
        snapshots: this.snapshots.slice(0, 4).map((snapshot, index) => ({
          ...snapshot,
          boxClass: `popup-box-${index + 1}`
        }))
      }));
    },
    timelineEvents() {
      return [
        { left: 2, type: "AMV", time: "00:00:12", className: "amv", boxClass: "popup-box-1" },
        { left: 9, type: "AMV", time: "00:00:54", className: "amv", boxClass: "popup-box-4" },
        { left: 14, type: "LMV", time: "00:01:24", className: "lmv", boxClass: "popup-box-2" },
        { left: 21, type: "MCV", time: "00:02:06", className: "mcv", boxClass: "popup-box-4" },
        { left: 31, type: "AFV", time: "00:03:06", className: "afv", boxClass: "popup-box-3" },
        { left: 46, type: "CV", time: "00:04:36", className: "cv", boxClass: "popup-box-2" },
        { left: 57, type: "AMV", time: "00:05:42", className: "amv", boxClass: "popup-box-1" },
        { left: 69, type: "AFV", time: "00:06:54", className: "afv", boxClass: "popup-box-3" },
        { left: 82, type: "CV", time: "00:08:12", className: "cv", boxClass: "popup-box-2" },
        { left: 94, type: "MCV", time: "00:09:24", className: "mcv", boxClass: "popup-box-4" }
      ];
    },
    sourceLogs() {
      return this.monitoringSources.map((source) => ({
        source,
        logs: this.visibleLogs.slice(0, 5)
      }));
    },
    selectedModelName() {
      return this.detectionModels.find((model) => model.id === this.selectedModel)?.name || "Select model";
    },
    targetTypes() {
      return ["AMV", "LMV", "AFV", "CV", "MCV"];
    },
    allTargetsSelected() {
      return this.targetTypes.every((type) => this.selectedTargets.includes(type));
    },
    canSaveData() {
      return Boolean(this.activeSources.length && this.selectedTargets.length && this.selectedModel && this.running);
    },
    saveDisabledReason() {
      if (!this.activeSources.length) return "Input source required";
      if (!this.selectedTargets.length) return "Target selection required";
      if (!this.selectedModel) return "Detection model required";
      if (!this.running) return "Start detection before saving";
      return "Save detection data";
    },
    visibleLogs() {
      return this.logs.slice(0, 9);
    },
    normalizedReportPageSize() {
      const pageSize = Number(this.reportPageSize);
      return Number.isFinite(pageSize) ? Math.max(10, Math.floor(pageSize)) : 10;
    },
    visibleReportRecords() {
      const visibleCount = Math.min(this.normalizedReportPageSize, 236);

      return Array.from({ length: visibleCount }, (_, index) => {
        const baseRecord = this.reportRecords[index % this.reportRecords.length];
        const pageNumber = Math.floor(index / this.reportRecords.length);
        return {
          ...baseRecord,
          displayId: `${baseRecord.id}-${index}`,
          displayIndex: index + 1,
          name: pageNumber ? `${baseRecord.name}_${String(pageNumber + 1).padStart(2, "0")}` : baseRecord.name
        };
      });
    },
    selectedReport() {
      return this.reportRecords.find((record) => record.id === this.selectedReportId) || this.reportRecords[0];
    },
    selectedReportTotal() {
      return Object.values(this.selectedReport.metrics).reduce((sum, value) => sum + value, 0);
    }
  },
  watch: {
    currentView(nextView) {
      document.body.classList.toggle("report-view", nextView === "report");
      this.$nextTick(this.syncViewLayout);
    },
    theme(nextTheme) {
      document.body.classList.toggle("theme-light", nextTheme === "light");
      localStorage.setItem("target-ui-theme", nextTheme);
    }
  },
  mounted() {
    this.moveSetupPanelToSidebar();
    this.syncSidebarState();
    this.updateClock();
    this.clockTimer = window.setInterval(this.updateClock, 1000);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.body.classList.toggle("theme-light", this.theme === "light");
    document.body.classList.toggle("report-view", this.currentView === "report");
    this.$nextTick(this.syncViewLayout);
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
    window.clearInterval(this.clockTimer);
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    this.sourceSlots.forEach((slot) => {
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
    });
  },
  methods: {
    setView(view) {
      this.currentView = view;
      document.body.classList.toggle("report-view", view === "report");
      this.$nextTick(this.syncViewLayout);
    },
    syncViewLayout() {
      const appShell = document.querySelector(".app-shell");
      const sidebar = document.querySelector(".sidebar");
      const workspace = document.querySelector(".workspace");
      const reportPage = document.querySelector(".report-page");
      const isReport = this.currentView === "report";

      if (!appShell || !workspace) return;

      document.body.classList.toggle("report-view", isReport);
      appShell.classList.toggle("is-report-view", isReport);

      if (isReport) {
        appShell.style.display = "block";
        appShell.style.gridTemplateColumns = "1fr";
        appShell.style.width = "100vw";
        appShell.style.maxWidth = "none";
        appShell.style.margin = "0";
        appShell.style.padding = "0";

        if (sidebar) {
          sidebar.style.display = "none";
          sidebar.style.width = "0";
          sidebar.style.minWidth = "0";
        }

        workspace.style.display = "block";
        workspace.style.gridColumn = "1 / -1";
        workspace.style.width = "100vw";
        workspace.style.maxWidth = "none";
        workspace.style.margin = "0";
        workspace.style.padding = "1rem 1rem 1.35rem";
        workspace.style.transform = "none";

        if (reportPage) {
          reportPage.style.display = "grid";
          reportPage.style.width = "100%";
          reportPage.style.maxWidth = "none";
          reportPage.style.margin = "0";
          reportPage.style.padding = "0";
        }
        return;
      }

      appShell.style.display = "";
      appShell.style.gridTemplateColumns = "";
      appShell.style.width = "";
      appShell.style.maxWidth = "";
      appShell.style.margin = "";
      appShell.style.padding = "";

      if (sidebar) {
        sidebar.style.display = "";
        sidebar.style.width = "";
        sidebar.style.minWidth = "";
      }

      workspace.style.display = "";
      workspace.style.gridColumn = "";
      workspace.style.width = "";
      workspace.style.maxWidth = "";
      workspace.style.margin = "";
      workspace.style.padding = "";
      workspace.style.transform = "";

      if (reportPage) {
        reportPage.style.display = "none";
        reportPage.style.width = "";
        reportPage.style.maxWidth = "";
        reportPage.style.margin = "";
        reportPage.style.padding = "";
      }
    },
    moveSetupPanelToSidebar() {
      const appShell = document.querySelector(".app-shell");
      const sidebar = document.querySelector(".sidebar");
      const topbar = document.querySelector(".topbar");
      const sidebarBrand = document.querySelector(".sidebar-brand");
      const setupGrid = document.querySelector(".setup-grid");

      if (appShell && topbar && topbar.parentElement !== appShell) {
        appShell.prepend(topbar);
      }

      if (topbar && sidebarBrand && !topbar.contains(sidebarBrand)) {
        topbar.prepend(sidebarBrand);
      }

      if (sidebarBrand) {
        sidebarBrand.remove();
      }

      if (!sidebar || !setupGrid || sidebar.contains(setupGrid)) return;
      sidebar.appendChild(setupGrid);
    },
    updateClock() {
      const now = new Date();
      this.clockDate = now.toLocaleDateString("th-TH-u-nu-latn", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      });
      this.clockTime = now.toLocaleTimeString("th-TH-u-nu-latn", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    },
    connectStream() {
      if (!this.activeSources.length) {
        this.connectionText = "Stream disconnected";
        return;
      }

      this.connectionText = "Stream connected";
      this.connectLabel = "Connected";

      window.setTimeout(() => {
        this.connectLabel = "Connect";
      }, 1400);
    },
    setInputMode(mode) {
      this.inputMode = mode;
      this.resetSourceSlots();
    },
    addSourceSlot() {
      if (this.sourceSlots.length >= 4) return;
      this.sourceSlots.push({ id: this.nextSourceId, url: "", fileName: "", fileUrl: "", fileType: "" });
      this.nextSourceId += 1;
    },
    removeSourceSlot(slot) {
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      this.sourceSlots = this.sourceSlots.filter((item) => item.id !== slot.id);
      if (!this.sourceSlots.length) {
        this.addSourceSlot();
      }
    },
    resetSourceSlots() {
      this.sourceSlots.forEach((slot) => {
        if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      });
      this.sourceSlots = [{ id: 1, url: "", fileName: "", fileUrl: "", fileType: "" }];
      this.nextSourceId = 2;
      this.streamUrl = "";
      this.selectedFileName = "";
      this.connectionText = "Stream disconnected";
      this.connectLabel = "Connect";
    },
    handleFileSelect(event, slot) {
      const [file] = event.target.files;
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      slot.fileName = file ? file.name : "";
      slot.fileUrl = file ? URL.createObjectURL(file) : "";
      slot.fileType = file ? file.type : "";
    },
    clearInputData() {
      this.inputMode = "url";
      this.resetSourceSlots();
    },
    resetPageData() {
      window.clearInterval(this.timer);
      this.running = false;
      this.inputMode = "url";
      this.resetSourceSlots();
      this.selectedTargets = [];
      this.selectedModel = "yolo-25";
      this.sidebarCollapsed = false;
      this.connectLabel = "Connect";
      this.connectionText = "Stream disconnected";
      this.logIndex = 0;
      this.syncSidebarState(false);
      this.metrics = {
        AMV: 15,
        LMV: 23,
        AFV: 7,
        CV: 4,
        MCV: 6
      };
      this.logs = [
        { id: 1, time: "10:15:30", message: "เชื่อมต่อแหล่งข้อมูล: https://example.com/stream" },
        { id: 2, time: "10:15:31", message: "โหลดโมเดล AI สำเร็จ" },
        { id: 3, time: "10:15:32", message: "เริ่มการประมวลผลวิดีโอ" },
        { id: 4, time: "10:15:35", message: "ตรวจพบ AMV <strong>(Confidence: 0.92)</strong>" },
        { id: 5, time: "10:15:36", message: "ตรวจพบ LMV <strong>(Confidence: 0.88)</strong>" },
        { id: 6, time: "10:15:37", message: "ตรวจพบ AMV <strong>(Confidence: 0.95)</strong>" },
        { id: 7, time: "10:15:40", message: "ตรวจพบ AFV <strong>(Confidence: 0.90)</strong>" }
      ];
    },
    toggleSidebar() {
      this.syncSidebarState(!this.sidebarCollapsed);
    },
    syncSidebarState(nextState = this.sidebarCollapsed) {
      this.sidebarCollapsed = nextState;

      document.querySelector(".app-shell")?.classList.toggle("is-sidebar-collapsed", nextState);
      document.querySelector(".sidebar")?.classList.toggle("is-collapsed", nextState);
      document.querySelector(".collapse-menu")?.classList.toggle("is-collapsed", nextState);
    },
    async toggleFullscreen() {
      const liveFrame = this.$refs.liveFrame;
      if (!liveFrame) return;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }

        await liveFrame.requestFullscreen();
      } catch (error) {
        this.fullscreenActive = false;
      }
    },
    handleFullscreenChange() {
      this.fullscreenActive = document.fullscreenElement === this.$refs.liveFrame;
    },
    selectTarget(type) {
      if (type === "ALL") {
        this.selectedTargets = this.allTargetsSelected ? [] : [...this.targetTypes];
        return;
      }

      if (this.selectedTargets.includes(type)) {
        this.selectedTargets = this.selectedTargets.filter((target) => target !== type);
      } else {
        this.selectedTargets = [...this.selectedTargets, type];
      }
    },
    isTargetSelected(type) {
      if (type === "ALL") return this.allTargetsSelected;
      return this.selectedTargets.includes(type);
    },
    openSnapshotPopup(snapshot, source) {
      this.selectedSnapshot = { ...snapshot, source };
    },
    openTimelinePopup(event, source) {
      this.selectedSnapshot = { ...event, source };
    },
    closeSnapshotPopup() {
      this.selectedSnapshot = null;
    },
    openSaveDialog(source) {
      if (!this.canSaveData) return;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      this.saveDialog = {
        open: true,
        confirm: false,
        source,
        fileName: `${source.cameraLabel.toLowerCase().replace(/\s+/g, "-")}_${timestamp}`
      };
    },
    closeSaveDialog() {
      this.saveDialog = {
        open: false,
        confirm: false,
        source: null,
        fileName: ""
      };
    },
    requestSaveConfirm() {
      if (!this.saveDialog.fileName.trim()) return;
      this.saveDialog.confirm = true;
    },
    cancelSaveConfirm() {
      this.saveDialog.confirm = false;
    },
    confirmSaveData() {
      const source = this.saveDialog.source;
      const fileName = this.saveDialog.fileName.trim();
      if (!this.canSaveData || !source || !fileName) return;

      const time = new Date().toLocaleTimeString("th-TH-u-nu-latn", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const date = new Date().toLocaleDateString("th-TH-u-nu-latn", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      const metrics = this.buildSavedMetrics(source);
      const reportRecord = {
        id: Date.now(),
        name: fileName.replace(/\.[^.]+$/, ""),
        source: source.label || source.src || source.cameraLabel,
        ...this.getSavedFileMeta(source, fileName),
        date,
        time,
        resolution: "1920 x 1080",
        fps: source.mediaKind?.startsWith("image") ? "-" : "25",
        recorder: "admin",
        tags: [...this.selectedTargets],
        metrics,
        image: "assets/surveillance-road.png",
        model: this.selectedModelName
      };

      this.reportRecords.unshift(reportRecord);
      this.selectedReportId = reportRecord.id;
      this.updateReportStats(reportRecord);

      this.logs.unshift({
        id: Date.now(),
        time,
        message: `บันทึกข้อมูล ${source?.cameraLabel || "CAM"} เป็นไฟล์ <strong>${fileName}</strong>`
      });
      this.closeSaveDialog();
    },
    buildSavedMetrics(source) {
      const sourceIndex = Math.max(0, this.monitoringSources.findIndex((item) => item.id === source.id));
      const summary = this.sourceMetrics[sourceIndex]?.metrics || this.metrics;

      return this.targetTypes.reduce((savedMetrics, type) => {
        savedMetrics[type] = this.selectedTargets.includes(type) ? summary[type] : 0;
        return savedMetrics;
      }, {});
    },
    getSavedFileMeta(source, fileName) {
      const sourceText = `${fileName} ${source.label || ""}`.toLowerCase();
      const isImage = source.mediaKind?.startsWith("image") || /\.(jpg|jpeg|png|webp)(?:\s|$)/i.test(sourceText);
      const extMatch = sourceText.match(/\.([a-z0-9]+)(?:\s|$)/i);
      const ext = extMatch ? extMatch[1].toUpperCase() : (isImage ? "JPG" : "MP4");

      return {
        ext,
        kind: isImage ? "image" : "video",
        duration: isImage ? "ภาพนิ่ง" : "00:02:15",
        size: isImage ? "2.45 MB" : "1.24 GB"
      };
    },
    updateReportStats(record) {
      const toNumber = (value) => Number(String(value).replace(/,/g, "")) || 0;
      const savedDetections = Object.values(record.metrics).reduce((sum, value) => sum + value, 0);

      this.reportStats.files = String(toNumber(this.reportStats.files) + 1);
      this.reportStats.detections = (toNumber(this.reportStats.detections) + savedDetections).toLocaleString("en-US");

      if (record.kind === "image") {
        this.reportStats.images = String(toNumber(this.reportStats.images) + 1);
      } else {
        this.reportStats.videos = String(toNumber(this.reportStats.videos) + 1);
      }
    },
    selectReport(record) {
      this.selectedReportId = record.id;
    },
    normalizeReportPageSize() {
      this.reportPageSize = this.normalizedReportPageSize;
    },
    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
    },
    toggleRunning() {
      this.setRunning(!this.running);
    },
    setRunning(next) {
      this.running = next;

      if (this.running) {
        this.tickDetection();
        this.timer = window.setInterval(this.tickDetection, 2200);
      } else {
        window.clearInterval(this.timer);
      }
    },
    tickDetection() {
      const time = new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      const message = this.generatedEvents[this.logIndex % this.generatedEvents.length];
      const metricKeys = Object.keys(this.metrics);
      const targetKey = metricKeys[this.logIndex % metricKeys.length];

      this.logs.unshift({
        id: Date.now() + this.logIndex,
        time,
        message
      });
      this.metrics[targetKey] += 1;
      this.logIndex += 1;
    }
  }
}).mount("#app");
