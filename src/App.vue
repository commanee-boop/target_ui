<template>
<div class="app-shell" :class="{ 'is-sidebar-collapsed': sidebarCollapsed, 'is-report-view': currentView === 'report' }" v-cloak>
      <aside v-show="currentView === 'detect'" class="sidebar" :class="{ 'is-collapsed': sidebarCollapsed }" aria-label="เมนูหลัก">
        <nav class="nav-list">
          <button class="nav-item is-active" title="นำเข้าข้อมูล" aria-label="นำเข้าข้อมูล">
            <span class="nav-number">1</span>
            <span>นำเข้าข้อมูล</span>
          </button>
          <button class="nav-item" title="เลือกวัตถุ" aria-label="เลือกวัตถุ">
            <span class="nav-number">2</span>
            <span>เลือกวัตถุ</span>
          </button>
          <button class="nav-item" title="เริ่มตรวจจับ" aria-label="เริ่มตรวจจับ">
            <span class="nav-number">3</span>
            <span>เริ่มตรวจจับ</span>
          </button>
        </nav>
      </aside>

      <main class="workspace">
        <header class="topbar">
          <div class="top-brand" aria-label="ระบบตรวจจับเป้าหมายทางทหาร">
            <img src="/assets/target-command-logo.png" alt="" />
            <div class="top-brand-copy">
              <strong>MILITARY TARGET DETECTION SYSTEM</strong>
              <span>ระบบตรวจจับเป้าหมายทางทหาร</span>
            </div>
          </div>
          <div class="top-menu" aria-label="เมนูด้านบน">
            <button class="top-menu-item" :class="{ 'is-active': currentView === 'detect' }" title="ตรวจจับเป้าหมาย" aria-label="ตรวจจับเป้าหมาย" @click="setView('detect')">
              <span class="bi bi-crosshair"></span>
              <span>ตรวจจับเป้าหมาย</span>
            </button>
            <button class="top-menu-item" :class="{ 'is-active': currentView === 'report' }" title="รายงานบันทึกข้อมูล" aria-label="รายงานบันทึกข้อมูล" @click="setView('report')">
              <span class="bi bi-clipboard-data"></span>
              <span>รายงานบันทึกข้อมูล</span>
            </button>
          </div>
          <div class="operator-cluster">
            <button id="themeToggle" class="theme-toggle" type="button" :title="themeTitle" :aria-label="themeTitle" :aria-pressed="theme === 'light'" @click="toggleTheme">
              <span class="bi" :class="theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'" aria-hidden="true"></span>
            </button>
            <div class="clock">
              <span id="clockDate">{{ clockDate }}</span>
              <span id="clock">{{ clockTime }}</span>
            </div>
            <div class="status-pills" aria-label="สถานะระบบ">
              <span></span>
              <span></span>
            </div>
            <div class="operator">
              <div class="avatar">A</div>
              <div>
                <strong>ผู้ดูแลระบบ</strong>
                <span>Administrator</span>
              </div>
            </div>
            <button class="logout-button" title="Logout" aria-label="Logout">
              <span class="bi bi-box-arrow-right"></span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <section v-show="currentView === 'detect'" class="setup-grid" aria-label="ขั้นตอนการตรวจจับ">
          <article class="sidebar-tools" aria-label="Target configuration tools">
            <div class="tools-title">
              <span class="tools-mark"><span class="bi bi-sliders"></span></span>
              <div>
                <strong>Target Configuration</strong>
                <span>Input and detection setup</span>
              </div>
            </div>
            <div class="tools-actions">
              <button class="tool-action clear-input" type="button" title="Clear input data" aria-label="Clear input data" @click="clearInputData">
                <span class="bi bi-eraser"></span>
              </button>
              <button class="tool-action reset-page" type="button" title="Reset all data" aria-label="Reset all data" @click="resetPageData">
                <span class="bi bi-arrow-clockwise"></span>
              </button>
              <button class="tool-action collapse-menu" :class="{ 'is-collapsed': sidebarCollapsed }" type="button" :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click.prevent.stop="toggleSidebar">
                <span class="bi bi-chevron-left"></span>
              </button>
            </div>
          </article>

          <article class="panel step-panel">
            <div class="step-head">
              <span class="step-number step-source">1</span>
              <h2>Input Source</h2>
            </div>
            <div class="source-tabs" role="tablist" aria-label="Input source type">
              <button class="source-tab" :class="{ 'is-active': inputMode === 'url' }" @click="setInputMode('url')">URL / STREAM</button>
              <button class="source-tab" :class="{ 'is-active': inputMode === 'file' }" @click="setInputMode('file')">VIDEO / PICTURE</button>
            </div>
            <div v-if="inputMode === 'url'" class="source-list">
              <div v-for="(slot, index) in sourceSlots" :key="slot.id" class="source-slot">
                <span class="source-index">CAM {{ index + 1 }}</span>
                <input v-model="slot.url" type="url" :aria-label="`URL stream ${index + 1}`" placeholder="rtsp:// or https:// stream" />
                <button class="source-remove" type="button" title="Remove source" aria-label="Remove source" :disabled="sourceSlots.length === 1" @click="removeSourceSlot(slot)"><span class="bi bi-x-lg"></span></button>
              </div>
              <div class="source-actions-row">
                <button class="secondary-small" type="button" :disabled="sourceSlots.length >= 4" @click="addSourceSlot">Add source</button>
                <button id="connectBtn" class="primary-small" @click="connectStream">{{ connectLabel }}</button>
              </div>
            </div>
            <div v-else class="source-list">
              <div v-for="(slot, index) in sourceSlots" :key="slot.id" class="source-slot file-source">
                <span class="source-index">CAM {{ index + 1 }}</span>
                <label class="file-button-inline">
                  <input class="hidden-file" type="file" :accept="fileAccept" @change="handleFileSelect($event, slot)" />
                  <span>{{ slot.fileName || 'Choose Video / Picture' }}</span>
                </label>
                <button class="source-remove" type="button" title="Remove source" aria-label="Remove source" :disabled="sourceSlots.length === 1" @click="removeSourceSlot(slot)"><span class="bi bi-x-lg"></span></button>
              </div>
              <div class="source-actions-row">
                <button class="secondary-small" type="button" :disabled="sourceSlots.length >= 4" @click="addSourceSlot">Add source</button>
                <button class="primary-small" @click="connectStream">{{ connectLabel }}</button>
              </div>
            </div>
            <div class="connection-state" :class="sourceStatusClass">
              <span></span>
              <strong id="connectionText">{{ sourceStatus }}</strong>
            </div>
          </article>

          <article class="panel step-panel target-panel target-class-panel">
            <button class="target-class-head" type="button" :aria-expanded="!targetPanelCollapsed" @click="targetPanelCollapsed = !targetPanelCollapsed">
              <span class="bi bi-bullseye"></span>
              <strong>TARGET CLASSES</strong>
              <span class="target-head-chevron"></span>
            </button>
            <div v-show="!targetPanelCollapsed" class="target-class-list" id="targetGrid">
              <button class="target-class-row" :class="{ 'is-selected': isTargetSelected('ALL'), 'is-muted': !isTargetSelected('ALL') }" type="button" data-type="ALL" title="Select all target classes" aria-label="Select all target classes" @click="selectTarget('ALL')">
                <span class="target-check" aria-hidden="true"></span>
                <span class="bi bi-list-check target-class-icon" aria-hidden="true"></span>
                <span class="target-class-copy">SELECT ALL</span>
                <span class="target-class-action"></span>
              </button>
              <button v-for="target in targetClassOptions" :key="target.id" class="target-class-row" :class="{ 'is-selected': isTargetSelected(target.id), 'is-muted': !isTargetSelected(target.id) }" type="button" :data-type="target.id" :title="target.detail" :aria-label="target.detail" @click="selectTarget(target.id)">
                <span class="target-check" aria-hidden="true"></span>
                <span class="bi target-class-icon" :class="targetTypeIconClass(target.id)" aria-hidden="true"></span>
                <span class="target-class-copy">
                  <strong>{{ target.id }}</strong>
                  <small>{{ target.detail }}</small>
                </span>
                <span class="target-color-swatch" :style="{ '--target-row-color': target.color }"></span>
              </button>
            </div>
          </article>

          <article class="panel step-panel model-panel">
            <div class="step-head">
              <span class="step-number step-model">3</span>
              <h2>Detection Model</h2>
            </div>
            <label class="model-select">
              <span>Model</span>
              <select v-model="selectedModel" aria-label="Detection model">
                <option v-for="model in detectionModels" :key="model.id" :value="model.id">
                  {{ model.name }}
                </option>
              </select>
            </label>
            <div class="model-summary">
              <span class="processor">AI</span>
              <div>
                <strong>{{ selectedModelName }}</strong>
                <span>{{ detectionModels.find((model) => model.id === selectedModel)?.detail }}</span>
              </div>
            </div>
            <button id="startBtn" class="primary-action" :class="{ 'is-running': running }" @click="toggleRunning">
              <span class="bi bi-play-fill"></span>
              <strong>{{ running ? 'Detecting...' : 'Start Detection' }}</strong>
            </button>
            <button class="stop-action" type="button" :disabled="!running" @click="stopDetection">
              <span class="bi bi-stop-fill"></span>
              <strong>Stop Detection</strong>
            </button>
          </article>
        </section>

        <section v-show="currentView === 'detect'" class="content-grid">
          <div class="left-stack">
            <article class="panel summary-panel">
              <div class="panel-title">
                <h2>สรุปผลการตรวจจับ</h2>
              </div>
              <div class="summary-lanes source-lanes" id="metrics">
                <div v-for="group in sourceMetrics" :key="`summary-${group.source.id}`" class="source-lane summary-lane">
                  <div class="lane-head">
                    <strong>{{ group.source.cameraLabel }}</strong>
                    <span>{{ group.source.label }}</span>
                  </div>
                  <div class="metric-grid">
                    <div class="metric amv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('AMV')"></span><span>AMV</span><strong>{{ group.metrics.AMV }}</strong></div>
                    <div class="metric lmv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('LMV')"></span><span>LMV</span><strong>{{ group.metrics.LMV }}</strong></div>
                    <div class="metric afv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('AFV')"></span><span>AFV</span><strong>{{ group.metrics.AFV }}</strong></div>
                    <div class="metric cv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('CV')"></span><span>CV</span><strong>{{ group.metrics.CV }}</strong></div>
                    <div class="metric mcv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('MCV')"></span><span>MCV</span><strong>{{ group.metrics.MCV }}</strong></div>
                    <div class="metric total"><span class="bi bi-grid-3x3-gap-fill metric-summary-icon"></span><span>Total</span><strong>{{ group.total }}</strong><small>Targets</small></div>
                  </div>
                </div>
              </div>
              <div class="metric-grid legacy-metric-grid">
                <div class="metric amv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('AMV')"></span><span>AMV</span><strong>{{ metrics.AMV }}</strong></div>
                <div class="metric lmv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('LMV')"></span><span>LMV</span><strong>{{ metrics.LMV }}</strong></div>
                <div class="metric afv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('AFV')"></span><span>AFV</span><strong>{{ metrics.AFV }}</strong></div>
                <div class="metric cv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('CV')"></span><span>CV</span><strong>{{ metrics.CV }}</strong></div>
                <div class="metric mcv"><span class="bi metric-summary-icon" :class="targetTypeIconClass('MCV')"></span><span>MCV</span><strong>{{ metrics.MCV }}</strong></div>
                <div class="metric total"><span class="bi bi-grid-3x3-gap-fill metric-summary-icon"></span><span>รวมทั้งหมด</span><strong id="totalCount">{{ totalCount }}</strong><small>เป้าหมาย</small></div>
              </div>
            </article>

            <article ref="previewPanel" class="panel preview-panel">
              <div class="panel-title compact">
                <h2>ภาพแสดงผลขนาดใหญ่ (Live)</h2>
                <div class="preview-tools">
                  <button title="บันทึกภาพ" aria-label="บันทึกภาพ"><span class="bi bi-camera"></span></button>
                  <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen"><span class="bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></span></button>
                </div>
              </div>
              <div class="live-status-strip" aria-label="สถานะการตรวจจับบนภาพขนาดใหญ่">
                <article v-for="card in liveStatusCards" :key="card.id" class="live-status-card" :class="[card.id, card.trendClass]">
                  <div class="live-status-copy">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}<small v-if="card.unit">{{ card.unit }}</small></strong>
                    <em>{{ card.note }}</em>
                  </div>
                  <span class="bi live-status-bi" :class="liveStatusIconClass(card.id)" aria-hidden="true"></span>
                </article>
              </div>
              <div ref="liveFrame" class="live-frame" :class="[`source-count-${previewSourceCount}`, { 'has-sources': activeSources.length, 'is-fullscreen': fullscreenActive }]">
                <div v-for="source in activeSources" :key="source.id" class="feed-tile" :data-live-title="`LIVE DETECTION (${source.cameraLabel})   •  LIVE`">
                  <video v-if="source.mediaKind.startsWith('video') || source.mediaKind === 'stream'" :src="source.src" muted loop playsinline controls></video>
                  <img v-else :src="source.src || 'assets/surveillance-road.png'" :alt="source.label" />
                  <div class="scan-line"></div>
                  <span class="live-dot">{{ source.cameraLabel }}</span>
                  <span class="feed-name">{{ source.label }}</span>
                  <span class="box b1">AMV</span>
                  <span class="box b3">LMV</span>
                  <div class="feed-control-bar" aria-label="Camera playback controls">
                    <button type="button" title="Previous" aria-label="Previous"><span class="bi bi-skip-backward-fill"></span></button>
                    <button type="button" title="Play" aria-label="Play"><span class="bi bi-play-fill"></span></button>
                    <button type="button" title="Pause" aria-label="Pause"><span class="bi bi-pause-fill"></span></button>
                    <button type="button" title="Stop" aria-label="Stop"><span class="bi bi-stop-fill"></span></button>
                    <button type="button" title="Restart" aria-label="Restart"><span class="bi bi-arrow-clockwise"></span></button>
                    <div class="feed-progress"><span></span></div>
                    <time>00:01:24 / 00:10:00</time>
                    <button type="button" class="feed-speed" title="Playback speed" aria-label="Playback speed">1.0x</button>
                  </div>
                </div>
                <img src="/assets/surveillance-road.png" alt="ภาพถนนและยานพาหนะจากมุมสูงสำหรับตัวอย่างการตรวจจับ" />
                <div class="scan-line"></div>
                <span class="live-dot">กำลังตรวจจับ...</span>
                <span class="box b1">AMV</span>
                <span class="box b2">AMV</span>
                <span class="box b3">LMV</span>
                <span class="box b4">AFV</span>
                <span class="box b5">AMV</span>
                <div class="live-overlay-menu" aria-label="Live view tools">
                  <button type="button" title="Zoom in" aria-label="Zoom in"><span class="bi bi-plus-lg"></span></button>
                  <button type="button" title="Zoom out" aria-label="Zoom out"><span class="bi bi-dash-lg"></span></button>
                  <button type="button" title="Capture image" aria-label="Capture image"><span class="bi bi-camera"></span></button>
                  <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click.stop="toggleFullscreen"><span class="bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></span></button>
                </div>
                <div class="live-frame-tools">
                  <button type="button" title="จับภาพ" aria-label="จับภาพ"><span class="bi bi-camera"></span></button>
                  <button type="button" title="ย่อภาพ" aria-label="ย่อภาพ" @click.stop="toggleFullscreen"><span class="bi bi-fullscreen-exit"></span></button>
                </div>
              </div>
              <div class="video-bar">
                <button title="หยุดชั่วคราว" aria-label="หยุดชั่วคราว"><span class="bi bi-pause-fill"></span></button>
                <button title="ย้อนกลับ" aria-label="ย้อนกลับ"><span class="bi bi-skip-backward-fill"></span></button>
                <button title="เล่น" aria-label="เล่น"><span class="bi bi-play-fill"></span></button>
                <button title="เสียง" aria-label="เสียง"><span class="bi bi-volume-up-fill"></span></button>
                <button title="ถัดไป" aria-label="ถัดไป"><span class="bi bi-skip-forward-fill"></span></button>
                <button title="หยุด" aria-label="หยุด"><span class="bi bi-stop-fill"></span></button>
                <button title="เริ่มต้นใหม่" aria-label="เริ่มต้นใหม่"><span class="bi bi-arrow-clockwise"></span></button>
                <div class="progress"><span></span></div>
                <time>00:01:24 / 00:10:00</time>
                <button title="จับภาพ" aria-label="จับภาพ"><span class="bi bi-camera"></span></button>
                <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen"><span class="bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'"></span></button>
                <button class="speed">1.0x</button>
              </div>
            </article>

            <article class="panel timeline-panel">
              <div class="panel-title compact">
                <h2>ไทม์ไลน์การตรวจจับตลอดวิดีโอ</h2>
              </div>
              <div class="source-lanes timeline-lanes">
                <div v-for="source in monitoringSources" :key="`timeline-${source.id}`" class="source-lane">
                  <div class="lane-head">
                    <strong>{{ source.cameraLabel }}</strong>
                    <span>{{ source.label }}</span>
                  </div>
                  <div class="timeline">
                    <div class="timeline-track"></div>
                    <button v-for="event in timelineEvents" :key="`${source.id}-${event.time}-${event.type}`" type="button" class="event" :class="event.className" :style="{ left: `${event.left}%` }" @click="openTimelinePopup(event, source)" :aria-label="`Open ${event.type} detection at ${event.time}`"></button>
                  </div>
                  <div class="time-scale">
                    <span>00:00</span><span>02:00</span><span>04:00</span><span>06:00</span><span>08:00</span><span>10:00</span>
                  </div>
                </div>
              </div>
              <div class="filter-row">
                <label><input type="checkbox" checked /><span class="bi bi-list-check"></span><span>ทั้งหมด</span></label>
                <label><input type="checkbox" checked /><span class="bi" :class="targetTypeIconClass('AMV')"></span><span>AMV</span></label>
                <label><input type="checkbox" checked /><span class="bi" :class="targetTypeIconClass('LMV')"></span><span>LMV</span></label>
                <label><input type="checkbox" checked /><span class="bi" :class="targetTypeIconClass('AFV')"></span><span>AFV</span></label>
                <label><input type="checkbox" checked /><span class="bi" :class="targetTypeIconClass('CV')"></span><span>CV</span></label>
                <label><input type="checkbox" checked /><span class="bi" :class="targetTypeIconClass('MCV')"></span><span>MCV</span></label>
              </div>
            </article>
          </div>

          <div class="right-stack">
            <article class="panel log-panel">
              <div class="panel-title compact">
                <h2>Log การทำงาน</h2>
              </div>
              <div class="log-table" role="table" aria-label="Log การทำงาน">
                <div class="log-head" role="row">
                  <span role="columnheader">เวลา (Time)</span>
                  <span role="columnheader">ข้อความ (Message)</span>
                </div>
                <div id="logRows" class="log-rows source-lanes log-lanes">
                  <div v-for="group in sourceLogs" :key="`log-${group.source.id}`" class="source-lane log-lane">
                    <div class="lane-head">
                      <strong>{{ group.source.cameraLabel }}</strong>
                      <span>{{ group.source.label }}</span>
                    </div>
                    <div v-for="row in group.logs" :key="`${group.source.id}-${row.id}`" class="log-row" role="row">
                      <span role="cell">{{ row.time }}</span>
                      <span role="cell" v-html="row.message"></span>
                    </div>
                    <div class="log-save-row">
                      <button type="button" class="log-save-button" :disabled="!canSaveData" :title="saveDisabledReason" @click="openSaveDialog(group.source)">
                        <span class="bi bi-floppy"></span>
                        <strong>บันทึกข้อมูล</strong>
                        <small>{{ group.source.cameraLabel }}</small>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article class="panel snapshots-panel">
              <div class="panel-title compact">
                <h2>ตัวอย่างภาพในช่วงเวลาที่ตรวจจับ (Snapshot Every 10s)</h2>
              </div>
              <div class="snapshot-strip">
                <button title="ก่อนหน้า" aria-label="ก่อนหน้า"><span class="bi bi-chevron-left"></span></button>
                <div class="snapshots source-lanes snapshot-lanes" id="snapshots">
                  <div v-for="group in sourceSnapshots" :key="`snapshot-${group.source.id}`" class="source-lane snapshot-lane">
                    <div class="lane-head">
                      <strong>{{ group.source.cameraLabel }}</strong>
                      <span>{{ group.source.label }}</span>
                    </div>
                    <div class="snapshot-row">
                      <button v-for="snapshot in group.snapshots" :key="`${group.source.id}-${snapshot.time}`" type="button" class="snapshot" @click="openSnapshotPopup(snapshot, group.source)" :aria-label="`Open ${snapshot.type} snapshot ${snapshot.time}`">
                        <img src="/assets/surveillance-road.png" :alt="`Snapshot ${snapshot.type}`" />
                        <span>{{ snapshot.type }}</span>
                        <time>{{ snapshot.time }}</time>
                      </button>
                    </div>
                  </div>
                </div>
                <button title="ถัดไป" aria-label="ถัดไป"><span class="bi bi-chevron-right"></span></button>
              </div>
              <div class="pager"><span class="is-active"></span><span></span><span></span><span></span></div>
            </article>

          </div>
        </section>

        <section v-show="currentView === 'report'" class="report-page" aria-label="Saved detection reports">
          <div class="report-heading">
            <h1>รายงานบันทึกข้อมูล</h1>
            <p>จัดการและค้นหาข้อมูลผลการตรวจจับที่บันทึกไว้ทั้งหมด</p>
          </div>

          <div class="report-stat-grid">
            <article class="report-stat-card stat-files">
              <span class="bi bi-folder2-open report-stat-bi"></span>
              <div><span>ไฟล์ทั้งหมด</span><strong>{{ reportDisplayStats.files }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-video">
              <span class="bi bi-camera-video report-stat-bi"></span>
              <div><span>วิดีโอ</span><strong>{{ reportDisplayStats.videos }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-image">
              <span class="bi bi-image report-stat-bi"></span>
              <div><span>รูปภาพ</span><strong>{{ reportDisplayStats.images }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-detect">
              <span class="bi bi-bullseye report-stat-bi"></span>
              <div><span>ผลการตรวจจับทั้งหมด</span><strong>{{ reportDisplayStats.detections }}</strong><small>รายการ</small></div>
            </article>
            <article class="report-stat-card stat-size">
              <span class="bi bi-hdd-stack report-stat-bi"></span>
              <div><span>ขนาดข้อมูลรวม</span><strong>{{ reportDisplayStats.storage }}</strong></div>
            </article>
          </div>

          <article class="panel report-filter-panel">
            <label class="report-search">
              <span class="bi bi-search"></span>
              <input v-model.trim="reportFilters.query" type="search" placeholder="ค้นหาไฟล์, ชื่อแหล่งข้อมูล, ประเภทวัตถุ..." @input="applyReportFilters" @keyup.enter="applyReportFilters" />
            </label>
            <button class="report-filter-button" type="button" @click="cycleReportDateMode">{{ reportDateLabel }} <span class="bi bi-calendar3"></span></button>
            <label class="report-select"><span>ประเภทไฟล์</span><select v-model="reportFilters.fileType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option value="video">วิดีโอ</option><option value="image">รูปภาพ</option></select></label>
            <label class="report-select"><span>ประเภทวัตถุ</span><select v-model="reportFilters.targetType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option v-for="type in targetTypes" :key="`filter-${type}`" :value="type">{{ type }}</option></select></label>
            <label class="report-select"><span>แหล่งข้อมูล</span><select v-model="reportFilters.sourceType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option value="stream">URL / Stream</option><option value="upload">Upload</option></select></label>
            <button class="report-type-toggle" type="button" :class="{ 'is-active': reportTypeMode !== 'all' }" @click="toggleReportTypeMode">{{ reportTypeLabel }}</button>
            <button class="report-search-button" type="button" @click="applyReportFilters"><span class="bi bi-search"></span> ค้นหา</button>
          </article>
          <p v-if="reportNotice" class="report-notice">{{ reportNotice }}</p>

          <div class="report-layout">
            <article class="panel report-table-panel">
              <div class="report-table-head">
                <label><input type="checkbox" :checked="allVisibleReportsSelected" @change="toggleVisibleReportSelection" /></label>
                <span class="report-bulk-menu" aria-label="Bulk report actions">
                  <button type="button" class="icon-button download" title="ดาวน์โหลดรายการที่เลือก" aria-label="ดาวน์โหลดรายการที่เลือก" :disabled="!selectedReportRecords.length" @click="downloadSelectedReports"><span class="bi bi-download"></span></button>
                  <button type="button" class="icon-button delete" title="ลบรายการที่เลือก" aria-label="ลบรายการที่เลือก" :disabled="!selectedReportRecords.length" @click="deleteSelectedReports"><span class="bi bi-trash3"></span></button>
                </span>
                <span>ตัวอย่าง</span>
                <span>ชื่อไฟล์ / แหล่งข้อมูล</span>
                <span>ประเภทไฟล์</span>
                <span>ประเภทวัตถุ</span>
                <span>จำนวนที่ตรวจจับ</span>
                <span>วันที่ / เวลา</span>
                <span>ขนาดไฟล์</span>
                <span>การจัดการ</span>
              </div>

              <button v-for="record in visibleReportRecords" :key="record.displayId" type="button" class="report-row" :class="{ 'is-selected': selectedReport.id === record.id }" @click="selectReport(record)">
                <label @click.stop><input type="checkbox" :checked="selectedReportIds.includes(record.id)" @change="toggleReportSelection(record)" /></label>
                <span class="report-thumb">
                  <img :src="record.image" :alt="record.name" />
                  <time>{{ record.duration }}</time>
                </span>
                <span class="report-file-cell">
                  <strong>{{ record.name }}</strong>
                  <small>{{ record.source }}</small>
                  <span class="report-tags"><em v-for="tag in record.tags" :key="`${record.id}-${tag}`">{{ tag }}</em></span>
                </span>
                <span class="file-type-badge" :class="record.ext.toLowerCase()">{{ record.ext }}</span>
                <span class="report-tag-stack"><em v-for="tag in record.tags" :key="`${record.id}-type-${tag}`">{{ tag }}</em></span>
                <span class="report-metric-strip">
                  <span v-for="type in targetTypes" :key="`${record.id}-${type}`" :class="type.toLowerCase()">
                    <span class="bi metric-vehicle-icon" :class="targetTypeIconClass(type)"></span><small>{{ type }}</small><strong>{{ record.metrics[type] }}</strong>
                  </span>
                </span>
                <span class="report-date-cell"><strong>{{ record.date }}</strong><small>{{ record.time }}</small></span>
                <span class="report-size-cell">{{ record.size }}</span>
                <span class="report-action-buttons">
                  <span class="icon-button view" title="ดูข้อมูล" aria-label="ดูข้อมูล" @click.stop="viewReport(record)"><span class="bi bi-eye"></span></span>
                  <span class="icon-button download" title="ดาวน์โหลด" aria-label="ดาวน์โหลด" @click.stop="downloadReport(record)"><span class="bi bi-download"></span></span>
                  <span class="icon-button delete" title="ลบ" aria-label="ลบ" @click.stop="deleteReport(record)"><span class="bi bi-trash3"></span></span>
                </span>
              </button>

              <div class="report-pagination">
                <span>แสดง {{ reportPageStart }} - {{ reportPageEnd }} จาก {{ filteredReportRecords.length }} รายการ</span>
                <div>
                  <button type="button" :disabled="reportPage <= 1" @click="changeReportPage(reportPage - 1)"><span class="bi bi-chevron-left"></span></button>
                  <button v-for="page in reportPaginationPages" :key="`report-page-${page}`" :class="{ 'is-active': reportPage === page }" type="button" @click="changeReportPage(page)">{{ page }}</button>
                  <button type="button" :disabled="reportPage >= reportTotalPages" @click="changeReportPage(reportPage + 1)"><span class="bi bi-chevron-right"></span></button>
                </div>
                <label class="report-page-size">
                  <input v-model.number="reportPageSize" type="number" min="10" step="1" aria-label="จำนวนรายการต่อหน้า" @change="normalizeReportPageSize" @blur="normalizeReportPageSize" />
                  <span>/ หน้า</span>
                </label>
              </div>
            </article>

            <aside class="report-detail-stack">
              <article class="panel report-detail-panel">
                <h2>ตัวอย่างและรายละเอียด</h2>
                <div class="report-detail-preview">
                  <img :src="selectedReport.image" :alt="selectedReport.name" />
                  <span class="box report-b1">AMV</span>
                  <span class="box report-b2">AMV</span>
                  <span class="box report-b3">AMV</span>
                  <button type="button" title="Fullscreen" aria-label="Fullscreen"><span class="bi bi-arrows-fullscreen"></span></button>
                  <time>00:00:45 / {{ selectedReport.duration }}</time>
                </div>
                <div class="report-detail-name">
                  <strong>{{ selectedReport.name }}.{{ selectedReport.ext.toLowerCase() }}</strong>
                  <small>{{ selectedReport.source }}</small>
                </div>
                <dl class="report-detail-grid">
                  <div><dt>ประเภทไฟล์</dt><dd>{{ selectedReport.ext }}</dd></div>
                  <div><dt>ความยาววิดีโอ</dt><dd>{{ selectedReport.duration }}</dd></div>
                  <div><dt>วันที่ / เวลา</dt><dd>{{ selectedReport.date }} {{ selectedReport.time }}</dd></div>
                  <div><dt>ขนาดไฟล์</dt><dd>{{ selectedReport.size }}</dd></div>
                  <div><dt>ความละเอียด</dt><dd>{{ selectedReport.resolution }}</dd></div>
                  <div><dt>FPS</dt><dd>{{ selectedReport.fps }}</dd></div>
                  <div><dt>ผู้บันทึก</dt><dd>{{ selectedReport.recorder }}</dd></div>
                  <div><dt>หมายเหตุ</dt><dd>-</dd></div>
                </dl>
              </article>

              <article class="panel report-summary-panel">
                <h2>สรุปผลการตรวจจับ</h2>
                <div class="report-summary-mini">
                  <span v-for="type in targetTypes" :key="`detail-${type}`" :class="type.toLowerCase()"><small>{{ type }}</small><strong>{{ selectedReport.metrics[type] }}</strong></span>
                  <span class="total"><small>รวมทั้งหมด</small><strong>{{ selectedReportTotal }}</strong></span>
                </div>
              </article>

            </aside>
          </div>
        </section>
      </main>
      <template v-if="saveDialog.open">
        <div class="save-modal" role="dialog" aria-modal="true" @click.self="closeSaveDialog">
        <div class="save-modal-panel">
          <button type="button" class="save-modal-close" aria-label="Close save popup" @click="closeSaveDialog"><span class="bi bi-x-lg"></span></button>
          <div class="save-modal-head">
            <strong>บันทึกข้อมูล</strong>
            <span>{{ saveDialog.source?.cameraLabel }} · {{ saveDialog.source?.label }}</span>
          </div>
          <div v-if="!saveDialog.confirm" class="save-form">
            <label>
              <span>ชื่อไฟล์</span>
              <input v-model.trim="saveDialog.fileName" type="text" placeholder="กรอกชื่อไฟล์ที่ต้องการบันทึก" @keyup.enter="requestSaveConfirm" />
            </label>
            <div class="save-modal-actions">
              <button type="button" class="secondary-small" @click="closeSaveDialog">ยกเลิก</button>
              <button type="button" class="primary-small" :disabled="!saveDialog.fileName.trim()" @click="requestSaveConfirm">บันทึก</button>
            </div>
          </div>
          <div v-else class="save-confirm">
            <div class="save-confirm-icon"><span class="bi bi-check2-circle"></span></div>
            <strong>ยืนยันการบันทึกข้อมูล?</strong>
            <p>ต้องการบันทึกไฟล์ชื่อ <span>{{ saveDialog.fileName }}</span> ใช่หรือไม่</p>
            <div class="save-modal-actions">
              <button type="button" class="secondary-small" @click="cancelSaveConfirm">กลับไปแก้ไข</button>
              <button type="button" class="primary-small" @click="confirmSaveData">ยืนยันบันทึก</button>
            </div>
          </div>
        </div>
      </div>
      </template>
      <template v-if="deleteDialog.open">
        <div class="delete-modal" role="dialog" aria-modal="true" @click.self="closeDeleteDialog">
          <div class="delete-modal-panel">
            <button type="button" class="delete-modal-close" aria-label="Close delete popup" @click="closeDeleteDialog"><span class="bi bi-x-lg"></span></button>
            <div class="delete-modal-icon" :class="{ 'is-final': deleteDialog.confirm }"><span class="bi" :class="deleteDialog.confirm ? 'bi-exclamation-octagon' : 'bi-trash3'"></span></div>
            <div class="delete-modal-copy delete-modal-copy-active">
              <strong>{{ deleteDialog.confirm ? 'ลบถาวรใช่หรือไม่?' : 'ยืนยันการลบข้อมูล?' }}</strong>
              <p v-if="!deleteDialog.confirm">ต้องการลบรายงาน <span>{{ deleteDialog.record?.name }}.{{ deleteDialog.record?.ext?.toLowerCase() }}</span> ใช่หรือไม่</p>
              <p v-else>การลบนี้ไม่สามารถย้อนกลับได้ ต้องการลบ <span>{{ deleteDialog.record?.name }}.{{ deleteDialog.record?.ext?.toLowerCase() }}</span> แน่นอนใช่หรือไม่</p>
              <small>{{ deleteDialog.record?.source }}</small>
            </div>
            <div class="delete-modal-actions delete-modal-actions-active">
              <button type="button" class="secondary-small" @click="deleteDialog.confirm ? cancelDeleteConfirm() : closeDeleteDialog()">{{ deleteDialog.confirm ? 'ย้อนกลับ' : 'ยกเลิก' }}</button>
              <button type="button" class="danger-small" @click="deleteDialog.confirm ? confirmDeleteReport() : requestDeleteConfirm()">{{ deleteDialog.confirm ? 'ลบถาวร' : 'ยืนยันลบ' }}</button>
            </div>
            <div class="delete-modal-copy">
              <strong>ยืนยันการลบข้อมูล?</strong>
              <p>ต้องการลบรายงาน <span>{{ deleteDialog.record?.name }}.{{ deleteDialog.record?.ext?.toLowerCase() }}</span> ใช่หรือไม่</p>
              <small>{{ deleteDialog.record?.source }}</small>
            </div>
            <div class="delete-modal-actions">
              <button type="button" class="secondary-small" @click="closeDeleteDialog">ยกเลิก</button>
              <button type="button" class="danger-small" @click="confirmDeleteReport">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      </template>
      <template v-if="selectedSnapshot">
        <div class="snapshot-modal" role="dialog" aria-modal="true" @click.self="closeSnapshotPopup">
        <div class="snapshot-modal-panel">
          <button type="button" class="snapshot-modal-close" aria-label="Close snapshot popup" @click="closeSnapshotPopup"><span class="bi bi-x-lg"></span></button>
          <div class="snapshot-modal-head">
            <strong>{{ selectedSnapshot.source.cameraLabel }} / {{ selectedSnapshot.type }}</strong>
            <span>{{ selectedSnapshot.time }} · {{ selectedSnapshot.source.label }}</span>
          </div>
          <div class="snapshot-modal-image">
            <img src="/assets/surveillance-road.png" :alt="`${selectedSnapshot.type} detection enlarged`" />
            <span class="snapshot-detection-box" :class="selectedSnapshot.boxClass">
              <strong>{{ selectedSnapshot.type }}</strong>
              <small>Confidence 0.92</small>
            </span>
          </div>
        </div>
        </div>
      </template>
    </div>
</template>

<script>
export default {
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
      targetPanelCollapsed: false,
      selectedModel: "yolo-25",
      selectedReportId: 1,
      reportPageSize: 10,
      reportPage: 1,
      reportTypeMode: "all",
      reportDateMode: "all",
      reportFilters: {
        query: "",
        fileType: "all",
        targetType: "all",
        sourceType: "all"
      },
      selectedReportIds: [],
      reportNotice: "",
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
      deleteDialog: {
        open: false,
        confirm: false,
        record: null,
        records: null
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
      targetClassOptions: [
        { id: "AMV", detail: "(Armored Military Vehicle)", color: "#2ed36f" },
        { id: "LMV", detail: "(Light Military Vehicle)", color: "#2f84ff" },
        { id: "AFV", detail: "(Armored Fighting Vehicle)", color: "#f3ad2f" },
        { id: "CV", detail: "(Combat Vehicle)", color: "#8c4be8" },
        { id: "MCV", detail: "(Military Cargo Vehicle)", color: "#e5812e" }
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
          image: "/assets/surveillance-road.png"
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
          image: "/assets/surveillance-road.png"
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
          image: "/assets/surveillance-road.png"
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
          image: "/assets/surveillance-road.png"
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
          image: "/assets/surveillance-road.png"
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
          image: "/assets/surveillance-road.png"
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
      return this.targetClassOptions.every((target) => this.selectedTargets.includes(target.id));
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
    filteredReportRecords() {
      const query = this.reportFilters.query.toLowerCase();
      const typeMode = this.reportTypeMode === "all" ? this.reportFilters.fileType : this.reportTypeMode;

      return this.reportRecords.filter((record) => {
        const text = `${record.name} ${record.source} ${record.ext} ${record.kind} ${record.tags.join(" ")}`.toLowerCase();
        const matchesQuery = !query || text.includes(query);
        const matchesFile = typeMode === "all" || record.kind === typeMode;
        const matchesTarget = this.reportFilters.targetType === "all" || record.tags.includes(this.reportFilters.targetType);
        const isUpload = /upload|อัปโหลด/i.test(record.source);
        const sourceType = isUpload ? "upload" : "stream";
        const matchesSource = this.reportFilters.sourceType === "all" || this.reportFilters.sourceType === sourceType;
        const matchesDate = this.reportMatchesDateMode(record);
        return matchesQuery && matchesFile && matchesTarget && matchesSource && matchesDate;
      });
    },
    reportTotalPages() {
      return Math.max(1, Math.ceil(this.filteredReportRecords.length / this.normalizedReportPageSize));
    },
    reportPageStart() {
      if (!this.filteredReportRecords.length) return 0;
      return (this.reportPage - 1) * this.normalizedReportPageSize + 1;
    },
    reportPageEnd() {
      return Math.min(this.reportPage * this.normalizedReportPageSize, this.filteredReportRecords.length);
    },
    reportPaginationPages() {
      const pages = new Set([1, this.reportTotalPages, this.reportPage - 1, this.reportPage, this.reportPage + 1]);
      return Array.from(pages)
        .filter((page) => page >= 1 && page <= this.reportTotalPages)
        .sort((a, b) => a - b);
    },
    visibleReportRecords() {
      const start = (this.reportPage - 1) * this.normalizedReportPageSize;
      return this.filteredReportRecords.slice(start, start + this.normalizedReportPageSize).map((record, index) => ({
        ...record,
        displayId: `${record.id}-${start + index}`,
        displayIndex: start + index + 1
      }));
    },
    selectedReport() {
      return this.reportRecords.find((record) => record.id === this.selectedReportId)
        || this.filteredReportRecords[0]
        || {
          id: 0,
          name: "no_report_selected",
          source: "-",
          ext: "-",
          kind: "image",
          duration: "-",
          date: "-",
          time: "-",
          size: "-",
          resolution: "-",
          fps: "-",
          recorder: "-",
          tags: [],
          metrics: { AMV: 0, LMV: 0, AFV: 0, CV: 0, MCV: 0 },
          image: "/assets/surveillance-road.png"
        };
    },
    selectedReportTotal() {
      return Object.values(this.selectedReport.metrics).reduce((sum, value) => sum + value, 0);
    },
    allVisibleReportsSelected() {
      return Boolean(this.visibleReportRecords.length)
        && this.visibleReportRecords.every((record) => this.selectedReportIds.includes(record.id));
    },
    selectedReportRecords() {
      return this.reportRecords.filter((record) => this.selectedReportIds.includes(record.id));
    },
    reportTypeLabel() {
      if (this.reportTypeMode === "video") return "วิดีโอ";
      if (this.reportTypeMode === "image") return "รูปภาพ";
      return "ทั้งหมด";
    },
    reportDateLabel() {
      return {
        all: "ทุกช่วงเวลา",
        today: "วันนี้",
        week: "7 วันล่าสุด",
        month: "30 วันล่าสุด"
      }[this.reportDateMode];
    },
    reportDisplayStats() {
      const records = this.filteredReportRecords;
      const detections = records.reduce((sum, record) => (
        sum + Object.values(record.metrics).reduce((innerSum, value) => innerSum + value, 0)
      ), 0);
      const storageMb = records.reduce((sum, record) => sum + this.parseReportSizeMb(record.size), 0);
      return {
        files: String(records.length),
        videos: String(records.filter((record) => record.kind === "video").length),
        images: String(records.filter((record) => record.kind === "image").length),
        detections: detections.toLocaleString("en-US"),
        storage: this.formatReportStorage(storageMb)
      };
    },
    liveStatusMetrics() {
      return this.sourceMetrics[0] || { metrics: this.metrics, total: this.totalCount };
    },
    liveStatusCards() {
      const metrics = this.liveStatusMetrics.metrics;
      return [
        { id: "total-targets", label: "TOTAL TARGETS", value: this.liveStatusMetrics.total, note: "▲ 12% vs last hour", trendClass: "trend-up" },
        { id: "amv", label: "AMV", value: metrics.AMV, note: "▲ 7%", trendClass: "trend-up" },
        { id: "lmv", label: "LMV", value: metrics.LMV, note: "▲ 15%", trendClass: "trend-warn" },
        { id: "afv", label: "AFV", value: metrics.AFV, note: "▼ 3%", trendClass: "trend-down" },
        { id: "cv", label: "CV", value: metrics.CV, note: "▲ 2%", trendClass: "trend-up" },
        { id: "mcv", label: "MCV", value: metrics.MCV, note: "▲ 8%", trendClass: "trend-up" },
        { id: "fps", label: "FPS", value: 31, note: "Real-time", trendClass: "trend-neutral" },
        { id: "latency", label: "LATENCY", value: 14, unit: "ms", note: "Real-time", trendClass: "trend-neutral" },
        { id: "confidence", label: "CONFIDENCE AVG", value: 91, unit: "%", note: "", trendClass: "trend-neutral" }
      ];
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
    this.resetPopupState();
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
    liveStatusIconClass(id) {
      return {
        "total-targets": "bi-bounding-box-circles",
        amv: "bi-truck-front",
        lmv: "bi-car-front",
        afv: "bi-shield-fill-check",
        cv: "bi-crosshair",
        mcv: "bi-box-seam",
        fps: "bi-speedometer2",
        latency: "bi-activity",
        confidence: "bi-patch-check"
      }[id] || "bi-circle";
    },
    targetTypeIconClass(type) {
      return {
        AMV: "bi-bus-front-fill",
        LMV: "bi-car-front-fill",
        AFV: "bi-shield-shaded",
        CV: "bi-truck-front",
        MCV: "bi-truck-flatbed"
      }[type] || "bi-car-front";
    },
    resetPopupState() {
      this.saveDialog = {
        open: false,
        confirm: false,
        source: null,
        fileName: ""
      };
      this.deleteDialog = {
        open: false,
        confirm: false,
        record: null,
        records: null
      };
      this.selectedSnapshot = null;
      document.body.classList.remove("modal-open");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
      document.querySelectorAll(".modal-backdrop").forEach((element) => element.remove());
    },
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
        appShell.style.width = "100%";
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
        workspace.style.width = "100%";
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
      const fullscreenTarget = this.$refs.previewPanel || this.$refs.liveFrame;
      if (!fullscreenTarget) return;

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }

        await fullscreenTarget.requestFullscreen();
      } catch (error) {
        this.fullscreenActive = false;
      }
    },
    handleFullscreenChange() {
      this.fullscreenActive = document.fullscreenElement === this.$refs.previewPanel
        || document.fullscreenElement === this.$refs.liveFrame;
    },
    selectTarget(type) {
      if (type === "ALL") {
        this.selectedTargets = this.allTargetsSelected ? [] : this.targetClassOptions.map((target) => target.id);
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
        image: "/assets/surveillance-road.png",
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
    applyReportFilters() {
      this.reportPage = 1;
      this.reportNotice = `พบ ${this.filteredReportRecords.length} รายการตามเงื่อนไข`;
      this.ensureSelectedReportVisible();
    },
    ensureSelectedReportVisible() {
      if (!this.filteredReportRecords.length) {
        this.selectedReportId = 0;
        return;
      }
      if (!this.filteredReportRecords.some((record) => record.id === this.selectedReportId)) {
        this.selectedReportId = this.filteredReportRecords[0].id;
      }
    },
    changeReportPage(page) {
      this.reportPage = Math.min(Math.max(1, page), this.reportTotalPages);
      this.ensureSelectedReportVisible();
    },
    toggleReportTypeMode() {
      const nextMode = this.reportTypeMode === "all" ? "video" : (this.reportTypeMode === "video" ? "image" : "all");
      this.reportTypeMode = nextMode;
      this.reportFilters.fileType = nextMode;
      this.applyReportFilters();
    },
    cycleReportDateMode() {
      const modes = ["all", "today", "week", "month"];
      const currentIndex = modes.indexOf(this.reportDateMode);
      this.reportDateMode = modes[(currentIndex + 1) % modes.length];
      this.reportNotice = `เลือกช่วงเวลา: ${this.reportDateLabel}`;
      this.applyReportFilters();
    },
    reportMatchesDateMode(record) {
      if (this.reportDateMode === "all") return true;
      if (record.id > 100000) return true;
      if (this.reportDateMode === "today") return record.id <= 2;
      if (this.reportDateMode === "week") return record.id <= 4;
      return true;
    },
    toggleReportSelection(record) {
      if (this.selectedReportIds.includes(record.id)) {
        this.selectedReportIds = this.selectedReportIds.filter((id) => id !== record.id);
        return;
      }
      this.selectedReportIds = [...this.selectedReportIds, record.id];
    },
    toggleVisibleReportSelection() {
      if (this.allVisibleReportsSelected) {
        const visibleIds = new Set(this.visibleReportRecords.map((record) => record.id));
        this.selectedReportIds = this.selectedReportIds.filter((id) => !visibleIds.has(id));
        return;
      }
      this.selectedReportIds = Array.from(new Set([
        ...this.selectedReportIds,
        ...this.visibleReportRecords.map((record) => record.id)
      ]));
    },
    viewReport(record) {
      this.selectReport(record);
      this.reportNotice = `เปิดดูรายละเอียด ${record.name}.${record.ext.toLowerCase()}`;
    },
    downloadReport(record) {
      const payload = [
        `Report: ${record.name}.${record.ext.toLowerCase()}`,
        `Source: ${record.source}`,
        `Date: ${record.date} ${record.time}`,
        `Targets: ${record.tags.join(", ") || "-"}`,
        `Detections: ${Object.entries(record.metrics).map(([key, value]) => `${key}=${value}`).join(", ")}`
      ].join("\n");
      const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${record.name}_report.txt`;
      link.click();
      URL.revokeObjectURL(url);
      this.reportNotice = `ดาวน์โหลดรายงาน ${record.name} แล้ว`;
    },
    downloadSelectedReports() {
      if (!this.selectedReportRecords.length) return;
      const payload = this.selectedReportRecords.map((record, index) => [
        `#${index + 1} ${record.name}.${record.ext.toLowerCase()}`,
        `Source: ${record.source}`,
        `Date: ${record.date} ${record.time}`,
        `Targets: ${record.tags.join(", ") || "-"}`,
        `Detections: ${Object.entries(record.metrics).map(([key, value]) => `${key}=${value}`).join(", ")}`
      ].join("\n")).join("\n\n");
      const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected_reports_${this.selectedReportRecords.length}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      this.reportNotice = `ดาวน์โหลด ${this.selectedReportRecords.length} รายการที่เลือกแล้ว`;
    },
    deleteSelectedReports() {
      if (!this.selectedReportRecords.length) return;
      this.deleteDialog = {
        open: true,
        confirm: false,
        record: {
          name: `${this.selectedReportRecords.length} selected reports`,
          ext: "TXT",
          source: "Bulk selected reports"
        },
        records: [...this.selectedReportRecords]
      };
    },
    deleteReport(record) {
      this.deleteDialog = {
        open: true,
        confirm: false,
        record,
        records: null
      };
      return;
      const confirmed = window.confirm(`ต้องการลบรายงาน ${record.name}.${record.ext.toLowerCase()} ใช่หรือไม่?`);
      if (!confirmed) return;
      this.reportRecords = this.reportRecords.filter((item) => item.id !== record.id);
      this.selectedReportIds = this.selectedReportIds.filter((id) => id !== record.id);
      this.reportPage = Math.min(this.reportPage, this.reportTotalPages);
      this.ensureSelectedReportVisible();
      this.reportNotice = `ลบรายงาน ${record.name} แล้ว`;
    },
    closeDeleteDialog() {
      this.deleteDialog = {
        open: false,
        confirm: false,
        record: null
      };
    },
    requestDeleteConfirm() {
      this.deleteDialog.confirm = true;
    },
    cancelDeleteConfirm() {
      this.deleteDialog.confirm = false;
    },
    confirmDeleteReport() {
      const record = this.deleteDialog.record;
      if (!record) return;
      const recordsToDelete = this.deleteDialog.records?.length ? this.deleteDialog.records : [record];
      const deleteIds = new Set(recordsToDelete.map((item) => item.id));
      this.reportRecords = this.reportRecords.filter((item) => !deleteIds.has(item.id));
      this.selectedReportIds = this.selectedReportIds.filter((id) => !deleteIds.has(id));
      this.reportPage = Math.min(this.reportPage, this.reportTotalPages);
      this.ensureSelectedReportVisible();
      if (recordsToDelete.length > 1) {
        this.reportNotice = `ลบ ${recordsToDelete.length} รายการที่เลือกแล้ว`;
        this.closeDeleteDialog();
        return;
      }
      this.reportNotice = `ลบรายงาน ${record.name} แล้ว`;
      this.closeDeleteDialog();
    },
    parseReportSizeMb(size) {
      const value = Number.parseFloat(String(size));
      if (!Number.isFinite(value)) return 0;
      return /gb/i.test(size) ? value * 1024 : value;
    },
    formatReportStorage(sizeMb) {
      if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(2)} GB`;
      return `${sizeMb.toFixed(1)} MB`;
    },
    normalizeReportPageSize() {
      this.reportPageSize = this.normalizedReportPageSize;
      this.reportPage = Math.min(this.reportPage, this.reportTotalPages);
    },
    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
    },
    toggleRunning() {
      this.setRunning(!this.running);
    },
    stopDetection() {
      this.setRunning(false);
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
};
</script>
