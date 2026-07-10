const { createApp } = Vue;

createApp({
  data() {
    return {
      clockTime: "10:15:37",
      clockDate: "08/07/69",
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
      selectedFileName: "",
      connectLabel: "Connect",
      connectionText: "Stream disconnected",
      selectedSnapshot: null,
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
    visibleLogs() {
      return this.logs.slice(0, 9);
    }
  },
  watch: {
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
