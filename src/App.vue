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
                <strong>แผงควบคุม</strong>
                <span>ตั้งค่า source และเริ่ม Detect</span>
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

          <article class="panel step-panel input-source-panel">
            <div class="step-head">
              <span class="step-number step-source">1</span>
              <div class="step-head-copy">
                <h2>Input Source</h2>
              </div>
            </div>
            <div class="source-mode-switch" role="tablist" aria-label="Input source type">
              <button
                v-for="option in sourceModeOptions"
                :key="option.id"
                class="source-mode-pill"
                :class="{ 'is-active': sourceMode === option.id }"
                type="button"
                @click="setSourceMode(option.id)"
              >
                <span class="source-mode-icon bi" :class="option.icon" aria-hidden="true"></span>
                <span>{{ option.title }}</span>
              </button>
            </div>
            <div v-if="sourceMode === 'stream'" class="stream-source-panel">
              <div class="input-section-label input-section-label-compact">
                <span>{{ sourceListTitle }}</span>
                <small v-if="queuedSourceCount">{{ sourceStatus }}</small>
              </div>
              <div class="source-list stream-source-list">
                <div v-for="(slot, index) in sourceSlots" :key="slot.id" class="stream-source-row" :class="`is-${sourceSlotState(slot)}`">
                  <span class="stream-source-label">Stream {{ index + 1 }}</span>
                  <input v-model="slot.url" type="text" inputmode="url" :aria-label="`URL stream ${index + 1}`" :placeholder="streamPlaceholder" @input="clearStreamPreviewError(slot.id)" />
                  <span v-if="sourceSlotState(slot) !== 'empty'" class="source-row-state" :class="`is-${sourceSlotState(slot)}`">{{ sourceSlotStateLabel(slot) }}</span>
                  <button class="source-remove stream-remove-button" type="button" title="Remove source" aria-label="Remove source" :disabled="isSourceRemoveDisabled(slot)" @click="removeSourceSlot(slot)">×</button>
                </div>
              </div>
              <div class="source-actions-row source-actions-row-clean">
                <button class="secondary-small" type="button" :disabled="!canAddMoreSources" @click="addSourceSlot">{{ addSourceLabel }}</button>
              </div>
            </div>
            <div v-else-if="primarySourceSlot" class="single-upload-panel" :class="`is-${sourceSlotState(primarySourceSlot)}`">
              <label class="single-upload-card">
                <input class="hidden-file" type="file" :accept="fileAccept" @change="handleFileSelect($event, primarySourceSlot)" />
                <span class="single-upload-icon bi" :class="sourceMode === 'image' ? 'bi-image' : 'bi-film'" aria-hidden="true"></span>
                <span class="single-upload-copy">
                  <strong>{{ singleUploadTitle }}</strong>
                </span>
                <span class="single-upload-action">{{ singleUploadButtonLabel }}</span>
              </label>
            </div>
            <div class="detect-actions-row">
              <button id="startBtn" class="primary-small detect-action-button start-detect-button" :class="{ 'is-running': running }" :disabled="!running && !canRunDetection" :title="running ? 'Detection in progress' : runDisabledReason" @click="toggleRunning">
                <span class="bi" :class="running ? 'bi-hourglass-split' : 'bi-play-fill'" aria-hidden="true"></span>
                <strong>{{ running ? 'กำลัง Detect' : 'Detect' }}</strong>
              </button>
              <button class="secondary-small detect-action-button stop-detect-button" type="button" :disabled="!running" @click="stopDetection">
                <span class="bi bi-stop-fill" aria-hidden="true"></span>
                <strong>หยุด</strong>
              </button>
            </div>
          </article>

          <article class="panel step-panel target-panel target-class-panel">
            <button class="target-class-head" type="button" :aria-expanded="!targetPanelCollapsed" @click="targetPanelCollapsed = !targetPanelCollapsed">
              <span class="target-head-icon bi bi-bullseye"></span>
              <span class="target-head-copy">
                <strong>TARGET CLASSES</strong>
              </span>
              <span class="target-head-chevron"></span>
            </button>
            <div v-show="!targetPanelCollapsed" class="target-class-list" id="targetGrid">
              <button class="target-class-row" :class="{ 'is-selected': isTargetSelected('ALL'), 'is-muted': !isTargetSelected('ALL') }" type="button" data-type="ALL" title="Select all target classes" aria-label="Select all target classes" @click="selectTarget('ALL')">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-type-icon bi bi-grid-3x3-gap-fill" aria-hidden="true"></span>
                <span class="target-class-copy">
                  <strong>SELECT ALL</strong>
                </span>
                <span class="target-class-action"></span>
              </button>
              <button v-for="target in targetClassOptions" :key="target.id" class="target-class-row" :class="{ 'is-selected': isTargetSelected(target.id), 'is-muted': !isTargetSelected(target.id) }" type="button" :data-type="target.id" :aria-label="`เลือก ${target.id}`" @click="selectTarget(target.id)">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-type-icon bi" :class="targetTypeIconClass(target.id)" aria-hidden="true"></span>
                <span class="target-class-copy">
                  <strong>{{ target.id }}</strong>
                </span>
                <span class="target-color-swatch" :style="{ '--target-row-color': target.color }"></span>
              </button>
            </div>
          </article>

        </section>

        <section v-show="currentView === 'detect'" class="content-grid">
          <article ref="previewPanel" class="panel preview-panel">
            <div class="panel-title compact preview-header">
              <div class="summary-heading">
                <h2>ภาพแสดงผลขนาดใหญ่ (Live)</h2>
              </div>
              <div class="preview-tools">
                <button title="บันทึกภาพ" aria-label="บันทึกภาพ"><span class="icon bi bi-camera"></span></button>
                <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen"><span class="icon bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></span></button>
              </div>
            </div>
            <div ref="liveFrame" class="live-frame" :class="[`source-count-${previewSourceCount}`, { 'has-sources': activeSources.length, 'is-fullscreen': fullscreenActive }]">
              <div v-for="source in activeSources" :key="source.id" class="feed-tile" :data-live-title="`LIVE DETECTION (${source.cameraLabel})   •  LIVE`">
                <div class="feed-media-stage">
                <img
                  v-if="isProcessedVideoSource(source)"
                    class="live-stream-preview processed-video-preview"
                    :src="source.analysis.liveStreamUrl"
                    :alt="`ผลตรวจจับแบบต่อเนื่องจาก ${source.label}`"
                  />
                <img
                  v-else-if="isLiveStreamSource(source)"
                    class="live-stream-preview"
                    :src="streamPreviewUrl(source)"
                    :alt="`ภาพสดจาก ${source.label}`"
                    @error="markStreamPreviewUnavailable(source)"
                  />
                  <video
                  v-else-if="isSourcePlayable(source)"
                    :ref="(element) => setVideoElement(source.id, element)"
                    :src="source.src"
                    autoplay
                    muted
                    loop
                    playsinline
                    preload="metadata"
                    @loadedmetadata="handleVideoLoadedMetadata(source, $event)"
                    @timeupdate="handleVideoTimeUpdate(source, $event)"
                    @play="setVideoPlayingState(source.id, true)"
                    @pause="setVideoPlayingState(source.id, false)"
                  ></video>
                  <img v-else :src="sourcePreviewImage(source)" :alt="source.label" />
                </div>
                <div v-if="isSourceProcessing(source)" class="scan-line"></div>
                <span v-if="isSourceProcessing(source)" class="live-dot">กำลังประมวลผล</span>
                <span class="feed-name">{{ source.label }}</span>
                <span v-if="source.analysis?.status === 'error'" class="feed-error">
                  <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                  <span>ไม่สามารถรับภาพจาก stream</span>
                  <small>{{ source.analysis.error }}</small>
                </span>
                <span v-if="source.analysis?.status === 'ready'" class="feed-analysis-note">{{ sourceDetectionNote(source) }}</span>
                <span v-if="!source.analysis && sourceMode === 'stream'" class="box b1">MV</span>
                <span v-if="!source.analysis && sourceMode === 'stream'" class="box b2">AMV</span>
                <span v-if="!source.analysis && sourceMode === 'stream'" class="box b3">LMV</span>
                <div v-if="isVideoSource(source) && source.analysis?.status !== 'stopped'" class="live-overlay-menu live-video-overlay-menu" aria-label="Video view tools">
                  <button type="button" :title="fullscreenActive ? 'ออกจากโหมดเต็มหน้าจอ' : 'เต็มหน้าจอ'" :aria-label="fullscreenActive ? 'ออกจากโหมดเต็มหน้าจอ' : 'เต็มหน้าจอ'" @click.stop="toggleFullscreen">
                    <span class="icon bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-fullscreen'" aria-hidden="true"></span>
                  </button>
                </div>
                <div v-if="isVideoSource(source) && source.analysis?.status !== 'stopped'" class="feed-control-bar" aria-label="Video playback controls">
                  <button type="button" title="ย้อนกลับ 5 วินาที" aria-label="ย้อนกลับ 5 วินาที" @click="seekSource(source, -5)"><span class="icon bi bi-skip-backward-fill"></span></button>
                  <button type="button" title="Play" aria-label="Play" @click="playSource(source)"><span class="icon bi bi-play-fill"></span></button>
                  <button type="button" title="Pause" aria-label="Pause" @click="pauseSource(source)"><span class="icon bi bi-pause-fill"></span></button>
                  <button type="button" title="Stop" aria-label="Stop" @click="stopSource(source)"><span class="icon bi bi-stop-fill"></span></button>
                  <button type="button" title="Restart" aria-label="Restart" @click="restartSource(source)"><span class="icon bi bi-arrow-clockwise"></span></button>
                  <div class="feed-progress"><span :style="{ width: `${sourceProgressPercent(source)}%` }"></span></div>
                  <time>{{ formatDuration(sourceCurrentTime(source)) }} / {{ sourceDurationLabel(source) }}</time>
                  <button type="button" class="feed-speed" title="Playback speed" aria-label="Playback speed" @click="cycleSourceSpeed(source)">{{ sourcePlaybackRateLabel(source.id, source) }}</button>
                </div>
              </div>
              <template v-if="!activeSources.length">
                <img src="/assets/surveillance-road.png" alt="ภาพถนนและยานพาหนะจากมุมสูงสำหรับตัวอย่างการตรวจจับ" />
                <div v-if="showPreviewProcessingState" class="scan-line"></div>
                <span v-if="showPreviewProcessingState" class="live-dot">กำลังประมวลผล</span>
                <div class="live-overlay-menu" aria-label="Live view tools">
                  <button type="button" title="Capture image" aria-label="Capture image"><span class="icon bi bi-camera"></span></button>
                  <button type="button" :title="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" :aria-label="fullscreenActive ? 'Exit fullscreen' : 'Fullscreen'" @click.stop="toggleFullscreen"><span class="icon bi" :class="fullscreenActive ? 'bi-fullscreen-exit' : 'bi-fullscreen'"></span></button>
                </div>
              </template>
              <div class="live-frame-tools">
                <button type="button" title="จับภาพ" aria-label="จับภาพ"><span class="icon bi bi-camera"></span></button>
                <button type="button" title="ย่อภาพ" aria-label="ย่อภาพ" @click.stop="toggleFullscreen"><span class="icon bi bi-fullscreen-exit"></span></button>
              </div>
            </div>
            <div v-if="showGlobalPlaybackBar" class="video-bar">
              <button title="ย้อนกลับ" aria-label="ย้อนกลับ"><span class="icon bi bi-skip-backward-fill"></span></button>
              <button title="เล่น" aria-label="เล่น"><span class="icon bi bi-play-fill"></span></button>
              <button title="ถัดไป" aria-label="ถัดไป"><span class="control-icon bi bi-skip-forward-fill"></span></button>
              <button title="หยุดชั่วคราว" aria-label="หยุดชั่วคราว" class="pause-bars"></button>
              <button title="หยุด" aria-label="หยุด"><span class="control-icon bi bi-stop-fill"></span></button>
              <button title="เริ่มต้นใหม่" aria-label="เริ่มต้นใหม่"><span class="control-icon bi bi-arrow-clockwise"></span></button>
              <div class="progress"><span></span></div>
              <time>00:00:00 / {{ monitoringSources[0]?.analysis?.media?.durationLabel || '00:00:00' }}</time>
              <button title="จับภาพ" aria-label="จับภาพ"><span class="icon bi bi-camera"></span></button>
              <button class="speed">1.0x</button>
            </div>
          </article>

          <aside class="intel-stack" aria-label="Detection overview and event feed">
            <article class="panel summary-panel">
              <div class="panel-title compact">
                <div class="summary-heading">
                  <h2>Mission Overview</h2>
                </div>
                <span class="summary-badge" :class="{ 'is-live': running }">{{ running ? "Mission Live" : "Standby" }}</span>
              </div>
              <div class="overview-grid">
                <article class="overview-card total-card" aria-label="Total Targets">
                  <span class="overview-total-label">Total</span>
                  <strong id="totalCount">{{ totalCount }}</strong>
                  <small v-if="queuedSourceCount">{{ sourceStatus }}</small>
                </article>
                <article v-for="type in targetTypes" :key="`overview-${type}`" class="overview-card overview-type-card" :class="type.toLowerCase()" :aria-label="`${type}: ${metrics[type]}`">
                  <i class="overview-type-icon bi" :class="targetTypeIconClass(type)" aria-hidden="true"></i>
                  <strong>{{ metrics[type] }}</strong>
                </article>
              </div>
              <div class="live-status-strip compact-strip" aria-label="สถานะการตรวจจับแบบย่อ">
                <article v-for="card in overviewStatusCards" :key="`overview-${card.id}`" class="live-status-card" :class="[card.id, card.trendClass]">
                  <div class="live-status-copy">
                    <span>{{ card.label }}</span>
                    <strong>{{ card.value }}<small v-if="card.unit">{{ card.unit }}</small></strong>
                    <em>{{ card.note }}</em>
                  </div>
                  <span class="live-status-icon bi" :class="liveStatusIconClass(card.id)" aria-hidden="true"></span>
                </article>
              </div>
              <div class="summary-lanes source-lanes" id="metrics">
                <div v-for="group in sourceMetrics" :key="`summary-${group.source.id}`" class="source-lane summary-lane">
                  <div class="lane-head">
                    <strong>{{ group.source.cameraLabel }}</strong>
                    <span>{{ group.source.label }}</span>
                  </div>
                  <div class="metric-grid">
                    <div v-for="type in targetTypes" :key="`source-${group.source.id}-${type}`" class="metric" :class="type.toLowerCase()"><span class="metric-bi bi" :class="targetTypeIconClass(type)"></span><span class="metric-label">{{ type }}</span><strong>{{ group.metrics[type] }}</strong></div>
                  </div>
                </div>
              </div>
              <div class="metric-grid legacy-metric-grid">
                <div v-for="type in targetTypes" :key="`legacy-${type}`" class="metric" :class="type.toLowerCase()"><span class="metric-bi bi" :class="targetTypeIconClass(type)"></span><span class="metric-label">{{ type }}</span><strong>{{ metrics[type] }}</strong></div>
              </div>
            </article>

            <article class="panel intel-panel">
              <div class="panel-title compact intel-panel-head">
                <div class="summary-heading">
                  <h2>Operational Feed</h2>
                </div>
                <div class="intel-tabs" role="tablist" aria-label="Operational feed tabs">
                  <button class="intel-tab" :class="{ 'is-active': activeIntelTab === 'logs' }" type="button" @click="activeIntelTab = 'logs'">Log</button>
                  <button class="intel-tab" :class="{ 'is-active': activeIntelTab === 'timeline' }" type="button" @click="activeIntelTab = 'timeline'">Timeline</button>
                  <button class="intel-tab" :class="{ 'is-active': activeIntelTab === 'snapshots' }" type="button" @click="activeIntelTab = 'snapshots'">Snapshot</button>
                </div>
              </div>
              <div class="intel-panel-body">
                <section v-show="activeIntelTab === 'logs'" class="intel-section log-panel">
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
                </section>

                <section v-show="activeIntelTab === 'timeline'" class="intel-section timeline-panel">
                  <div v-if="showTimelinePanel" class="source-lanes timeline-lanes">
                    <div v-for="group in sourceTimelineGroups" :key="`timeline-${group.source.id}`" class="source-lane">
                      <div class="lane-head">
                        <strong>{{ group.source.cameraLabel }}</strong>
                        <span>{{ group.source.label }}</span>
                      </div>
                      <div class="timeline">
                        <div class="timeline-track"></div>
                        <button v-for="event in group.events" :key="`${group.source.id}-${event.time}-${event.type}-${event.total}`" type="button" class="event" :class="event.typeClass" :style="{ left: `${event.left}%` }" @click="openTimelinePopup(event, group.source)" :aria-label="`Open ${event.type} detection at ${event.time}`"></button>
                      </div>
                      <p v-if="!group.events.length" class="timeline-empty">ไม่พบการตรวจจับในช่วงเวลาที่วิเคราะห์</p>
                      <div class="time-scale">
                        <span v-for="marker in group.scale" :key="`${group.source.id}-${marker}`">{{ marker }}</span>
                      </div>
                    </div>
                  </div>
                  <p v-else class="intel-empty">ยังไม่มี timeline สำหรับแหล่งข้อมูลชุดนี้</p>
                  <div v-if="showTimelinePanel" class="filter-row">
                    <label><input type="checkbox" :checked="allTimelineTargetsSelected" @change="toggleTimelineTarget('ALL')" /><span class="filter-icon bi bi-grid-3x3-gap-fill" aria-hidden="true"></span><span>ทั้งหมด</span></label>
                    <label v-for="type in targetTypes" :key="`target-filter-${type}`"><input type="checkbox" :checked="isTimelineTargetSelected(type)" @change="toggleTimelineTarget(type)" /><span class="filter-icon bi" :class="targetTypeIconClass(type)" aria-hidden="true"></span><span>{{ type }}</span></label>
                  </div>
                </section>

                <section v-show="activeIntelTab === 'snapshots'" class="intel-section snapshots-panel">
                  <div class="snapshot-strip">
                    <button title="ก่อนหน้า" aria-label="ก่อนหน้า"><span class="icon bi bi-chevron-left"></span></button>
                    <div class="snapshots source-lanes snapshot-lanes" id="snapshots">
                      <div v-for="group in sourceSnapshots" :key="`snapshot-${group.source.id}`" class="source-lane snapshot-lane">
                        <div class="lane-head">
                          <strong>{{ group.source.cameraLabel }}</strong>
                          <span>{{ group.source.label }}</span>
                        </div>
                        <div v-if="group.snapshots.length" class="snapshot-row" :class="{ 'is-single': group.snapshots.length === 1 }">
                          <button v-for="snapshot in group.snapshots" :key="`${group.source.id}-${snapshot.time}-${snapshot.type}`" type="button" class="snapshot" :class="{ 'is-image-source': !isSourcePlayable(group.source) }" :title="snapshot.summaryText || `${snapshot.type} ${snapshot.time}`" @click="openSnapshotPopup(snapshot, group.source)" :aria-label="`Open ${snapshot.type} snapshot ${snapshotDisplayTime(snapshot, group.source)}`">
                            <img :src="snapshot.image || group.source.analysis?.previewImage || fallbackPreviewImage" :alt="`Snapshot ${snapshot.type}`" />
                            <span class="snapshot-badge">{{ snapshot.type }}</span>
                            <div class="snapshot-copy">
                              <strong>{{ snapshotDisplayTime(snapshot, group.source) }}</strong>
                              <span>{{ snapshot.summaryText || `${snapshot.total} detections` }}</span>
                            </div>
                          </button>
                        </div>
                        <p v-else class="snapshot-empty">ไม่พบ snapshot จากผลตรวจจับ</p>
                      </div>
                    </div>
                    <button title="ถัดไป" aria-label="ถัดไป"><span class="icon bi bi-chevron-right"></span></button>
                  </div>
                  <div class="pager"><span class="is-active"></span><span></span><span></span><span></span></div>
                </section>
              </div>
            </article>
          </aside>
        </section>

        <section v-show="currentView === 'report'" class="report-page" aria-label="Saved detection reports">
          <div class="report-heading">
            <h1>รายงานบันทึกข้อมูล</h1>
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

              <div v-for="record in visibleReportRecords" :key="record.displayId" class="report-row" :class="{ 'is-selected': selectedReport.id === record.id }" role="button" tabindex="0" @click="selectReport(record)" @keydown.enter="selectReport(record)" @keydown.space.prevent="selectReport(record)">
                <label @click.stop><input type="checkbox" :checked="selectedReportIds.includes(record.id)" @change="toggleReportSelection(record)" /></label>
                <span class="report-thumb">
                  <img :src="record.image" :alt="record.name" />
                  <time>{{ record.duration }}</time>
                </span>
                <span class="report-file-cell">
                  <strong>{{ record.name }}</strong>
                  <small>{{ record.source }}</small>
                  <span class="report-tags"><em v-for="tag in reportDetectedTags(record)" :key="`${record.id}-${tag}`"><span class="bi" :class="targetTypeIconClass(tag)" aria-hidden="true"></span>{{ tag }}</em></span>
                </span>
                <span class="file-type-badge" :class="record.ext.toLowerCase()">{{ record.ext }}</span>
                <span class="report-tag-stack"><em v-for="tag in reportDetectedTags(record)" :key="`${record.id}-type-${tag}`"><span class="bi" :class="targetTypeIconClass(tag)" aria-hidden="true"></span>{{ tag }}</em></span>
                <span class="report-metric-strip">
                  <span v-for="type in reportDetectedTags(record)" :key="`${record.id}-${type}`" :class="type.toLowerCase()">
                    <i class="bi" :class="targetTypeIconClass(type)" aria-hidden="true"></i><small>{{ type }}</small><strong>{{ record.metrics[type] }}</strong>
                  </span>
                </span>
                <span class="report-date-cell"><strong>{{ record.date }}</strong><small>{{ record.time }}</small></span>
                <span class="report-size-cell">{{ record.size }}</span>
                <span class="report-action-buttons">
                  <button type="button" class="icon-button export-word" title="Export Word" aria-label="Export Word" @click.stop="exportReport(record, 'word')"><span class="bi bi-file-earmark-word"></span></button>
                  <button type="button" class="icon-button export-pdf" title="Export PDF" aria-label="Export PDF" @click.stop="exportReport(record, 'pdf')"><span class="bi bi-file-earmark-pdf"></span></button>
                  <button type="button" class="icon-button delete" title="ลบ" aria-label="ลบ" @click.stop="deleteReport(record)"><span class="bi bi-trash3"></span></button>
                </span>
              </div>

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
              <article ref="reportDetailPanel" class="panel report-detail-panel">
                <h2>ตัวอย่างและรายละเอียด</h2>
                <div class="report-detail-preview">
                  <img :src="selectedReport.image" :alt="selectedReport.name" />
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
                  <div><dt>โมเดล</dt><dd>{{ selectedReport.model || 'EXP-7' }}</dd></div>
                  <div><dt>ไฟล์โมเดล</dt><dd>{{ selectedReport.modelFile || 'exp-7.pt' }}</dd></div>
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
            <span>{{ selectedSnapshot.time }} · {{ selectedSnapshot.source.label }} · {{ snapshotMetaText(selectedSnapshot) }}</span>
          </div>
          <div class="snapshot-modal-image">
            <img :src="selectedSnapshot.image || selectedSnapshot.source.analysis?.previewImage || fallbackPreviewImage" :alt="`${selectedSnapshot.type} detection enlarged`" />
          </div>
        </div>
        </div>
      </template>
    </div>
