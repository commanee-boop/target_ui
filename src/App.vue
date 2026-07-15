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
              <span class="icon bi bi-crosshair2"></span>
              <span>ตรวจจับเป้าหมาย</span>
            </button>
            <button class="top-menu-item" :class="{ 'is-active': currentView === 'report' }" title="รายงานบันทึกข้อมูล" aria-label="รายงานบันทึกข้อมูล" @click="setView('report')">
              <span class="icon bi bi-clipboard-data"></span>
              <span>รายงานบันทึกข้อมูล</span>
            </button>
          </div>
          <div class="operator-cluster">
            <button id="themeToggle" class="theme-toggle" type="button" :title="themeTitle" :aria-label="themeTitle" :aria-pressed="theme === 'light'" @click="toggleTheme">
              <span class="theme-icon bi" :class="theme === 'light' ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'" aria-hidden="true"></span>
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
              <span class="icon bi bi-box-arrow-right"></span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <section v-show="currentView === 'detect'" class="setup-grid" aria-label="ขั้นตอนการตรวจจับ">
          <article class="sidebar-tools" aria-label="Target configuration tools">
            <div class="tools-title">
              <span class="tools-mark"><span class="icon bi bi-sliders2"></span></span>
              <div>
                <strong>Target Configuration</strong>
                <span>Input and detection setup</span>
              </div>
            </div>
            <div class="tools-actions">
              <button class="tool-action clear-input" type="button" title="Clear input data" aria-label="Clear input data" @click="clearInputData">
                <span class="tool-icon bi bi-eraser"></span>
              </button>
              <button class="tool-action reset-page" type="button" title="Reset all data" aria-label="Reset all data" @click="resetPageData">
                <span class="tool-icon bi bi-arrow-clockwise"></span>
              </button>
              <button class="tool-action collapse-menu" :class="{ 'is-collapsed': sidebarCollapsed }" type="button" :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'" @click.prevent.stop="toggleSidebar">
                <span class="tool-icon bi bi-chevron-left"></span>
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
                <button class="source-remove" type="button" title="Remove source" aria-label="Remove source" :disabled="sourceSlots.length === 1" @click="removeSourceSlot(slot)">×</button>
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
                <button class="source-remove" type="button" title="Remove source" aria-label="Remove source" :disabled="sourceSlots.length === 1" @click="removeSourceSlot(slot)">×</button>
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
              <span class="target-head-icon bi bi-bullseye"></span>
              <strong>TARGET CLASSES</strong>
              <span class="target-head-chevron"></span>
            </button>
            <div v-show="!targetPanelCollapsed" class="target-class-list" id="targetGrid">
              <button class="target-class-row" :class="{ 'is-selected': isTargetSelected('ALL'), 'is-muted': !isTargetSelected('ALL') }" type="button" data-type="ALL" title="Select all target classes" aria-label="Select all target classes" @click="selectTarget('ALL')">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-type-icon bi bi-grid-3x3-gap-fill" aria-hidden="true"></span>
                <span class="target-class-copy">SELECT ALL</span>
                <span class="target-class-action"></span>
              </button>
              <button v-for="target in targetClassOptions" :key="target.id" class="target-class-row" :class="{ 'is-selected': isTargetSelected(target.id), 'is-muted': !isTargetSelected(target.id) }" type="button" :data-type="target.id" :title="target.detail" :aria-label="target.detail" @click="selectTarget(target.id)">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-type-icon bi" :class="targetTypeIconClass(target.id)" aria-hidden="true"></span>
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
              <span class="play-icon bi bi-play-fill"></span>
              <strong>{{ running ? 'Detecting...' : 'Start Detection' }}</strong>
            </button>
            <button class="stop-action" type="button" :disabled="!running" @click="stopDetection">
              <span class="stop-action-icon bi bi-stop-fill"></span>
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
                    <div v-for="type in targetTypes" :key="`source-${group.source.id}-${type}`" class="metric" :class="type.toLowerCase()"><span class="metric-bi bi" :class="targetTypeIconClass(type)"></span><span class="metric-label">{{ type }}</span><strong>{{ group.metrics[type] }}</strong></div>
                    <div class="metric total"><span class="metric-bi bi bi-grid-3x3-gap-fill"></span><span class="metric-label">Total Targets</span><strong>{{ group.total }}</strong></div>
                  </div>
                </div>
              </div>
              <div class="metric-grid legacy-metric-grid">
                <div v-for="type in targetTypes" :key="`legacy-${type}`" class="metric" :class="type.toLowerCase()"><span class="metric-bi bi" :class="targetTypeIconClass(type)"></span><span class="metric-label">{{ type }}</span><strong>{{ metrics[type] }}</strong></div>
                <div class="metric total"><span class="metric-bi bi bi-grid-3x3-gap-fill"></span><span class="metric-label">รวมทั้งหมด</span><strong id="totalCount">{{ totalCount }}</strong></div>
              </div>
            </article>

            <article ref="previewPanel" class="panel preview-panel">
              <div class="panel-title compact">
                <h2>ภาพแสดงผลขนาดใหญ่ (Live)</h2>
                <div class="preview-tools">
                  <button title="บันทึกภาพ" aria-label="บันทึกภาพ"><span class="icon bi bi-camera"></span></button>
                  <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen"><span class="icon bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></span></button>
                </div>
              </div>
              <div class="live-status-strip" aria-label="สถานะการตรวจจับบนภาพขนาดใหญ่">
                <article v-for="card in liveStatusCards" :key="card.id" class="live-status-card" :class="[card.id, card.trendClass]">
                  <div class="live-status-copy">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}<small v-if="card.unit">{{ card.unit }}</small></strong>
                    <em>{{ card.note }}</em>
                  </div>
                  <span class="live-status-icon bi" :class="liveStatusIconClass(card.id)" aria-hidden="true"></span>
                </article>
              </div>
              <div ref="liveFrame" class="live-frame" :class="[`source-count-${previewSourceCount}`, { 'has-sources': activeSources.length, 'is-fullscreen': fullscreenActive }]">
                <div v-for="source in activeSources" :key="source.id" class="feed-tile" :data-live-title="`LIVE DETECTION (${source.cameraLabel})   •  LIVE`">
                  <video v-if="source.mediaKind.startsWith('video') || source.mediaKind === 'stream'" :src="source.src" muted loop playsinline controls></video>
                  <img v-else :src="source.src || 'assets/surveillance-road.png'" :alt="source.label" />
                  <div class="scan-line"></div>
                  <span class="live-dot">{{ source.cameraLabel }}</span>
                  <span class="feed-name">{{ source.label }}</span>
                  <span class="box b1">MV</span>
                  <span class="box b2">AMV</span>
                  <span class="box b3">LMV</span>
                  <div class="feed-control-bar" aria-label="Camera playback controls">
                    <button type="button" title="Previous" aria-label="Previous"><span class="icon bi bi-skip-backward-fill"></span></button>
                    <button type="button" title="Play" aria-label="Play"><span class="icon bi bi-play-fill"></span></button>
                    <button type="button" title="Pause" aria-label="Pause" class="pause-bars"></button>
                    <button type="button" title="Stop" aria-label="Stop"><span class="control-icon bi bi-stop-fill"></span></button>
                    <button type="button" title="Restart" aria-label="Restart"><span class="control-icon bi bi-arrow-clockwise"></span></button>
                    <div class="feed-progress"><span></span></div>
                    <time>00:01:24 / 00:10:00</time>
                    <button type="button" class="feed-speed" title="Playback speed" aria-label="Playback speed">1.0x</button>
                  </div>
                </div>
                <img src="/assets/surveillance-road.png" alt="ภาพถนนและยานพาหนะจากมุมสูงสำหรับตัวอย่างการตรวจจับ" />
                <div class="scan-line"></div>
                <span class="live-dot">กำลังตรวจจับ...</span>
                <span class="box b1">MV</span>
                <span class="box b2">AMV</span>
                <span class="box b3">LMV</span>
                <span class="box b4">AFV</span>
                <span class="box b5">AMV</span>
                <div class="live-overlay-menu" aria-label="Live view tools">
                  <button type="button" title="Capture image" aria-label="Capture image"><span class="icon bi bi-camera"></span></button>
                  <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click.stop="toggleFullscreen"><span class="icon bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></span></button>
                </div>
                <div class="live-frame-tools">
                  <button type="button" title="จับภาพ" aria-label="จับภาพ"><span class="icon bi bi-camera"></span></button>
                  <button type="button" title="ย่อภาพ" aria-label="ย่อภาพ" @click.stop="toggleFullscreen"><span class="icon bi bi-fullscreen-exit"></span></button>
                </div>
              </div>
              <div class="video-bar">
                <button title="ย้อนกลับ" aria-label="ย้อนกลับ"><span class="icon bi bi-skip-backward-fill"></span></button>
                <button title="เล่น" aria-label="เล่น"><span class="icon bi bi-play-fill"></span></button>
                <button title="ถัดไป" aria-label="ถัดไป"><span class="control-icon bi bi-skip-forward-fill"></span></button>
                <button title="หยุดชั่วคราว" aria-label="หยุดชั่วคราว" class="pause-bars"></button>
                <button title="หยุด" aria-label="หยุด"><span class="control-icon bi bi-stop-fill"></span></button>
                <button title="เริ่มต้นใหม่" aria-label="เริ่มต้นใหม่"><span class="control-icon bi bi-arrow-clockwise"></span></button>
                <div class="progress"><span></span></div>
                <time>00:01:24 / 00:10:00</time>
                <button title="จับภาพ" aria-label="จับภาพ"><span class="icon bi bi-camera"></span></button>
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
                <label><input type="checkbox" checked /><span class="filter-icon bi bi-grid-3x3-gap-fill" aria-hidden="true"></span><span>ทั้งหมด</span></label>
                <label v-for="type in targetTypes" :key="`target-filter-${type}`"><input type="checkbox" checked /><span class="filter-icon bi" :class="targetTypeIconClass(type)" aria-hidden="true"></span><span>{{ type }}</span></label>
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
                        <span class="save-icon bi bi-floppy"></span>
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
                <button title="ก่อนหน้า" aria-label="ก่อนหน้า"><span class="icon bi bi-chevron-left"></span></button>
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
                <button title="ถัดไป" aria-label="ถัดไป"><span class="icon bi bi-chevron-right"></span></button>
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
              <span class="report-stat-icon bi bi-archive-fill"></span>
              <div><span>ไฟล์ทั้งหมด</span><strong>{{ reportDisplayStats.files }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-video">
              <span class="report-stat-icon bi bi-collection-play-fill"></span>
              <div><span>วิดีโอ</span><strong>{{ reportDisplayStats.videos }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-image">
              <span class="report-stat-icon bi bi-file-earmark-image-fill"></span>
              <div><span>รูปภาพ</span><strong>{{ reportDisplayStats.images }}</strong><small>ไฟล์</small></div>
            </article>
            <article class="report-stat-card stat-detect">
              <span class="report-stat-icon bi bi-radar"></span>
              <div><span>ผลการตรวจจับทั้งหมด</span><strong>{{ reportDisplayStats.detections }}</strong><small>รายการ</small></div>
            </article>
            <article class="report-stat-card stat-size">
              <span class="report-stat-icon bi bi-hdd-rack-fill"></span>
              <div><span>ขนาดข้อมูลรวม</span><strong>{{ reportDisplayStats.storage }}</strong></div>
            </article>
          </div>

          <article class="panel report-filter-panel">
            <label class="report-search">
              <span class="icon bi bi-search"></span>
              <input v-model.trim="reportFilters.query" type="search" placeholder="ค้นหาไฟล์, ชื่อแหล่งข้อมูล, ประเภทวัตถุ..." @input="applyReportFilters" @keyup.enter="applyReportFilters" />
            </label>
            <button class="report-filter-button" type="button" @click="cycleReportDateMode">{{ reportDateLabel }} <span class="icon bi bi-calendar3"></span></button>
            <label class="report-select"><span>ประเภทไฟล์</span><select v-model="reportFilters.fileType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option value="video">วิดีโอ</option><option value="image">รูปภาพ</option></select></label>
            <label class="report-select"><span>ประเภทวัตถุ</span><select v-model="reportFilters.targetType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option v-for="type in targetTypes" :key="`filter-${type}`" :value="type">{{ type }}</option></select></label>
            <label class="report-select"><span>แหล่งข้อมูล</span><select v-model="reportFilters.sourceType" @change="applyReportFilters"><option value="all">ทั้งหมด</option><option value="stream">URL / Stream</option><option value="upload">Upload</option></select></label>
            <button class="report-type-toggle" type="button" :class="{ 'is-active': reportTypeMode !== 'all' }" @click="toggleReportTypeMode">{{ reportTypeLabel }}</button>
            <button class="report-search-button" type="button" @click="applyReportFilters"><span class="icon bi bi-search"></span> ค้นหา</button>
          </article>
          <p v-if="reportNotice" class="report-notice">{{ reportNotice }}</p>

          <div class="report-layout">
            <article class="panel report-table-panel">
              <div class="report-table-head">
                <label><input type="checkbox" :checked="allVisibleReportsSelected" @change="toggleVisibleReportSelection" /></label>
                <span class="report-bulk-menu" aria-label="Bulk report actions">
                  <button type="button" class="icon-button export-word" title="Export selected to Word" aria-label="Export selected to Word" :disabled="!selectedReportRecords.length" @click="exportSelectedReports('word')"><span class="bi bi-file-earmark-word"></span></button>
                  <button type="button" class="icon-button export-pdf" title="Export selected to PDF" aria-label="Export selected to PDF" :disabled="!selectedReportRecords.length" @click="exportSelectedReports('pdf')"><span class="bi bi-file-earmark-pdf"></span></button>
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
                  <span class="report-tags"><em v-for="tag in record.tags" :key="`${record.id}-${tag}`"><span class="bi" :class="targetTypeIconClass(tag)" aria-hidden="true"></span>{{ tag }}</em></span>
                </span>
                <span class="file-type-badge" :class="record.ext.toLowerCase()">{{ record.ext }}</span>
                <span class="report-tag-stack"><em v-for="tag in record.tags" :key="`${record.id}-type-${tag}`"><span class="bi" :class="targetTypeIconClass(tag)" aria-hidden="true"></span>{{ tag }}</em></span>
                <span class="report-metric-strip">
                  <span v-for="type in targetTypes" :key="`${record.id}-${type}`" :class="type.toLowerCase()">
                    <i class="bi" :class="targetTypeIconClass(type)" aria-hidden="true"></i><small>{{ type }}</small><strong>{{ record.metrics[type] }}</strong>
                  </span>
                </span>
                <span class="report-date-cell"><strong>{{ record.date }}</strong><small>{{ record.time }}</small></span>
                <span class="report-size-cell">{{ record.size }}</span>
                <span class="report-action-buttons">
                  <span class="icon-button view" title="ดูข้อมูล" aria-label="ดูข้อมูล" @click.stop="viewReport(record)"><span class="bi bi-eye"></span></span>
                  <span class="icon-button export-word" title="Export Word" aria-label="Export Word" @click.stop="exportReport(record, 'word')"><span class="bi bi-file-earmark-word"></span></span>
                  <span class="icon-button export-pdf" title="Export PDF" aria-label="Export PDF" @click.stop="exportReport(record, 'pdf')"><span class="bi bi-file-earmark-pdf"></span></span>
                  <span class="icon-button delete" title="ลบ" aria-label="ลบ" @click.stop="deleteReport(record)"><span class="bi bi-trash3"></span></span>
                </span>
              </button>

              <div class="report-pagination">
                <span>แสดง {{ reportPageStart }} - {{ reportPageEnd }} จาก {{ filteredReportRecords.length }} รายการ</span>
                <div>
                <button type="button" :disabled="reportPage <= 1" @click="changeReportPage(reportPage - 1)"><span class="icon bi bi-chevron-left"></span></button>
                  <button v-for="page in reportPaginationPages" :key="`report-page-${page}`" :class="{ 'is-active': reportPage === page }" type="button" @click="changeReportPage(page)">{{ page }}</button>
                <button type="button" :disabled="reportPage >= reportTotalPages" @click="changeReportPage(reportPage + 1)"><span class="icon bi bi-chevron-right"></span></button>
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
                  <span class="box report-b1">MV</span>
                  <span class="box report-b2">AMV</span>
                  <span class="box report-b3">AMV</span>
                  <button type="button" title="Fullscreen" aria-label="Fullscreen"><span class="icon bi bi-fullscreen"></span></button>
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
                  <span v-for="type in targetTypes" :key="`detail-${type}`" :class="type.toLowerCase()"><i class="bi" :class="targetTypeIconClass(type)" aria-hidden="true"></i><small>{{ type }}</small><strong>{{ selectedReport.metrics[type] }}</strong></span>
                  <span class="total"><i class="bi bi-grid-3x3-gap-fill" aria-hidden="true"></i><small>รวมทั้งหมด</small><strong>{{ selectedReportTotal }}</strong></span>
                </div>
              </article>

            </aside>
          </div>
        </section>
      </main>
      <template v-if="saveDialog.open">
        <div class="save-modal" role="dialog" aria-modal="true" @click.self="closeSaveDialog">
        <div class="save-modal-panel">
          <button type="button" class="save-modal-close" aria-label="Close save popup" @click="closeSaveDialog">×</button>
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
            <button type="button" class="delete-modal-close" aria-label="Close delete popup" @click="closeDeleteDialog">×</button>
            <div class="delete-modal-icon" :class="{ 'is-final': deleteDialog.confirm }"><span class="bi" :class="deleteDialog.confirm ? 'bi-exclamation-triangle-fill' : 'bi-trash3'"></span></div>
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
          <button type="button" class="snapshot-modal-close" aria-label="Close snapshot popup" @click="closeSnapshotPopup">×</button>
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
        MV: 12,
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
        { id: 8, time: "10:15:34", message: "ตรวจพบ MV <strong>(Confidence: 0.93)</strong>" },
        { id: 4, time: "10:15:35", message: "ตรวจพบ AMV <strong>(Confidence: 0.92)</strong>" },
        { id: 5, time: "10:15:36", message: "ตรวจพบ LMV <strong>(Confidence: 0.88)</strong>" },
        { id: 6, time: "10:15:37", message: "ตรวจพบ AMV <strong>(Confidence: 0.95)</strong>" },
        { id: 7, time: "10:15:40", message: "ตรวจพบ AFV <strong>(Confidence: 0.90)</strong>" }
      ],
      generatedEvents: [
        "ตรวจพบ MV <strong>(Confidence: 0.93)</strong>",
        "ตรวจพบ MCV <strong>(Confidence: 0.87)</strong>",
        "ตรวจพบ CV <strong>(Confidence: 0.91)</strong>",
        "อัปเดตกรอบตรวจจับบนภาพ Live",
        "สร้าง Snapshot อัตโนมัติ",
        "ตรวจพบ AMV <strong>(Confidence: 0.94)</strong>"
      ],
      targetClassOptions: [
        { id: "MV", detail: "(Military Vehicles)", color: "#6fe58e" },
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
          tags: ["MV", "AMV", "LMV"],
          metrics: { MV: 11, AMV: 18, LMV: 32, AFV: 5, CV: 2, MCV: 0 },
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
          tags: ["MV", "AMV", "AFV", "CV"],
          metrics: { MV: 4, AMV: 6, LMV: 0, AFV: 3, CV: 1, MCV: 0 },
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
          tags: ["MV", "AMV", "LMV"],
          metrics: { MV: 3, AMV: 4, LMV: 7, AFV: 0, CV: 0, MCV: 0 },
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
          tags: ["MV", "AFV", "CV", "MCV"],
          metrics: { MV: 5, AMV: 0, LMV: 0, AFV: 12, CV: 3, MCV: 8 },
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
          tags: ["MV", "AMV", "LMV", "MCV"],
          metrics: { MV: 6, AMV: 9, LMV: 14, AFV: 0, CV: 0, MCV: 3 },
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
          metrics: { MV: 2, AMV: 0, LMV: 11, AFV: 0, CV: 0, MCV: 0 },
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
      snapshots: ["MV", "AMV", "LMV", "AFV", "AMV", "CV", "MCV"].map((type, index) => ({
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
          MV: this.metrics.MV + index,
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
        { left: 2, type: "MV", time: "00:00:12", className: "mv", boxClass: "popup-box-1" },
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
      return ["MV", "AMV", "LMV", "AFV", "CV", "MCV"];
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
          metrics: { MV: 0, AMV: 0, LMV: 0, AFV: 0, CV: 0, MCV: 0 },
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
        { id: "mv", label: "MV", value: metrics.MV, note: "▲ 9%", trendClass: "trend-up" },
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
    targetTypeIconClass(type) {
      return {
        MV: "bi-truck",
        AMV: "bi-bus-front-fill",
        LMV: "bi-car-front-fill",
        AFV: "bi-shield-shaded",
        CV: "bi-truck-front",
        MCV: "bi-truck-flatbed"
      }[type] || "bi-car-front";
    },
    liveStatusIconClass(id) {
      return {
        totalTargets: "bi-grid-3x3-gap-fill",
        total: "bi-grid-3x3-gap-fill",
        mv: "bi-truck",
        amv: "bi-bus-front-fill",
        lmv: "bi-car-front-fill",
        afv: "bi-shield-shaded",
        cv: "bi-truck-front",
        mcv: "bi-truck-flatbed",
        fps: "bi-speedometer2",
        latency: "bi-lightning-charge-fill",
        confidence: "bi-check2-circle"
      }[id] || "bi-activity";
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
        MV: 12,
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
        { id: 8, time: "10:15:34", message: "ตรวจพบ MV <strong>(Confidence: 0.93)</strong>" },
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
    async exportReport(record, format) {
      await this.exportReports([record], format, record.name);
    },
    async exportSelectedReports(format) {
      if (!this.selectedReportRecords.length) return;
      await this.exportReports(
        this.selectedReportRecords,
        format,
        `selected_reports_${this.selectedReportRecords.length}`
      );
    },
    downloadReport(record) {
      this.exportReport(record, "word");
    },
    downloadSelectedReports() {
      this.exportSelectedReports("word");
    },
    async exportReports(records, format, baseName = "detection_reports") {
      if (!records.length) return;

      const title = records.length === 1
        ? `Detection Report - ${records[0].name}`
        : `Detection Reports - ${records.length} items`;
      const safeName = this.sanitizeExportFileName(baseName);

      if (format === "pdf") {
        await this.downloadPdfReports(records, title, safeName);
        this.reportNotice = `Export PDF ${records.length} รายการแล้ว`;
        return;
      }

      const html = await this.buildReportExportHtml(records, title);

      if (format === "word") {
        this.downloadBlob(
          `\ufeff${html}`,
          `${safeName}_report.doc`,
          "application/msword;charset=utf-8"
        );
        this.reportNotice = `Export Word ${records.length} รายการแล้ว`;
        return;
      }

      await this.downloadPdfReports(records, title, safeName);
      this.reportNotice = `Export PDF ${records.length} รายการแล้ว`;
    },
    async downloadPdfReports(records, title, safeName) {
      const pages = await Promise.all(records.map((record, index) => this.buildPdfReportPage(record, title, index + 1, records.length)));
      const pdfBytes = this.createPdfFromJpegPages(pages);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    async buildPdfReportPage(record, title, pageNumber, totalPages) {
      await this.ensureExportFontsLoaded();
      const imageSrc = await this.getReportExportImageSrc(record);
      const image = await this.loadExportImage(imageSrc);
      const canvas = document.createElement("canvas");
      const width = 1240;
      const height = 1754;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);

      let y = 68;
      context.fillStyle = "#102638";
      context.font = `700 42px "TH Sarabun New"`;
      context.fillText(totalPages > 1 ? `${title} - ${pageNumber}` : title, 70, y);

      y += 40;
      const imageX = 70;
      const imageW = 1100;
      const imageH = Math.round(imageW * (image.height / image.width));
      context.drawImage(image, imageX, y, imageW, imageH);
      context.strokeStyle = "#b9cbd6";
      context.lineWidth = 2;
      context.strokeRect(imageX, y, imageW, imageH);

      y += imageH + 44;
      context.fillStyle = "#102638";
      context.font = `700 36px "TH Sarabun New"`;
      context.fillText(`${record.name}.${String(record.ext).toLowerCase()}`, 70, y);
      context.fillStyle = "#1672a6";
      context.font = `400 30px "TH Sarabun New"`;
      context.fillText(record.source || "-", 70, y + 34);

      y += 74;
      this.drawPdfSectionTitle(context, 70, y, 1100, "รายละเอียดไฟล์");
      y += 52;
      this.drawPdfInfoTable(context, 70, y, 1100, [
        ["ประเภทไฟล์", record.ext, "ความยาววิดีโอ", record.duration],
        ["วันที่ / เวลา", `${record.date} ${record.time}`, "ขนาดไฟล์", record.size],
        ["ความละเอียด", record.resolution, "FPS", record.fps],
        ["ผู้บันทึก", record.recorder, "หมายเหตุ", "-"]
      ]);

      y += 292;
      this.drawPdfSectionTitle(context, 70, y, 1100, "สรุปผลตรวจจับ");
      y += 48;
      this.drawPdfSummaryTable(context, 70, y, 1100, record);

      return this.jpegDataUrlToPage(canvas.toDataURL("image/jpeg", 0.92));
    },
    drawPdfSectionTitle(context, x, y, width, title) {
      context.fillStyle = "#102638";
      context.font = `700 34px "TH Sarabun New"`;
      context.fillText(title, x, y);
      context.strokeStyle = "#234d64";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(x, y + 14);
      context.lineTo(x + width, y + 14);
      context.stroke();
    },
    drawPdfInfoTable(context, x, y, width, rows) {
      const rowHeight = 62;
      const colWidths = [235, 315, 235, 315];

      rows.forEach((row, rowIndex) => {
        let cellX = x;
        row.forEach((value, colIndex) => {
          const cellWidth = colWidths[colIndex];
          const isHeader = colIndex % 2 === 0;
          context.fillStyle = isHeader ? "#234d64" : (rowIndex % 2 === 0 ? "#f8fbfd" : "#eef5f9");
          context.fillRect(cellX, y + rowIndex * rowHeight, cellWidth, rowHeight);
          context.strokeStyle = "#bfd0da";
          context.lineWidth = 2;
          context.strokeRect(cellX, y + rowIndex * rowHeight, cellWidth, rowHeight);
          context.fillStyle = isHeader ? "#ffffff" : "#102638";
          context.font = `700 ${isHeader ? 27 : 29}px "TH Sarabun New"`;
          context.textAlign = "left";
          context.fillText(String(value ?? "-"), cellX + 18, y + rowIndex * rowHeight + 41);
          cellX += cellWidth;
        });
      });
    },
    drawPdfSummaryTable(context, x, y, width, record) {
      const labels = [...this.targetTypes, "รวมทั้งหมด"];
      const values = [
        ...this.targetTypes.map((type) => record.metrics[type] ?? 0),
        Object.values(record.metrics).reduce((sum, value) => sum + (Number(value) || 0), 0)
      ];
      const cellWidth = width / labels.length;
      const rowHeight = 66;

      context.font = `700 26px "TH Sarabun New"`;
      labels.forEach((label, index) => {
        const cellX = x + index * cellWidth;
        const isTotal = index === labels.length - 1;
        context.fillStyle = isTotal ? "#1672a6" : "#234d64";
        context.fillRect(cellX, y, cellWidth, rowHeight);
        context.strokeStyle = "#bfd0da";
        context.lineWidth = 2;
        context.strokeRect(cellX, y, cellWidth, rowHeight);
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.fillText(label, cellX + cellWidth / 2, y + 42);
      });

      values.forEach((value, index) => {
        const cellX = x + index * cellWidth;
        const isTotal = index === values.length - 1;
        context.fillStyle = isTotal ? "#1672a6" : "#ffffff";
        context.fillRect(cellX, y + rowHeight, cellWidth, rowHeight);
        context.strokeStyle = "#bfd0da";
        context.strokeRect(cellX, y + rowHeight, cellWidth, rowHeight);
        context.fillStyle = isTotal ? "#ffffff" : "#102638";
        context.font = `700 ${isTotal ? 32 : 30}px "TH Sarabun New"`;
        context.textAlign = "center";
        context.fillText(String(value), cellX + cellWidth / 2, y + rowHeight + 43);
      });
      context.textAlign = "left";
    },
    jpegDataUrlToPage(dataUrl) {
      const [header, base64] = dataUrl.split(",");
      const binary = atob(base64 || "");
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      return {
        bytes,
        width: 1240,
        height: 1754,
        mime: header
      };
    },
    createPdfFromJpegPages(pages) {
      const encoder = new TextEncoder();
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const objects = [];
      const pageObjectIds = [];

      const addObject = (parts) => {
        objects.push(parts);
        return objects.length;
      };

      addObject([encoder.encode("<< /Type /Catalog /Pages 2 0 R >>")]);
      addObject([encoder.encode("PLACEHOLDER")]);

      pages.forEach((page, index) => {
        const imageId = objects.length + 3;
        const contentId = objects.length + 2;
        const pageId = objects.length + 1;
        pageObjectIds.push(pageId);
        addObject([encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)]);
        const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im${index + 1} Do Q`;
        addObject([encoder.encode(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)]);
        addObject([
          encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`),
          page.bytes,
          encoder.encode("\nendstream")
        ]);
      });

      objects[1] = [encoder.encode(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`)];

      const chunks = [encoder.encode("%PDF-1.4\n")];
      const offsets = [0];
      let byteLength = chunks[0].length;

      objects.forEach((parts, index) => {
        offsets[index + 1] = byteLength;
        const header = encoder.encode(`${index + 1} 0 obj\n`);
        const footer = encoder.encode("\nendobj\n");
        chunks.push(header, ...parts, footer);
        byteLength += header.length + parts.reduce((sum, part) => sum + part.length, 0) + footer.length;
      });

      const xrefOffset = byteLength;
      const xrefRows = offsets
        .map((offset, index) => index === 0 ? "0000000000 65535 f " : `${String(offset).padStart(10, "0")} 00000 n `)
        .join("\n");
      const trailer = encoder.encode(`xref\n0 ${objects.length + 1}\n${xrefRows}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
      chunks.push(trailer);
      byteLength += trailer.length;

      const pdfBytes = new Uint8Array(byteLength);
      let offset = 0;
      chunks.forEach((chunk) => {
        pdfBytes.set(chunk, offset);
        offset += chunk.length;
      });

      return pdfBytes;
    },
    async buildReportExportHtml(records, title) {
      const fontFaceCss = await this.getExportFontFaceCss();
      const rows = await Promise.all(records.map(async (record, index) => {
        const imageSrc = await this.getReportExportImageSrc(record);
        const detections = this.targetTypes
          .map((type) => `<th>${this.escapeHtml(type)}</th>`)
          .join("");
        const detectionValues = this.targetTypes
          .map((type) => `<td>${this.escapeHtml(record.metrics[type] ?? 0)}</td>`)
          .join("");
        const total = Object.values(record.metrics).reduce((sum, value) => sum + (Number(value) || 0), 0);

        return `
          <section class="report-card">
            <table class="preview-table">
              <tr>
                <td>
                  <img src="${this.escapeHtml(imageSrc)}" width="693" alt="${this.escapeHtml(record.name)}" />
                </td>
              </tr>
            </table>
            <div class="file-name">
              <strong>${this.escapeHtml(record.name)}.${this.escapeHtml(String(record.ext).toLowerCase())}</strong>
              <span>${this.escapeHtml(record.source)}</span>
            </div>
            <h2 class="section-title">รายละเอียดไฟล์</h2>
            <table class="detail-grid">
              <tr>
                <th>ประเภทไฟล์</th><td>${this.escapeHtml(record.ext)}</td>
                <th>ความยาววิดีโอ</th><td>${this.escapeHtml(record.duration)}</td>
              </tr>
              <tr>
                <th>วันที่ / เวลา</th><td>${this.escapeHtml(`${record.date} ${record.time}`)}</td>
                <th>ขนาดไฟล์</th><td>${this.escapeHtml(record.size)}</td>
              </tr>
              <tr>
                <th>ความละเอียด</th><td>${this.escapeHtml(record.resolution)}</td>
                <th>FPS</th><td>${this.escapeHtml(record.fps)}</td>
              </tr>
              <tr>
                <th>ผู้บันทึก</th><td>${this.escapeHtml(record.recorder)}</td>
                <th>หมายเหตุ</th><td>-</td>
              </tr>
            </table>
            <h2 class="summary-title">สรุปผลตรวจจับ</h2>
            <table class="summary-table">
              <tr>${detections}<th class="total-head">รวมทั้งหมด</th></tr>
              <tr>${detectionValues}<td class="total-value">${this.escapeHtml(total)}</td></tr>
            </table>
          </section>
        `;
      }));

      return `<!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${this.escapeHtml(title)}</title>
            <style>
              ${fontFaceCss}
              @page WordExport { size: 8.5in 11in; margin: 0.45in 0.55in 0.45in 0.55in; }
              .word-export-page { page: WordExport; }
              body { margin: 0; color: #102638; background: #ffffff; font-family: "TH Sarabun New"; font-size: 16pt; }
              h1 { width: 520pt; margin: 0 auto 8px; color: #102638; font-size: 20pt; line-height: 1.05; }
              h2 { width: 520pt; margin: 0 auto 5px; color: #102638; font-size: 18pt; line-height: 1.05; }
              .report-card { width: 520pt; page: WordExport; margin: 0 auto 12px; padding: 0; background: #ffffff; overflow: hidden; }
              .preview-table { width: 520pt; margin: 0 0 7px 0; border-collapse: separate; border-spacing: 0; table-layout: fixed; page-break-inside: avoid; }
              .preview-table td { width: 520pt; padding: 0; border: 1px solid #b9cbd6; background: #0a1217; line-height: 0; }
              .preview-table img { display: block; width: 100%; height: auto; margin: 0; padding: 0; border: 0; }
              .file-name { margin-bottom: 8px; line-height: 1.05; }
              .file-name strong { display: block; color: #102638; font-size: 20pt; line-height: 1.05; }
              .file-name span { display: block; margin-top: 2px; color: #1672a6; font-size: 18pt; line-height: 1.05; }
              .section-title, .summary-title { padding: 3px 0 2px; border-bottom: 1.5px solid #234d64; color: #102638; }
              table { width: 520pt; max-width: 520pt; border-collapse: separate; border-spacing: 0; table-layout: fixed; margin: 0 0 8px 0; font-size: 16pt; line-height: 1; }
              th, td { padding: 4px 7px; border: 1px solid #bfd0da; text-align: left; vertical-align: middle; font-size: 16pt; }
              th { color: #ffffff; background: #234d64; font-weight: 700; }
              td { color: #102638; background: #f8fbfd; font-weight: 700; }
              .detail-grid th, .detail-grid td { width: 130pt; }
              .detail-grid tr:nth-child(even) td { background: #eef5f9; }
              .summary-table th, .summary-table td { text-align: center; }
              .summary-table { page-break-inside: avoid; margin-bottom: 0; }
              .summary-table th, .summary-table td { width: 74.28pt; }
              .summary-table td { background: #ffffff; font-size: 16pt; }
              .summary-table .total-head { background: #1672a6; }
              .summary-table .total-value { color: #ffffff; background: #1672a6; font-size: 16pt; }
              @media print {
                body { margin: 0; }
                tr, th, td { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="word-export-page">
              <h1>${this.escapeHtml(title)}</h1>
              ${rows.join("")}
            </div>
          </body>
        </html>`;
    },
    async getExportFontFaceCss() {
      const fonts = [
        {
          weight: 400,
          style: "normal",
          path: "/Font/TH SarabunNew/THSarabunNew.ttf"
        },
        {
          weight: 700,
          style: "normal",
          path: "/Font/TH SarabunNew/THSarabunNew Bold.ttf"
        },
        {
          weight: 400,
          style: "italic",
          path: "/Font/TH SarabunNew/THSarabunNew Italic.ttf"
        },
        {
          weight: 700,
          style: "italic",
          path: "/Font/TH SarabunNew/THSarabunNew BoldItalic.ttf"
        }
      ];

      const rules = await Promise.all(fonts.map(async (font) => {
        const dataUrl = await this.getExportAssetDataUrl(font.path);
        if (!dataUrl) return "";

        return `
          @font-face {
            font-family: "TH Sarabun New";
            src: url("${dataUrl}") format("truetype");
            font-weight: ${font.weight};
            font-style: ${font.style};
          }
        `;
      }));

      return rules.filter(Boolean).join("\n");
    },
    async getExportAssetDataUrl(path) {
      try {
        const response = await fetch(this.resolveExportAssetUrl(path));
        if (!response.ok) return "";
        const blob = await response.blob();

        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve("");
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        return "";
      }
    },
    async ensureExportFontsLoaded() {
      if (this.exportFontsLoaded || !("FontFace" in window)) return;

      const fonts = [
        {
          weight: "400",
          style: "normal",
          path: "/Font/TH SarabunNew/THSarabunNew.ttf"
        },
        {
          weight: "700",
          style: "normal",
          path: "/Font/TH SarabunNew/THSarabunNew Bold.ttf"
        }
      ];

      await Promise.all(fonts.map(async (font) => {
        try {
          const face = new FontFace(
            "TH Sarabun New",
            `url("${this.resolveExportAssetUrl(font.path)}")`,
            { weight: font.weight, style: font.style }
          );
          const loadedFace = await face.load();
          document.fonts.add(loadedFace);
        } catch (error) {
          // Fall back to installed system fonts if the bundled font cannot load.
        }
      }));

      await document.fonts.ready;
      this.exportFontsLoaded = true;
    },
    async loadExportImage(src) {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
    },
    async getReportExportImageSrc(record) {
      const fallback = this.resolveExportAssetUrl(record.image);

      try {
        const dataUrl = await this.getExportAssetDataUrl(record.image);
        if (!dataUrl) return fallback;

        return await this.buildAnnotatedExportImage(dataUrl, record.duration);
      } catch (error) {
        return fallback;
      }
    },
    async buildAnnotatedExportImage(src, duration) {
      return await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const sourceWidth = image.naturalWidth || image.width;
          const sourceHeight = image.naturalHeight || image.height;
          const width = Math.min(1240, sourceWidth);
          const height = Math.round(sourceHeight * (width / sourceWidth));
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          if (!context) {
            resolve(src);
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          this.drawExportDetectionBox(context, width, height, 0.08, 0.45, 0.28, 0.28, "MV");
          this.drawExportDetectionBox(context, width, height, 0.58, 0.32, 0.17, 0.2, "AMV");
          this.drawExportDetectionBox(context, width, height, 0.77, 0.25, 0.15, 0.18, "AMV");

          const timeText = this.getExportDurationOverlay(duration);
          context.font = `700 ${Math.max(14, Math.round(width * 0.018))}px Arial, sans-serif`;
          context.textAlign = "right";
          context.textBaseline = "bottom";
          context.fillStyle = "#ffffff";
          context.shadowColor = "rgba(0, 0, 0, 0.9)";
          context.shadowBlur = Math.max(4, Math.round(width * 0.006));
          context.fillText(timeText, width - Math.round(width * 0.018), height - Math.round(height * 0.018));
          context.shadowBlur = 0;

          resolve(canvas.toDataURL("image/png"));
        };
        image.onerror = () => resolve(src);
        image.src = src;
      });
    },
    getExportDurationOverlay(duration) {
      const value = String(duration || "").trim();
      if (!value || value === "-" || value === "ภาพนิ่ง") return value || "-";
      return `00:00:45 / ${value}`;
    },
    drawExportDetectionBox(context, imageWidth, imageHeight, left, top, width, height, label) {
      const x = Math.round(imageWidth * left);
      const y = Math.round(imageHeight * top);
      const boxWidth = Math.round(imageWidth * width);
      const boxHeight = Math.round(imageHeight * height);
      const lineWidth = Math.max(3, Math.round(imageWidth * 0.004));
      const labelSize = Math.max(16, Math.round(imageWidth * 0.022));

      context.save();
      context.lineWidth = lineWidth;
      context.strokeStyle = "#5cff80";
      context.strokeRect(x, y, boxWidth, boxHeight);
      context.font = `800 ${labelSize}px Arial, sans-serif`;
      context.textBaseline = "top";
      context.fillStyle = "#5cff80";
      context.shadowColor = "rgba(0, 0, 0, 0.9)";
      context.shadowBlur = Math.max(3, Math.round(imageWidth * 0.004));
      context.fillText(label, x + lineWidth + 4, y + lineWidth + 3);
      context.restore();
    },
    resolveExportAssetUrl(path) {
      if (!path) return "";
      try {
        return new URL(path, window.location.origin).href;
      } catch (error) {
        return path;
      }
    },
    openPdfExportWindow(html, title, count) {
      const printWindow = window.open("", "_blank", "width=960,height=720");

      if (!printWindow) {
        this.downloadBlob(`\ufeff${html}`, `${this.sanitizeExportFileName(title)}_pdf_export.html`, "text/html;charset=utf-8");
        this.reportNotice = "Popup ถูกบล็อก จึง export เป็น HTML สำหรับเปิดแล้ว Save as PDF";
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.document.title = title;
      printWindow.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
      this.reportNotice = `เปิดหน้าต่าง Export PDF ${count} รายการแล้ว`;
    },
    downloadBlob(content, fileName, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    sanitizeExportFileName(value) {
      return String(value || "detection_report")
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, "_")
        .slice(0, 80) || "detection_report";
    },
    escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
