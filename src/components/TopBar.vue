<template>
  <header class="topbar">
    <div class="top-brand" aria-label="ระบบตรวจจับเป้าหมายทางทหาร">
      <img src="/assets/target-command-logo.png" alt="" />
      <div class="top-brand-copy">
        <strong>MILITARY TARGET DETECTION SYSTEM</strong>
        <span>ระบบตรวจจับเป้าหมายทางทหาร</span>
      </div>
    </div>

    <div class="top-menu" aria-label="เมนูด้านบน">
      <button
        class="top-menu-item"
        :class="{ 'is-active': currentView === 'detect' }"
        title="ตรวจจับเป้าหมาย"
        aria-label="ตรวจจับเป้าหมาย"
        @click="$emit('set-view', 'detect')"
      >
        <span class="icon target-menu"></span>
        <span>ตรวจจับเป้าหมาย</span>
      </button>
      <button
        class="top-menu-item"
        :class="{ 'is-active': currentView === 'report' }"
        title="รายงานบันทึกข้อมูล"
        aria-label="รายงานบันทึกข้อมูล"
        @click="$emit('set-view', 'report')"
      >
        <span class="icon report"></span>
        <span>รายงานบันทึกข้อมูล</span>
      </button>
    </div>

    <div class="operator-cluster">
      <button
        id="themeToggle"
        class="theme-toggle"
        type="button"
        :title="themeTitle"
        :aria-label="themeTitle"
        :aria-pressed="theme === 'light'"
        @click="$emit('toggle-theme')"
      >
        <span class="theme-icon" aria-hidden="true"></span>
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
        <span class="icon logout"></span>
        <span>Logout</span>
      </button>
    </div>
  </header>
</template>

<script>
export default {
  name: "TopBar",
  props: {
    currentView: {
      type: String,
      required: true
    },
    theme: {
      type: String,
      required: true
    },
    themeTitle: {
      type: String,
      required: true
    },
    clockDate: {
      type: String,
      required: true
    },
    clockTime: {
      type: String,
      required: true
    }
  },
  emits: ["set-view", "toggle-theme"]
};
</script>