</template>

<script>
const TARGET_TYPES = ["MV", "AMV", "LMV", "AFV", "CV", "MCV"];
const DEFAULT_TARGET_SELECTION = [...TARGET_TYPES];
const FALLBACK_PREVIEW_IMAGE = "/assets/surveillance-road.png";
const VIDEO_PLAYBACK_RATES = [1, 1.5, 2];
const DEFAULT_MODEL_ID = "exp-7";
const DEFAULT_MODEL_FILE_NAME = "exp-7.pt";
const LIVE_VIDEO_PREVIEW_FPS = 8;
const LIVE_VIDEO_SNAPSHOT_FRAME_INTERVAL = LIVE_VIDEO_PREVIEW_FPS * 4;

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
      sourceMode: "stream",
      streamUrl: "",
      sourceSlots: [
        { id: 1, url: "", file: null, fileName: "", fileUrl: "", fileType: "", analysis: null }
      ],
      nextSourceId: 2,
      selectedTargets: [...DEFAULT_TARGET_SELECTION],
      timelineFilterTargets: [...DEFAULT_TARGET_SELECTION],
      activeIntelTab: "logs",
      targetPanelCollapsed: false,
      selectedModel: DEFAULT_MODEL_ID,
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
      fallbackPreviewImage: FALLBACK_PREVIEW_IMAGE,
      inferenceServer: {
        status: "checking",
        message: "Checking backend",
        models: [],
        features: {
          videoSessions: false
        },
        inference: {
          conf: 0.25,
          iou: 0.7,
          imgsz: 1280
        }
      },
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
      videoElements: {},
      playbackStates: {},
      streamPreviewErrors: {},
      videoSessionPollers: {},
      videoSessionPollBusy: {},
      analysisLoopBusy: false,
      logIndex: 0,
      timer: null,
      clockTimer: null,
      metrics: {
        MV: 0,
        AMV: 0,
        LMV: 0,
        AFV: 0,
        CV: 0,
        MCV: 0
      },
      logs: [],
      targetClassOptions: [
        { id: "MV", color: "#6fe58e" },
        { id: "AMV", color: "#2ed36f" },
        { id: "LMV", color: "#2f84ff" },
        { id: "AFV", color: "#f3ad2f" },
        { id: "CV", color: "#8c4be8" },
        { id: "MCV", color: "#e5812e" }
      ],
      detectionModels: [
        {
          id: DEFAULT_MODEL_ID,
          name: "EXP-7",
          fileName: DEFAULT_MODEL_FILE_NAME,
          publicPath: `/models/${DEFAULT_MODEL_FILE_NAME}`,
          availability: "checking",
          sizeBytes: 0
        }
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
    };
  },
  computed: {
    totalCount() {
      return Object.values(this.metrics).reduce((sum, value) => sum + value, 0);
    },
    themeTitle() {
      return this.theme === "light" ? "เปลี่ยนเป็นโหมดมืด" : "เปลี่ยนเป็นโหมดสว่าง";
    },
    sourceModeOptions() {
      return [
        {
          id: "image",
          title: "รูปภาพ",
          icon: "bi-image"
        },
        {
          id: "video",
          title: "วิดีโอ",
          icon: "bi-film"
        },
        {
          id: "stream",
          title: "Live Stream",
          icon: "bi-broadcast-pin"
        }
      ];
    },
    fileAccept() {
      if (this.sourceMode === "image") return "image/*";
      if (this.sourceMode === "video") return "video/*";
      return "video/*,image/*";
    },
    streamPlaceholder() {
      return "วาง rtsp:// หรือ https:// ของสตรีม";
    },
    sourceListTitle() {
      if (this.sourceMode === "image") return "รูปภาพที่เลือก";
      if (this.sourceMode === "video") return "วิดีโอที่เลือก";
      return "รายการ Live Stream";
    },
    filePickerLabel() {
      if (this.sourceMode === "image") return "เลือกรูปภาพ";
      return "เลือกวิดีโอ";
    },
    primarySourceSlot() {
      return this.sourceSlots[0] || null;
    },
    singleUploadTitle() {
      if (this.primarySourceSlot?.fileName) return this.primarySourceSlot.fileName;
      return this.filePickerLabel;
    },
    singleUploadButtonLabel() {
      if (this.primarySourceSlot?.fileName) return "เปลี่ยนไฟล์";
      return "เลือกไฟล์";
    },
    sourceModeLabel() {
      if (this.sourceMode === "image") return "โหมดรูปภาพ";
      if (this.sourceMode === "video") return "โหมดวิดีโอ";
      return "โหมด Live Stream";
    },
    queuedSourceCount() {
      return this.sourceSlots.filter((slot) => this.slotHasSource(slot)).length;
    },
    maxSourceSlots() {
      return this.sourceMode === "stream" ? 4 : 1;
    },
    showAddSourceButton() {
      return this.sourceMode === "stream";
    },
    canAddMoreSources() {
      return this.showAddSourceButton && this.sourceSlots.length < this.maxSourceSlots;
    },
    queueCountLabel() {
      if (this.sourceMode === "image") {
        return this.queuedSourceCount ? `${this.queuedSourceCount} image selected` : "Choose up to 4 images";
      }
      if (this.sourceMode === "video") {
        return this.queuedSourceCount ? `${this.queuedSourceCount} video selected` : "Choose up to 4 videos";
      }
      return this.queuedSourceCount ? `${this.queuedSourceCount} source ready` : "Add up to 4 URLs";
    },
    sourceQueueTitle() {
      if (!this.queuedSourceCount) {
        if (this.sourceMode === "image") return "ยังไม่มีภาพในคิว";
        if (this.sourceMode === "video") return "ยังไม่มีวิดีโอในคิว";
        return "ยังไม่มี source ในคิว";
      }
      if (this.running) {
        return `กำลังตรวจจับ ${this.queuedSourceCount} source`;
      }
      return `${this.queuedSourceCount} source พร้อมรอ Detect`;
    },
    sourceStatus() {
      if (!this.queuedSourceCount) {
        if (this.sourceMode === "image") return "ยังไม่มีรูปภาพที่เลือก";
        if (this.sourceMode === "video") return "ยังไม่มีวิดีโอที่เลือก";
        return "ยังไม่มี URL หรือ stream";
      }
      if (this.running) {
        return `กำลังตรวจจับ ${this.queuedSourceCount} รายการ`;
      }
      if (this.sourceMode === "image") return `พร้อม Detect ${this.queuedSourceCount} รูป`;
      if (this.sourceMode === "video") return `พร้อม Detect ${this.queuedSourceCount} วิดีโอ`;
      return `พร้อม Detect ${this.queuedSourceCount} stream`;
    },
    sourceStatusClass() {
      if (this.running) return "is-processing";
      return this.queuedSourceCount ? "is-connected" : "is-disconnected";
    },
    activeSources() {
      return this.sourceSlots
        .filter((slot) => this.slotHasSource(slot))
        .filter((slot) => this.isSlotActive(slot))
        .map((slot, index) => ({
          id: slot.id,
          label: this.sourceMode === "stream" ? slot.url.trim() : slot.fileName,
          src: this.sourceMode === "stream" ? slot.url.trim() : slot.fileUrl,
          mediaKind: slot.analysis?.media?.sourceKind || this.inferSlotMediaKind(slot),
          cameraLabel: `CAM ${index + 1}`,
          analysis: slot.analysis || null,
          file: slot.file || null
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
      return this.monitoringSources.map((source) => {
        const metrics = source.analysis?.metrics
          ? { ...this.emptyMetrics(), ...source.analysis.metrics }
          : this.emptyMetrics();
        const total = source.analysis?.total ?? 0;

        return { source, metrics, total };
      });
    },
    sourceTimelineGroups() {
      return this.monitoringSources.map((source) => {
        const rawEvents = source.analysis?.timelineEvents?.length
          ? source.analysis.timelineEvents
          : [];
        const maxEventTime = rawEvents.reduce((maxTime, event) => Math.max(maxTime, Number(event?.timeSec || 0)), 0);
        const durationSec = source.analysis?.durationSec
          ?? source.analysis?.media?.durationSec
          ?? maxEventTime;
        const events = rawEvents
          .filter((event) => this.shouldShowTimelineEvent(event))
          .map((event, index) => this.decorateDetectionMoment(event, index));

        return {
          source,
          events,
          scale: this.buildTimelineScale(durationSec)
        };
      });
    },
    showTimelinePanel() {
      return this.activeSources.length > 0;
    },
    sourceSnapshots() {
      return this.monitoringSources.map((source) => {
        const rawSnapshots = source.analysis?.snapshots?.length
          ? source.analysis.snapshots
          : [];
        const snapshots = rawSnapshots
          .filter((snapshot) => this.shouldShowTimelineEvent(snapshot))
          .map((snapshot, index) => this.decorateDetectionMoment(snapshot, index));

        return { source, snapshots };
      });
    },
    sourceLogs() {
      return this.monitoringSources.map((source) => ({
        source,
        logs: this.buildSourceLogs(source)
      }));
    },
    selectedModelMeta() {
      return this.detectionModels.find((model) => model.id === this.selectedModel) || null;
    },
    selectedModelName() {
      return this.selectedModelMeta?.name || "Select model";
    },
    selectedModelStatusText() {
      if (this.selectedModelMeta?.availability === "ready") return "Model ready";
      if (this.selectedModelMeta?.availability === "missing") return "Model missing";
      return "Checking model";
    },
    selectedModelStatusClass() {
      return {
        "is-ready": this.selectedModelMeta?.availability === "ready",
        "is-missing": this.selectedModelMeta?.availability === "missing",
        "is-checking": this.selectedModelMeta?.availability === "checking"
      };
    },
    selectedModelSize() {
      if (!this.selectedModelMeta) return "Unknown size";
      if (!this.selectedModelMeta.sizeBytes) return this.selectedModelMeta.availability === "missing" ? "File not found" : "Size unavailable";
      return this.formatModelSize(this.selectedModelMeta.sizeBytes);
    },
    backendStatusText() {
      if (this.inferenceServer.status === "ready") return "Backend ready";
      if (this.inferenceServer.status === "offline") return "Backend offline";
      return "Checking backend";
    },
    backendStatusClass() {
      return {
        "is-ready": this.inferenceServer.status === "ready",
        "is-missing": this.inferenceServer.status === "offline",
        "is-checking": this.inferenceServer.status === "checking"
      };
    },
    modelHintText() {
      if (this.selectedModelMeta?.availability === "missing") {
        return `ยังไม่พบ /public/models/${DEFAULT_MODEL_FILE_NAME} ในโปรเจ็กต์`;
      }
      if (this.inferenceServer.status !== "ready") {
        return "เปิด backend ด้วย `npm run backend` ก่อน แล้วจึงกด Start Detection";
      }
      if (this.sourceMode === "image") {
        const { conf, iou, imgsz } = this.inferenceServer.inference || {};
        return `โหมด Upload Image จะส่งภาพเข้า ${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME} เพื่อรัน detection จริง (conf ${conf}, iou ${iou}, imgsz ${imgsz})`;
      }
      if (this.sourceMode === "video") {
        const { conf, iou, imgsz } = this.inferenceServer.inference || {};
        return `โหมด Upload Video จะส่งวิดีโอเข้า ${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME} เพื่อรัน detection จริง (conf ${conf}, iou ${iou}, imgsz ${imgsz})`;
      }
      const { conf, iou, imgsz } = this.inferenceServer.inference || {};
      return `โหมด URL / STREAM จะส่งลิงก์เข้า ${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME} เพื่อรัน detection จริงจากภาพหรือสตรีมที่เข้าถึงได้ (conf ${conf}, iou ${iou}, imgsz ${imgsz})`;
    },
    modelReady() {
      return this.selectedModelMeta?.availability === "ready";
    },
    backendReady() {
      return this.inferenceServer.status === "ready";
    },
    canRunDetection() {
      const videoBackendReady = this.sourceMode !== "video" || this.inferenceServer.features?.videoSessions;
      return Boolean(this.queuedSourceCount && this.selectedTargets.length && this.selectedModel && this.modelReady && this.backendReady && videoBackendReady);
    },
    runDisabledReason() {
      if (!this.queuedSourceCount) return "กรุณาเลือกข้อมูลก่อน";
      if (!this.selectedTargets.length) return "กรุณาเลือกเป้าหมาย";
      if (!this.selectedModel) return "Detection system is not ready";
      if (!this.modelReady) return `${DEFAULT_MODEL_FILE_NAME} is not ready`;
      if (!this.backendReady) return "Inference backend is not ready";
      if (this.sourceMode === "video" && !this.inferenceServer.features?.videoSessions) {
        return "Backend is outdated. Restart npm run backend to enable video detection";
      }
      return "พร้อมเริ่ม Detect";
    },
    addSourceLabel() {
      if (this.sourceMode === "image") return "เพิ่มรูป";
      if (this.sourceMode === "video") return "เพิ่มวิดีโอ";
      return "เพิ่มสตรีม";
    },
    targetTypes() {
      return TARGET_TYPES;
    },
    allTargetsSelected() {
      return this.targetClassOptions.every((target) => this.selectedTargets.includes(target.id));
    },
    allTimelineTargetsSelected() {
      return this.targetTypes.every((target) => this.timelineFilterTargets.includes(target));
    },
    showPreviewProcessingState() {
      return this.running && !this.activeSources.length;
    },
    showGlobalPlaybackBar() {
      const primarySource = this.monitoringSources[0];
      return !this.activeSources.length && this.isVideoSource(primarySource);
    },
    canSaveData() {
      return Boolean(this.activeSources.length && this.selectedTargets.length && this.selectedModel && this.running);
    },
    saveDisabledReason() {
      if (!this.activeSources.length) return "Input source required";
      if (!this.selectedTargets.length) return "Target selection required";
      if (!this.selectedModel) return "Detection system is not ready";
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
        const detectedTags = this.reportDetectedTags(record);
        const text = `${record.name} ${record.source} ${record.ext} ${record.kind} ${detectedTags.join(" ")}`.toLowerCase();
        const matchesQuery = !query || text.includes(query);
        const matchesFile = typeMode === "all" || record.kind === typeMode;
        const matchesTarget = this.reportFilters.targetType === "all" || detectedTags.includes(this.reportFilters.targetType);
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
      return this.sourceMetrics[0] || { metrics: this.emptyMetrics(), total: 0 };
    },
    liveStatusCards() {
      const metrics = this.liveStatusMetrics.metrics;
      const primaryAnalysis = this.monitoringSources[0]?.analysis || null;
      const detections = primaryAnalysis?.detections || [];
      const averageConfidence = detections.length
        ? Math.round((detections.reduce((sum, detection) => sum + Number(detection.confidence || 0), 0) / detections.length) * 100)
        : 0;
      const sourceFps = primaryAnalysis?.media?.fps ? Math.round(primaryAnalysis.media.fps) : "-";
      const latencyMs = primaryAnalysis?.elapsedMs ? Math.round(primaryAnalysis.elapsedMs) : "-";
      return [
        { id: "total-targets", label: "TOTAL TARGETS", value: this.liveStatusMetrics.total, note: this.activeSources.length ? "Real detections" : "Waiting for source", trendClass: "trend-up" },
        { id: "mv", label: "MV", value: metrics.MV, note: "Model result", trendClass: "trend-up" },
        { id: "amv", label: "AMV", value: metrics.AMV, note: "Model result", trendClass: "trend-up" },
        { id: "lmv", label: "LMV", value: metrics.LMV, note: "Model result", trendClass: "trend-warn" },
        { id: "afv", label: "AFV", value: metrics.AFV, note: "Model result", trendClass: "trend-down" },
        { id: "cv", label: "CV", value: metrics.CV, note: "Model result", trendClass: "trend-up" },
        { id: "mcv", label: "MCV", value: metrics.MCV, note: "Model result", trendClass: "trend-up" },
        { id: "fps", label: "FPS", value: sourceFps, note: primaryAnalysis?.media?.sourceKind === "video" ? "Source video" : "Detected source", trendClass: "trend-neutral" },
        { id: "latency", label: "LATENCY", value: latencyMs, unit: latencyMs === "-" ? "" : "ms", note: primaryAnalysis ? "Backend response" : "Awaiting run", trendClass: "trend-neutral" },
        { id: "confidence", label: "CONFIDENCE AVG", value: averageConfidence, unit: "%", note: primaryAnalysis ? "From preview detections" : "Awaiting run", trendClass: "trend-neutral" }
      ];
    },
    overviewStatusCards() {
      const preferredCardOrder = ["confidence", "fps", "latency", "mv", "amv", "lmv"];
      return preferredCardOrder
        .map((cardId) => this.liveStatusCards.find((card) => card.id === cardId))
        .filter(Boolean);
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
    this.resolveBundledModels();
    this.checkInferenceServer();
    this.loadReports();
    this.clockTimer = window.setInterval(this.updateClock, 1000);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    document.body.classList.toggle("theme-light", this.theme === "light");
    document.body.classList.toggle("report-view", this.currentView === "report");
    this.$nextTick(this.syncViewLayout);
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
    window.clearInterval(this.clockTimer);
    this.stopAllLiveVideoSessions();
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    Object.values(this.videoElements).forEach((element) => {
      try {
        element.pause();
      } catch (_error) {
      }
    });
    this.sourceSlots.forEach((slot) => {
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
    });
  },
  methods: {
    createSourceSlot(id) {
      return { id, url: "", file: null, fileName: "", fileUrl: "", fileType: "", analysis: null };
    },
    getInferenceApiBase() {
      const protocol = window.location.protocol?.startsWith("http") ? window.location.protocol : "http:";
      const host = window.location.hostname || "127.0.0.1";
      return `${protocol}//${host}:8000`;
    },
    emptyMetrics() {
      return {
        MV: 0,
        AMV: 0,
        LMV: 0,
        AFV: 0,
        CV: 0,
        MCV: 0
      };
    },
    formatModelSize(sizeBytes) {
      const sizeMb = sizeBytes / (1024 * 1024);
      if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(2)} GB`;
      return `${sizeMb.toFixed(2)} MB`;
    },
    slotHasSource(slot) {
      if (this.sourceMode === "stream") {
        return Boolean(slot?.url?.trim());
      }
      return Boolean(slot?.fileName && slot?.file);
    },
    isSlotActive(slot) {
      return Boolean(slot?.analysis) || (this.running && this.slotHasSource(slot));
    },
    sourceSlotState(slot) {
      if (slot?.analysis?.status === "processing") return "processing";
      if (slot?.analysis?.status === "error") return "error";
      if (slot?.analysis?.status === "ready") return "ready";
      if (this.slotHasSource(slot)) return "queued";
      return "empty";
    },
    sourceSlotStateLabel(slot) {
      return {
        empty: "ว่าง",
        queued: "พร้อม",
        processing: "กำลังตรวจ",
        ready: "เสร็จแล้ว",
        error: "ผิดพลาด"
      }[this.sourceSlotState(slot)] || "ว่าง";
    },
    sourceFileMetaText(slot) {
      const fileType = String(slot?.fileType || "");
      const kind = this.sourceMode === "image"
        ? "รูปภาพ"
        : (this.sourceMode === "video"
          ? "วิดีโอ"
          : (fileType.startsWith("video/") ? "วิดีโอ" : (fileType.startsWith("image/") ? "รูปภาพ" : "ไฟล์")));
      const size = slot?.file?.size ? this.formatFileSize(slot.file.size) : "";
      return [kind, size, "พร้อม Detect"].filter(Boolean).join(" • ");
    },
    mapRawClassToTarget(label) {
      const normalized = String(label || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      const mapping = {
        mv: "MV",
        militaryvehicle: "MV",
        militaryvehicles: "MV",
        vehicle: "MV",
        vehicles: "MV",
        venhicle: "MV",
        venhicles: "MV",
        amv: "AMV",
        armoredmilitaryvehicle: "AMV",
        lmv: "LMV",
        lightmilitaryvehicle: "LMV",
        afv: "AFV",
        armoredfightingvehicle: "AFV",
        cv: "CV",
        combatvehicle: "CV",
        mcv: "MCV",
        militarycargovehicle: "MCV"
      };
      return mapping[normalized] || String(label || "").toUpperCase();
    },
    appendFilteredDetectionHint(payload, sourceLabel) {
      const rawTotal = Number(payload?.rawTotal || 0);
      const filteredOutTotal = Number(payload?.filteredOutTotal || 0);
      if (!rawTotal || !filteredOutTotal || Number(payload?.total || 0) > 0) return;

      const detectedTargetSummary = Object.entries(payload?.classSummary || {})
        .map(([label, count]) => `${this.mapRawClassToTarget(label)}: ${count}`)
        .join(", ");

      this.appendLog(
        `${sourceLabel}: โมเดลตรวจจับได้ <strong>${rawTotal}</strong> รายการ แต่ target ที่เลือกไม่ตรง${detectedTargetSummary ? ` (${detectedTargetSummary})` : ""} จึงแสดงผลเป็น <strong>0</strong>`
      );
    },
    async resolveBundledModels() {
      const resolvedModels = await Promise.all(this.detectionModels.map(async (model) => {
        try {
          const response = await fetch(model.publicPath, { method: "HEAD", cache: "no-store" });
          if (!response.ok) throw new Error("model-not-found");
          const sizeBytes = Number(response.headers.get("content-length")) || model.sizeBytes || 0;
          return {
            ...model,
            availability: "ready",
            sizeBytes
          };
        } catch (_error) {
          return {
            ...model,
            availability: "missing",
            sizeBytes: 0
          };
        }
      }));

      this.detectionModels = resolvedModels;
      if (!resolvedModels.some((model) => model.id === this.selectedModel && model.availability === "ready")) {
        this.selectedModel = resolvedModels[0]?.id || DEFAULT_MODEL_ID;
      }
    },
    async checkInferenceServer() {
      this.inferenceServer = {
        ...this.inferenceServer,
        status: "checking",
        message: "Checking backend"
      };

      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/health`, {
          method: "GET",
          cache: "no-store"
        });
        if (!response.ok) throw new Error("health-check-failed");
        const payload = await response.json();
        this.inferenceServer = {
          status: payload.status === "ready" ? "ready" : "offline",
          message: payload.status === "ready" ? "Backend ready" : "Model missing on backend",
          models: payload.models || [],
          features: {
            videoSessions: Boolean(payload.features?.videoSessions)
          },
          inference: payload.inference || {
            conf: 0.25,
            iou: 0.7,
            imgsz: 1280
          }
        };
      } catch (_error) {
        this.inferenceServer = {
          status: "offline",
          message: "Backend offline",
          models: [],
          features: {
            videoSessions: false
          },
          inference: {
            conf: 0.25,
            iou: 0.7,
            imgsz: 1280
          }
        };
      }
    },
    appendLog(message) {
      this.logs.unshift({
        id: Date.now() + this.logIndex + this.logs.length,
        time: new Date().toLocaleTimeString("th-TH-u-nu-latn", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }),
        message
      });
      this.logIndex += 1;
    },
    getAllTargetIds() {
      return this.targetClassOptions.map((target) => target.id);
    },
    formatDuration(seconds) {
      if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) return "00:00:00";
      const totalSeconds = Math.max(0, Math.round(Number(seconds)));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      return [hours, minutes, secs].map((value) => String(value).padStart(2, "0")).join(":");
    },
    formatConfidence(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) return "Conf -";
      return `Conf ${(numericValue * 100).toFixed(1)}%`;
    },
    formatFileSize(sizeBytes) {
      const numericValue = Number(sizeBytes);
      if (!Number.isFinite(numericValue) || numericValue <= 0) return "-";
      const sizeMb = numericValue / (1024 * 1024);
      if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(2)} GB`;
      return `${sizeMb.toFixed(2)} MB`;
    },
    buildTimelineScale(durationSec) {
      const safeDuration = Number(durationSec);
      if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
        return ["00:00:00"];
      }
      return Array.from({ length: 6 }, (_, index) => this.formatDuration((safeDuration * index) / 5));
    },
    timelineEventTargets(event) {
      if (Array.isArray(event?.targets) && event.targets.length) return event.targets;
      if (event?.type) return [event.type];
      return [];
    },
    shouldShowTimelineEvent(event) {
      const eventTargets = this.timelineEventTargets(event);
      if (!eventTargets.length) return false;
      return eventTargets.some((target) => this.timelineFilterTargets.includes(target));
    },
    decorateDetectionMoment(moment, index = 0) {
      const type = moment?.type || this.timelineEventTargets(moment)[0] || "MV";
      return {
        ...moment,
        type,
        typeClass: String(type).toLowerCase(),
        time: moment?.time || this.formatDuration(moment?.timeSec || 0),
        summaryText: moment?.summaryText || this.metricsToSummaryText(moment?.metrics || {}),
        confidence: Number(moment?.confidence || 0),
        image: moment?.image || null,
        boxClass: moment?.boxClass || `popup-box-${(index % 4) + 1}`
      };
    },
    buildSourceLogs(source) {
      const analysisEvents = source.analysis?.timelineEvents || source.analysis?.snapshots || [];
      const sourceLogs = this.visibleLogs.filter((row) => row.message.includes(`${source.cameraLabel}:`));
      const generalLogs = this.monitoringSources.length === 1
        ? this.visibleLogs.filter((row) => !row.message.includes("CAM "))
        : [];
      if (source.analysis?.status === "processing") {
        return [
          {
            id: `${source.id}-processing`,
            time: "--:--:--",
            message: "กำลังวิเคราะห์ข้อมูลจาก backend"
          }
        ];
      }
      if (source.analysis?.status === "error") {
        return [
          {
            id: `${source.id}-error`,
            time: "--:--:--",
            message: source.analysis?.error || "ตรวจจับไม่สำเร็จ"
          }
        ];
      }
      if (source.analysis && !analysisEvents.length) {
        return [
          {
            id: `${source.id}-no-detection`,
            time: source.analysis?.media?.durationLabel || "00:00:00",
            message: "ไม่พบการตรวจจับในช่วงเวลาที่วิเคราะห์"
          }
        ];
      }
      if (!analysisEvents.length && sourceLogs.length) return sourceLogs.slice(0, 5);
      if (!analysisEvents.length && generalLogs.length) return generalLogs.slice(0, 5);
      if (!analysisEvents.length) {
        return [
          {
            id: `${source.id}-idle`,
            time: "--:--:--",
            message: this.running ? "รอผลตรวจจับล่าสุดจาก backend" : "ยังไม่มีผลตรวจจับสำหรับแหล่งข้อมูลนี้"
          }
        ];
      }

      return analysisEvents
        .slice(-5)
        .reverse()
        .map((event, index) => {
          const detection = this.decorateDetectionMoment(event, index);
          return {
            id: `${source.id}-${detection.time}-${detection.type}-${index}`,
            time: detection.time,
            message: `ตรวจพบ <strong>${detection.type}</strong>${detection.summaryText ? ` (${detection.summaryText})` : ""}${detection.confidence ? ` <strong>(${this.formatConfidence(detection.confidence)})</strong>` : ""}`
          };
        });
    },
    snapshotMetaText(snapshot) {
      const details = [];
      if (snapshot?.summaryText) details.push(snapshot.summaryText);
      if (snapshot?.confidence) details.push(this.formatConfidence(snapshot.confidence));
      return details.join(" • ") || "รายละเอียดการตรวจจับ";
    },
    snapshotDisplayTime(snapshot, source) {
      if (source?.analysis?.media?.sourceKind === "image") return "ภาพนิ่ง";
      return snapshot?.time || "00:00:00";
    },
    setVideoElement(sourceId, element) {
      if (element) {
        this.videoElements = {
          ...this.videoElements,
          [sourceId]: element
        };
        return;
      }

      if (!(sourceId in this.videoElements)) return;
      const { [sourceId]: _removed, ...rest } = this.videoElements;
      this.videoElements = rest;
    },
    updatePlaybackState(sourceId, patch) {
      const currentState = this.playbackStates[sourceId] || {
        currentTime: 0,
        duration: 0,
        playing: false,
        rate: 1
      };
      this.playbackStates = {
        ...this.playbackStates,
        [sourceId]: {
          ...currentState,
          ...patch
        }
      };
    },
    sourceCurrentTime(source) {
      return Number(this.playbackStates[source?.id]?.currentTime ?? source?.analysis?.playback?.currentTime ?? 0);
    },
    sourceDurationSeconds(source) {
      const playbackDuration = Number(this.playbackStates[source?.id]?.duration || 0);
      if (playbackDuration > 0) return playbackDuration;
      return Number(source?.analysis?.media?.durationSec || 0);
    },
    sourceDurationLabel(source) {
      if (source?.analysis?.media?.sourceKind === "image") return "ภาพนิ่ง";
      const durationSec = this.sourceDurationSeconds(source);
      return durationSec > 0
        ? this.formatDuration(durationSec)
        : (source?.analysis?.media?.durationLabel || "00:00:00");
    },
    sourceProgressPercent(source) {
      const durationSec = this.sourceDurationSeconds(source);
      if (!durationSec) return 0;
      return Math.min(100, Math.max(0, (this.sourceCurrentTime(source) / durationSec) * 100));
    },
    sourcePlaybackRateLabel(sourceId, source = null) {
      const playbackRate = Number(this.playbackStates[sourceId]?.rate ?? source?.analysis?.playback?.rate ?? 1);
      return `${playbackRate.toFixed(1)}x`;
    },
    isBackendVideoSource(source) {
      return Boolean(source?.analysis?.sessionId);
    },
    async sendLiveVideoControl(source, action, value = null) {
      if (!this.isBackendVideoSource(source)) return;
      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/video-sessions/${source.analysis.sessionId}/controls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, value })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Video control unavailable");
        const slot = this.sourceSlots.find((item) => item.id === source.id);
        if (slot?.analysis) slot.analysis = { ...slot.analysis, ...payload };
        this.updatePlaybackState(source.id, {
          currentTime: Number(payload.playback?.currentTime || 0),
          rate: Number(payload.playback?.rate || 1),
          playing: !payload.playback?.paused
        });
      } catch (error) {
        this.appendLog(`${source.cameraLabel}: ไม่สามารถควบคุมวิดีโอได้ (${error.message || "backend unavailable"})`);
      }
    },
    playSource(source) {
      return this.isBackendVideoSource(source) ? this.sendLiveVideoControl(source, "play") : this.playVideoSource(source.id);
    },
    pauseSource(source) {
      return this.isBackendVideoSource(source) ? this.sendLiveVideoControl(source, "pause") : this.pauseVideoSource(source.id);
    },
    stopSource(source) {
      return this.isBackendVideoSource(source) ? this.sendLiveVideoControl(source, "stop") : this.stopVideoSource(source.id);
    },
    restartSource(source) {
      return this.isBackendVideoSource(source) ? this.sendLiveVideoControl(source, "restart") : this.restartVideoSource(source.id);
    },
    seekSource(source, deltaSeconds) {
      if (!this.isBackendVideoSource(source)) return this.seekVideoSource(source.id, deltaSeconds);
      return this.sendLiveVideoControl(source, "seek", this.sourceCurrentTime(source) + deltaSeconds);
    },
    cycleSourceSpeed(source) {
      if (!this.isBackendVideoSource(source)) return this.cycleVideoSpeed(source.id);
      const currentRate = Number(source.analysis?.playback?.rate || 1);
      const currentIndex = VIDEO_PLAYBACK_RATES.findIndex((rate) => Math.abs(rate - currentRate) < 0.01);
      return this.sendLiveVideoControl(source, "rate", VIDEO_PLAYBACK_RATES[(currentIndex + 1) % VIDEO_PLAYBACK_RATES.length]);
    },
    handleVideoLoadedMetadata(source, event) {
      const videoElement = event.target;
      const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : this.sourceDurationSeconds(source);
      this.updatePlaybackState(source.id, {
        duration,
        rate: videoElement.playbackRate || 1
      });
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      if (source.analysis?.status === "processing") {
        videoElement.pause();
        this.setVideoPlayingState(source.id, false);
        return;
      }
      this.playVideoSource(source.id);
    },
    handleVideoTimeUpdate(source, event) {
      const videoElement = event.target;
      this.updatePlaybackState(source.id, {
        currentTime: Number(videoElement.currentTime || 0),
        duration: Number.isFinite(videoElement.duration) ? videoElement.duration : this.sourceDurationSeconds(source)
      });
    },
    setVideoPlayingState(sourceId, playing) {
      this.updatePlaybackState(sourceId, { playing });
    },
    playVideoSource(sourceId) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;

      const playPromise = videoElement.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          this.setVideoPlayingState(sourceId, false);
        });
      }
    },
    pauseVideoSource(sourceId) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;
      videoElement.pause();
      this.setVideoPlayingState(sourceId, false);
    },
    stopVideoSource(sourceId) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;
      videoElement.pause();
      videoElement.currentTime = 0;
      this.updatePlaybackState(sourceId, {
        currentTime: 0,
        playing: false
      });
    },
    restartVideoSource(sourceId) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;
      videoElement.currentTime = 0;
      this.updatePlaybackState(sourceId, { currentTime: 0 });
      this.playVideoSource(sourceId);
    },
    seekVideoSource(sourceId, deltaSeconds) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;
      const duration = Number.isFinite(videoElement.duration) ? videoElement.duration : 0;
      const nextTime = Math.max(0, Math.min(duration || Infinity, Number(videoElement.currentTime || 0) + deltaSeconds));
      videoElement.currentTime = nextTime;
      this.updatePlaybackState(sourceId, { currentTime: nextTime });
    },
    cycleVideoSpeed(sourceId) {
      const videoElement = this.videoElements[sourceId];
      if (!videoElement) return;
      const currentRate = Number(videoElement.playbackRate || this.playbackStates[sourceId]?.rate || 1);
      const currentIndex = VIDEO_PLAYBACK_RATES.findIndex((rate) => Math.abs(rate - currentRate) < 0.01);
      const nextRate = VIDEO_PLAYBACK_RATES[(currentIndex + 1) % VIDEO_PLAYBACK_RATES.length];
      videoElement.playbackRate = nextRate;
      this.updatePlaybackState(sourceId, { rate: nextRate });
    },
    captureVideoFrame(source) {
      const videoElement = this.videoElements[source?.id];
      if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = canvas.toDataURL("image/png");
      link.download = `detection-${source.cameraLabel.toLowerCase().replace(/\s+/g, "-")}-${timestamp}.png`;
      link.click();
    },
    sourceTimelineEvents(source) {
      const rawEvents = source?.analysis?.timelineEvents || [];
      return rawEvents
        .filter((event) => this.shouldShowTimelineEvent(event))
        .sort((left, right) => Number(left.timeSec || 0) - Number(right.timeSec || 0));
    },
    currentSourceEvent(source) {
      if (!source?.analysis) return null;

      if (!this.isSourcePlayable(source)) {
        const fallbackEvents = source?.analysis?.timelineEvents?.length
          ? source.analysis.timelineEvents
          : (source?.analysis?.snapshots || []);
        if (!fallbackEvents.length) return null;
        return this.decorateDetectionMoment(fallbackEvents[fallbackEvents.length - 1], fallbackEvents.length - 1);
      }

      const events = this.sourceTimelineEvents(source);
      if (!events.length) return null;

      const currentTime = this.sourceCurrentTime(source);
      const timelineInterval = Number(source?.analysis?.media?.timelineIntervalSec || 1);
      const tolerance = Math.max(timelineInterval / 2, 0.35);
      let activeEvent = null;

      events.forEach((event, index) => {
        if (Number(event.timeSec || 0) <= currentTime + tolerance) {
          activeEvent = this.decorateDetectionMoment(event, index);
        }
      });

      if (!activeEvent && Math.abs(Number(events[0].timeSec || 0) - currentTime) <= tolerance) {
        return this.decorateDetectionMoment(events[0], 0);
      }

      return activeEvent;
    },
    currentSourceDetections(source) {
      if (!this.isSourcePlayable(source)) {
        return (source?.analysis?.detections || []).slice(0, 12);
      }
      return (this.currentSourceEvent(source)?.detections || []).slice(0, 12);
    },
    snapshotDetections(snapshot, source) {
      const detections = Array.isArray(snapshot?.detections) && snapshot.detections.length
        ? snapshot.detections
        : (source?.analysis?.detections || []);
      return detections.slice(0, 12);
    },
    sourceDetectionNote(source) {
      const activeEvent = this.currentSourceEvent(source);
      if (!activeEvent) {
        const media = source.analysis?.media || {};
        if (media.sourceKind === "image") {
          return `${source.analysis?.total || 0} detections on image`;
        }
        return `${source.analysis?.total || 0} detections`;
      }
      return `${activeEvent.time} · ${activeEvent.summaryText || `${activeEvent.total} detections`}`;
    },
    detectionBoxStyle(detection, source) {
      const sourceWidth = Number(source?.analysis?.media?.width || 0);
      const sourceHeight = Number(source?.analysis?.media?.height || 0);
      const [x1, y1, x2, y2] = detection.box || [];

      if (!sourceWidth || !sourceHeight || [x1, y1, x2, y2].some((value) => !Number.isFinite(Number(value)))) {
        return {};
      }

      return {
        left: `${(Number(x1) / sourceWidth) * 100}%`,
        top: `${(Number(y1) / sourceHeight) * 100}%`,
        width: `${((Number(x2) - Number(x1)) / sourceWidth) * 100}%`,
        height: `${((Number(y2) - Number(y1)) / sourceHeight) * 100}%`
      };
    },
    isVideoSource(source) {
      return source?.mediaKind === "video";
    },
    isProcessedVideoSource(source) {
      return this.sourceMode === "video" && Boolean(source?.analysis?.liveStreamUrl);
    },
    isSourcePlayable(source) {
      return this.sourceMode === "video"
        && this.isVideoSource(source)
        && !this.isProcessedVideoSource(source)
        && source?.analysis?.status !== "stopped";
    },
    isLiveStreamSource(source) {
      return this.sourceMode === "stream"
        && Boolean(source?.src)
        && !this.streamPreviewErrors[source.id];
    },
    streamPreviewUrl(source) {
      const params = new URLSearchParams({
        sourceUrl: source.src,
        modelId: this.selectedModelMeta?.id || DEFAULT_MODEL_ID,
        modelFileName: this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME
      });
      return `${this.getInferenceApiBase()}/api/stream?${params.toString()}`;
    },
    clearStreamPreviewError(sourceId) {
      if (!(sourceId in this.streamPreviewErrors)) return;
      const { [sourceId]: _cleared, ...remainingErrors } = this.streamPreviewErrors;
      this.streamPreviewErrors = remainingErrors;
    },
    markStreamPreviewUnavailable(source) {
      if (this.streamPreviewErrors[source.id]) return;
      this.streamPreviewErrors = {
        ...this.streamPreviewErrors,
        [source.id]: true
      };
      this.appendLog(`${source.cameraLabel}: ไม่สามารถเปิดภาพสดจาก stream ได้`);
    },
    isSourceProcessing(source) {
      return source?.analysis?.status === "processing";
    },
    inferUrlSourceKind(url) {
      const normalizedUrl = String(url || "").trim().toLowerCase();
      if (!normalizedUrl) return "";
      if (/\.(jpg|jpeg|png|bmp|webp)(?:$|\?)/i.test(normalizedUrl)) return "image";
      if (/\.(mp4|mov|avi|mkv|m4v|webm)(?:$|\?)/i.test(normalizedUrl)) return "video";
      if (normalizedUrl.startsWith("rtsp://") || normalizedUrl.startsWith("rtmp://")) return "stream";
      if (normalizedUrl.includes(".m3u8")) return "stream";
      return "stream";
    },
    inferSlotMediaKind(slot) {
      if (this.sourceMode === "stream") return this.inferUrlSourceKind(slot?.url);
      if (this.sourceMode === "image") return "image";
      if (this.sourceMode === "video") return "video";
      const fileType = String(slot?.fileType || "").toLowerCase();
      if (fileType.startsWith("video/")) return "video";
      if (fileType.startsWith("image/")) return "image";
      return "";
    },
    sourcePreviewImage(source) {
      if (source?.analysis?.previewImage) return source.analysis.previewImage;
      if (this.sourceMode !== "stream") return source?.src || this.fallbackPreviewImage;
      return source?.mediaKind === "image" ? (source?.src || this.fallbackPreviewImage) : this.fallbackPreviewImage;
    },
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
      if (view === "report") this.loadReports();
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
    setSourceMode(mode) {
      const nextInputMode = mode === "stream" ? "url" : "file";
      window.clearInterval(this.timer);
      this.running = false;
      this.analysisLoopBusy = false;
      this.sourceMode = mode;
      this.inputMode = nextInputMode;
      this.resetSourceSlots();
      this.metrics = this.emptyMetrics();
      this.logs = [];
      this.checkInferenceServer();
    },
    setInputMode(mode) {
      if (mode === "url") {
        this.setSourceMode("stream");
        return;
      }
      this.setSourceMode(this.sourceMode === "image" ? "image" : "video");
    },
    addSourceSlot() {
      if (this.sourceSlots.length >= this.maxSourceSlots) return;
      this.sourceSlots.push(this.createSourceSlot(this.nextSourceId));
      this.nextSourceId += 1;
    },
    isSourceRemoveDisabled(slot) {
      return this.sourceSlots.length === 1 && !this.slotHasSource(slot) && !slot?.analysis;
    },
    releaseSourceSlotResources(slot) {
      this.stopLiveVideoSession(slot.id);
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      if (this.videoElements[slot.id]) {
        try {
          this.videoElements[slot.id].pause();
        } catch (_error) {
        }
      }
      const { [slot.id]: _videoRemoved, ...remainingVideos } = this.videoElements;
      this.videoElements = remainingVideos;
      const { [slot.id]: _playbackRemoved, ...remainingPlayback } = this.playbackStates;
      this.playbackStates = remainingPlayback;
    },
    clearSourceSlot(slot) {
      this.releaseSourceSlotResources(slot);
      slot.url = "";
      slot.file = null;
      slot.fileName = "";
      slot.fileUrl = "";
      slot.fileType = "";
      slot.analysis = null;
      this.recalculateMetricsFromAnalysis();
    },
    removeSourceSlot(slot) {
      if (this.sourceSlots.length === 1) {
        this.clearSourceSlot(slot);
        return;
      }
      this.releaseSourceSlotResources(slot);
      this.sourceSlots = this.sourceSlots.filter((item) => item.id !== slot.id);
      if (!this.sourceSlots.length) {
        this.addSourceSlot();
      }
      this.recalculateMetricsFromAnalysis();
    },
    resetSourceSlots() {
      this.stopAllLiveVideoSessions();
      this.sourceSlots.forEach((slot) => {
        if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      });
      Object.values(this.videoElements).forEach((element) => {
        try {
          element.pause();
        } catch (_error) {
        }
      });
      this.videoElements = {};
      this.playbackStates = {};
      this.sourceSlots = [this.createSourceSlot(1)];
      this.nextSourceId = 2;
      this.streamUrl = "";
      this.selectedFileName = "";
      this.recalculateMetricsFromAnalysis();
    },
    handleFileSelect(event, slot) {
      const [file] = event.target.files;
      if (slot.fileUrl) URL.revokeObjectURL(slot.fileUrl);
      slot.file = file || null;
      slot.fileName = file ? file.name : "";
      slot.fileUrl = file ? URL.createObjectURL(file) : "";
      slot.fileType = file ? file.type : "";
      slot.analysis = null;
      this.recalculateMetricsFromAnalysis();
    },
    metricsToSummaryText(metrics) {
      return Object.entries(metrics)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    },
    recalculateMetricsFromAnalysis() {
      const aggregate = this.emptyMetrics();

      this.sourceSlots.forEach((slot) => {
        const metrics = slot.analysis?.metrics;
        if (!metrics) return;
        Object.keys(aggregate).forEach((key) => {
          aggregate[key] += Number(metrics[key] || 0);
        });
      });

      this.metrics = aggregate;
    },
    async analyzeFileSource(slot) {
      if (!slot.file) return;

      if (this.sourceMode === "video") {
        await this.startLiveVideoSession(slot);
        return;
      }

      slot.analysis = {
        status: "processing",
        previewImage: slot.fileUrl,
        metrics: this.emptyMetrics(),
        total: 0
      };

      const formData = new FormData();
      formData.append("source", slot.file, slot.file.name);
      formData.append("sourceKind", this.sourceMode === "video" ? "video" : "image");
      formData.append("selectedTargets", this.selectedTargets.join(","));
      formData.append("modelId", this.selectedModelMeta?.id || DEFAULT_MODEL_ID);
      formData.append("modelFileName", this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME);

      let payload;
      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/detect`, {
          method: "POST",
          body: formData
        });
        payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Detection request failed");
        }
      } catch (error) {
        slot.analysis = {
          ...(slot.analysis || {}),
          status: "error",
          error: error.message || "ไม่สามารถอ่านไฟล์วิดีโอได้"
        };
        this.recalculateMetricsFromAnalysis();
        throw error;
      }

      slot.analysis = {
        ...payload,
        status: "ready",
        elapsedMs: Number(payload.elapsedMs || 0),
        previewImage: payload.previewImage || slot.fileUrl
      };

      this.recalculateMetricsFromAnalysis();
      const summaryText = this.metricsToSummaryText(payload.metrics);
      const sourceLabel = this.monitoringSources.find((source) => source.id === slot.id)?.cameraLabel || "CAM";
      const timelineCount = Array.isArray(payload.timelineEvents) ? payload.timelineEvents.length : 0;
      const snapshotCount = Array.isArray(payload.snapshots) ? payload.snapshots.length : 0;
      this.appendLog(
        `${sourceLabel}: ใช้โมเดล <strong>${payload.model?.fileName || DEFAULT_MODEL_FILE_NAME}</strong> ตรวจจับได้ <strong>${payload.total}</strong> เป้าหมาย${summaryText ? ` (${summaryText})` : ""}${timelineCount ? ` · timeline ${timelineCount} จุด` : ""}${snapshotCount ? ` · snapshots ${snapshotCount}` : ""}`
      );
      this.appendFilteredDetectionHint(payload, sourceLabel);
    },
    async startLiveVideoSession(slot) {
      await this.stopLiveVideoSession(slot.id);
      slot.analysis = {
        status: "processing",
        previewImage: slot.fileUrl,
        metrics: this.emptyMetrics(),
        total: 0
      };

      const formData = new FormData();
      formData.append("source", slot.file, slot.file.name);
      formData.append("selectedTargets", this.selectedTargets.join(","));
      formData.append("modelId", this.selectedModelMeta?.id || DEFAULT_MODEL_ID);
      formData.append("modelFileName", this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME);

      let payload;
      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/video-sessions`, {
          method: "POST",
          body: formData
        });
        payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Backend เวอร์ชันเก่า: กรุณาหยุดแล้วรัน npm run backend ใหม่ เพื่อเปิดใช้ Live Video Detection");
          }
          throw new Error(payload.error || "Unable to start live video detection");
        }
      } catch (error) {
        slot.analysis = {
          ...(slot.analysis || {}),
          status: "error",
          error: error.message || "ไม่สามารถเริ่มเล่นวิดีโอพร้อมตรวจจับได้"
        };
        this.recalculateMetricsFromAnalysis();
        throw error;
      }

      slot.analysis = {
        ...payload,
        status: "ready",
        liveStreamUrl: `${this.getInferenceApiBase()}${payload.streamPath}`,
        previewImage: slot.fileUrl
      };
      this.recalculateMetricsFromAnalysis();
      this.startLiveVideoSessionPolling(slot.id, payload.sessionId);
      const sourceLabel = this.monitoringSources.find((source) => source.id === slot.id)?.cameraLabel || "CAM";
      this.appendLog(`${sourceLabel}: เริ่มแสดงผลวิดีโอพร้อมผลตรวจจับแบบต่อเนื่อง`);
    },
    startLiveVideoSessionPolling(slotId, sessionId) {
      this.stopLiveVideoSessionPolling(slotId);
      const poller = window.setInterval(async () => {
        const slot = this.sourceSlots.find((item) => item.id === slotId);
        if (!this.running || !slot?.analysis?.sessionId) {
          this.stopLiveVideoSessionPolling(slotId);
          return;
        }
        if (this.videoSessionPollBusy[slotId]) return;
        this.videoSessionPollBusy = { ...this.videoSessionPollBusy, [slotId]: true };
        try {
          const response = await fetch(`${this.getInferenceApiBase()}/api/video-sessions/${sessionId}`, { cache: "no-store" });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || "Video session disconnected");
          const liveEventFallback = this.createLiveVideoEventFallback(slot, payload);
          slot.analysis = {
            ...slot.analysis,
            ...payload,
            ...liveEventFallback,
            status: payload.status === "error" ? "error" : "ready"
          };
          if (payload.playback) {
            this.updatePlaybackState(slotId, {
              currentTime: Number(payload.playback.currentTime || 0),
              rate: Number(payload.playback.rate || 1),
              playing: !payload.playback.paused
            });
          }
          this.recalculateMetricsFromAnalysis();
        } catch (error) {
          slot.analysis = {
            ...slot.analysis,
            status: "error",
            error: error.message || "Video session disconnected"
          };
          this.stopLiveVideoSessionPolling(slotId);
        } finally {
          if (slotId in this.videoSessionPollBusy) {
            const { [slotId]: _finished, ...remainingBusyPolls } = this.videoSessionPollBusy;
            this.videoSessionPollBusy = remainingBusyPolls;
          }
        }
      }, 250);
      this.videoSessionPollers = { ...this.videoSessionPollers, [slotId]: poller };
    },
    createLiveVideoEventFallback(slot, payload) {
      // New backends provide event arrays directly.  This fallback keeps the
      // Log, Timeline, and Snapshot panels useful while a session is streaming
      // against a backend that only returns live metrics and detections.
      if (Array.isArray(payload.timelineEvents) && payload.timelineEvents.length) return {};
      if (!Number(payload.total)) return {};

      const previous = slot.analysis || {};
      const frame = Number(payload.framesProcessed || 0);
      if (!frame || frame === Number(previous.lastLiveEventFrame || 0)) return {};

      const durationSec = Number(payload.media?.durationSec || previous.media?.durationSec || 0);
      const elapsedSec = frame / LIVE_VIDEO_PREVIEW_FPS;
      const timeSec = durationSec > 0 ? elapsedSec % durationSec : elapsedSec;
      const detections = Array.isArray(payload.detections) ? payload.detections : [];
      const primaryDetection = detections[0] || {};
      const primaryTarget = primaryDetection.targetKey
        || Object.entries(payload.metrics || {}).find(([, count]) => Number(count) > 0)?.[0]
        || "MV";
      const event = {
        time: this.formatDuration(timeSec),
        timeSec: Number(timeSec.toFixed(2)),
        left: durationSec > 0 ? Number(((timeSec / durationSec) * 100).toFixed(2)) : 0,
        type: primaryTarget,
        targets: detections.length
          ? [...new Set(detections.map((detection) => detection.targetKey).filter(Boolean))]
          : [primaryTarget],
        confidence: Number(primaryDetection.confidence || 0),
        summaryText: this.metricsToSummaryText(payload.metrics || {}),
        total: Number(payload.total || 0),
        metrics: payload.metrics || this.emptyMetrics(),
        detections: detections.slice(0, 12),
        image: payload.previewImage || previous.previewImage || this.fallbackPreviewImage
      };
      const timelineEvents = [...(previous.timelineEvents || []), event].slice(-120);
      const lastSnapshotFrame = previous.lastLiveSnapshotFrame == null
        ? -LIVE_VIDEO_SNAPSHOT_FRAME_INTERVAL
        : Number(previous.lastLiveSnapshotFrame);
      const shouldAddSnapshot = frame - lastSnapshotFrame >= LIVE_VIDEO_SNAPSHOT_FRAME_INTERVAL;
      const snapshots = shouldAddSnapshot
        ? [...(previous.snapshots || []), event].slice(-12)
        : (previous.snapshots || []);

      return {
        timelineEvents,
        snapshots,
        lastLiveEventFrame: frame,
        ...(shouldAddSnapshot ? { lastLiveSnapshotFrame: frame } : {})
      };
    },
    stopLiveVideoSessionPolling(slotId) {
      const poller = this.videoSessionPollers[slotId];
      if (poller) window.clearInterval(poller);
      if (!(slotId in this.videoSessionPollers)) return;
      const { [slotId]: _stopped, ...remainingPollers } = this.videoSessionPollers;
      this.videoSessionPollers = remainingPollers;
      if (slotId in this.videoSessionPollBusy) {
        const { [slotId]: _stoppedBusy, ...remainingBusyPolls } = this.videoSessionPollBusy;
        this.videoSessionPollBusy = remainingBusyPolls;
      }
    },
    async stopLiveVideoSession(slotId) {
      const slot = this.sourceSlots.find((item) => item.id === slotId);
      const sessionId = slot?.analysis?.sessionId;
      this.stopLiveVideoSessionPolling(slotId);
      if (sessionId) {
        try {
          await fetch(`${this.getInferenceApiBase()}/api/video-sessions/${sessionId}`, { method: "DELETE" });
        } catch (_error) {
          // The local preview must still stop even if the backend was already disconnected.
        }
      }
      if (slot?.analysis) {
        slot.analysis = {
          ...slot.analysis,
          status: "stopped",
          sessionId: "",
          streamPath: "",
          liveStreamUrl: ""
        };
        this.recalculateMetricsFromAnalysis();
      }
    },
    async stopAllLiveVideoSessions() {
      await Promise.all(this.sourceSlots.map((slot) => this.stopLiveVideoSession(slot.id)));
    },
    async analyzeUrlSource(slot) {
      const sourceUrl = slot.url.trim();
      if (!sourceUrl) return;

      slot.analysis = {
        ...(slot.analysis || {}),
        status: "processing",
        error: "",
        previewImage: slot.analysis?.previewImage || (this.inferUrlSourceKind(sourceUrl) === "image" ? sourceUrl : this.fallbackPreviewImage),
        metrics: this.emptyMetrics(),
        total: 0
      };
      this.recalculateMetricsFromAnalysis();

      const formData = new FormData();
      formData.append("sourceUrl", sourceUrl);
      formData.append("sourceKind", this.inferUrlSourceKind(sourceUrl) || "stream");
      formData.append("selectedTargets", this.selectedTargets.join(","));
      formData.append("modelId", this.selectedModelMeta?.id || DEFAULT_MODEL_ID);
      formData.append("modelFileName", this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME);

      const response = await fetch(`${this.getInferenceApiBase()}/api/detect`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        slot.analysis = {
          ...(slot.analysis || {}),
          status: "error",
          error: payload.error || "Detection request failed"
        };
        this.recalculateMetricsFromAnalysis();
        throw new Error(payload.error || "Detection request failed");
      }

      slot.analysis = {
        ...payload,
        status: "ready",
        elapsedMs: Number(payload.elapsedMs || 0),
        previewImage: payload.previewImage || slot.analysis?.previewImage || this.fallbackPreviewImage
      };

      this.recalculateMetricsFromAnalysis();
      const summaryText = this.metricsToSummaryText(payload.metrics);
      const sourceLabel = this.monitoringSources.find((source) => source.id === slot.id)?.cameraLabel || "CAM";
      const timelineCount = Array.isArray(payload.timelineEvents) ? payload.timelineEvents.length : 0;
      const snapshotCount = Array.isArray(payload.snapshots) ? payload.snapshots.length : 0;
      const elapsedText = payload.elapsedMs ? ` · ${Math.round(payload.elapsedMs)} ms` : "";
      this.appendLog(
        `${sourceLabel}: ใช้โมเดล <strong>${payload.model?.fileName || DEFAULT_MODEL_FILE_NAME}</strong> ตรวจจับจาก URL ได้ <strong>${payload.total}</strong> เป้าหมาย${summaryText ? ` (${summaryText})` : ""}${timelineCount ? ` · timeline ${timelineCount} จุด` : ""}${snapshotCount ? ` · snapshots ${snapshotCount}` : ""}${elapsedText}`
      );
      this.appendFilteredDetectionHint(payload, sourceLabel);
    },
    async analyzeFileSources() {
      const fileSlots = this.sourceSlots.filter((slot) => slot.file);
      this.metrics = this.emptyMetrics();
      for (const slot of fileSlots) {
        await this.analyzeFileSource(slot);
      }
    },
    async analyzeUrlSources() {
      const urlSlots = this.sourceSlots.filter((slot) => slot.url.trim());
      this.metrics = this.emptyMetrics();
      for (const slot of urlSlots) {
        await this.analyzeUrlSource(slot);
      }
    },
    clearInputData() {
      this.inputMode = "url";
      this.sourceMode = "stream";
      this.resetSourceSlots();
      this.selectedTargets = [...DEFAULT_TARGET_SELECTION];
      this.timelineFilterTargets = [...DEFAULT_TARGET_SELECTION];
      this.metrics = this.emptyMetrics();
      this.logs = [];
      this.checkInferenceServer();
    },
    resetPageData() {
      window.clearInterval(this.timer);
      this.running = false;
      this.analysisLoopBusy = false;
      this.inputMode = "url";
      this.sourceMode = "stream";
      this.resetSourceSlots();
      this.selectedTargets = [...DEFAULT_TARGET_SELECTION];
      this.timelineFilterTargets = [...DEFAULT_TARGET_SELECTION];
      this.selectedModel = DEFAULT_MODEL_ID;
      this.sidebarCollapsed = false;
      this.logIndex = 0;
      this.syncSidebarState(false);
      this.resolveBundledModels();
      this.checkInferenceServer();
      this.metrics = this.emptyMetrics();
      this.logs = [];
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
        this.selectedTargets = this.allTargetsSelected ? [] : this.getAllTargetIds();
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
    toggleTimelineTarget(type) {
      if (type === "ALL") {
        this.timelineFilterTargets = this.allTimelineTargetsSelected ? [] : [...this.targetTypes];
        return;
      }

      if (this.timelineFilterTargets.includes(type)) {
        this.timelineFilterTargets = this.timelineFilterTargets.filter((target) => target !== type);
      } else {
        this.timelineFilterTargets = [...this.timelineFilterTargets, type];
      }
    },
    isTimelineTargetSelected(type) {
      if (type === "ALL") return this.allTimelineTargetsSelected;
      return this.timelineFilterTargets.includes(type);
    },
    openSnapshotPopup(snapshot, source) {
      this.selectedSnapshot = { ...this.decorateDetectionMoment(snapshot), source };
    },
    openTimelinePopup(event, source) {
      this.selectedSnapshot = { ...this.decorateDetectionMoment(event), source };
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
    async loadReports() {
      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/reports`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        this.reportRecords = Array.isArray(payload.reports) ? payload.reports : [];
        this.selectedReportIds = [];
        this.reportPage = 1;
        this.ensureSelectedReportVisible();
      } catch (error) {
        // Keep the bundled sample records visible if the inference server is not
        // running yet; new saves still clearly report that persistence failed.
        console.warn("Unable to load saved reports", error);
      }
    },
    async confirmSaveData() {
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
      const media = source.analysis?.media || {};
      const reportRecord = {
        name: fileName.replace(/\.[^.]+$/, ""),
        source: source.label || source.src || source.cameraLabel,
        ...this.getSavedFileMeta(source, fileName),
        date,
        time,
        resolution: media.resolution || "1920 x 1080",
        fps: media.fps ? String(media.fps) : (source.mediaKind?.startsWith("image") ? "-" : "25"),
        recorder: "admin",
        tags: this.targetTypes.filter((type) => Number(metrics[type] || 0) > 0),
        metrics,
        image: source.analysis?.previewImage || this.fallbackPreviewImage,
        model: this.selectedModelName,
        modelFile: this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME
      };

      try {
        const response = await fetch(`${this.getInferenceApiBase()}/api/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportRecord)
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.report) {
          throw new Error(payload.error || `HTTP ${response.status}`);
        }

        const savedReport = payload.report;
        this.reportRecords.unshift(savedReport);
        this.selectedReportId = savedReport.id;
        this.updateReportStats(savedReport);
        this.reportNotice = `บันทึกข้อมูล ${fileName} เรียบร้อยแล้ว`;
      } catch (error) {
        this.reportNotice = "บันทึกรายงานลงฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบว่า inference server กำลังทำงาน";
        this.logs.unshift({
          id: Date.now(),
          time,
          message: "<strong>ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้</strong>"
        });
        return;
      }

      this.logs.unshift({
        id: Date.now(),
        time,
        message: `บันทึกข้อมูล ${source?.cameraLabel || "CAM"} เป็นไฟล์ <strong>${fileName}</strong>`
      });
      this.closeSaveDialog();
      await this.loadReports();
      this.setView("report");
    },
    buildSavedMetrics(source) {
      const sourceIndex = Math.max(0, this.monitoringSources.findIndex((item) => item.id === source.id));
      const summary = this.sourceMetrics[sourceIndex]?.metrics || this.metrics;

      return this.targetTypes.reduce((savedMetrics, type) => {
        savedMetrics[type] = this.selectedTargets.includes(type) ? summary[type] : 0;
        return savedMetrics;
      }, {});
    },
    reportDetectedTags(record) {
      const detected = this.targetTypes.filter((type) => Number(record?.metrics?.[type] || 0) > 0);
      return detected.length ? detected : (record?.tags || []);
    },
    getSavedFileMeta(source, fileName) {
      const sourceText = `${fileName} ${source.label || ""}`.toLowerCase();
      const isImage = source.mediaKind?.startsWith("image") || /\.(jpg|jpeg|png|webp)(?:\s|$)/i.test(sourceText);
      const extMatch = sourceText.match(/\.([a-z0-9]+)(?:\s|$)/i);
      const ext = extMatch ? extMatch[1].toUpperCase() : (isImage ? "JPG" : "MP4");
      const media = source.analysis?.media || {};
      const duration = isImage
        ? "ภาพนิ่ง"
        : (media.durationLabel || this.formatDuration(source.analysis?.durationSec || 0));
      const size = source.file?.size ? this.formatFileSize(source.file.size) : (isImage ? "2.45 MB" : "1.24 GB");

      return {
        ext,
        kind: isImage ? "image" : "video",
        duration,
        size
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
      const createdAt = new Date(record.createdAt || "");
      if (Number.isNaN(createdAt.getTime())) return false;
      const now = new Date();
      if (this.reportDateMode === "today") {
        return createdAt.toDateString() === now.toDateString();
      }
      if (this.reportDateMode === "week") {
        return createdAt >= new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      }
      if (this.reportDateMode === "month") {
        return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
      }
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
      this.$nextTick(() => this.$refs.reportDetailPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
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
    async confirmDeleteReport() {
      const record = this.deleteDialog.record;
      if (!record) return;
      const recordsToDelete = this.deleteDialog.records?.length ? this.deleteDialog.records : [record];
      const deletionResults = await Promise.all(recordsToDelete.map(async (item) => {
        try {
          const response = await fetch(`${this.getInferenceApiBase()}/api/reports/${item.id}`, { method: "DELETE" });
          return response.ok ? item.id : null;
        } catch (_error) {
          return null;
        }
      }));
      const deleteIds = new Set(deletionResults.filter(Boolean));
      if (!deleteIds.size) {
        this.reportNotice = "ลบรายงานจากฐานข้อมูลไม่สำเร็จ กรุณาตรวจสอบ inference server";
        return;
      }
      this.reportRecords = this.reportRecords.filter((item) => !deleteIds.has(item.id));
      this.selectedReportIds = this.selectedReportIds.filter((id) => !deleteIds.has(id));
      this.reportPage = Math.min(this.reportPage, this.reportTotalPages);
      this.ensureSelectedReportVisible();
      if (deleteIds.size !== recordsToDelete.length) {
        this.reportNotice = `ลบได้ ${deleteIds.size} จาก ${recordsToDelete.length} รายการ`;
        this.closeDeleteDialog();
        return;
      }
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
    async setRunning(next) {
      if (next && !this.canRunDetection) {
        this.appendLog(this.runDisabledReason);
        return;
      }

      this.running = next;

      if (this.running) {
        if (this.inputMode === "file") {
          try {
            await this.checkInferenceServer();
            if (this.inferenceServer.status !== "ready") {
              throw new Error("Backend offline");
            }
            this.appendLog(`backend พร้อม และโหลดโมเดล <strong>${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME}</strong> สำเร็จ`);
            await this.analyzeFileSources();
            this.appendLog(`สรุปผลตรวจจับทั้งหมด <strong>${this.totalCount}</strong> เป้าหมาย`);
          } catch (error) {
            this.running = false;
            this.appendLog(`เริ่มรันโมเดลไม่สำเร็จ: <strong>${error.message || "Unknown error"}</strong>`);
          }
          return;
        }

        try {
          await this.checkInferenceServer();
          if (this.inferenceServer.status !== "ready") {
            throw new Error("Backend offline");
          }
          this.appendLog(`backend พร้อม และโหลดโมเดล <strong>${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME}</strong> สำเร็จ`);
          this.analysisLoopBusy = true;
          await this.analyzeUrlSources();
          this.appendLog(`สรุปผลตรวจจับล่าสุด <strong>${this.totalCount}</strong> เป้าหมาย`);
          this.analysisLoopBusy = false;
          this.timer = window.setInterval(async () => {
            if (!this.running || this.analysisLoopBusy) return;
            this.analysisLoopBusy = true;
            try {
              await this.analyzeUrlSources();
            } catch (error) {
              this.appendLog(`อัปเดต stream ไม่สำเร็จ: <strong>${error.message || "Unknown error"}</strong>`);
            } finally {
              this.analysisLoopBusy = false;
            }
          }, 8000);
        } catch (error) {
          this.analysisLoopBusy = false;
          this.running = false;
          this.appendLog(`เริ่มรันโมเดลไม่สำเร็จ: <strong>${error.message || "Unknown error"}</strong>`);
        }
      } else {
        window.clearInterval(this.timer);
        await this.stopAllLiveVideoSessions();
        this.analysisLoopBusy = false;
        this.appendLog(`หยุดการตรวจจับของโมเดล <strong>${this.selectedModelMeta?.fileName || DEFAULT_MODEL_FILE_NAME}</strong>`);
      }
    }
  }
};
</script>
