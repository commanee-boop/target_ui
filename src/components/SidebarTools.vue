<template>
  <article class="sidebar-tools" aria-label="Target configuration tools">
    <div class="tools-title">
      <span class="tools-mark"><span class="icon sliders"></span></span>
      <div>
        <strong>Target Configuration</strong>
        <span>Input and detection setup</span>
      </div>
    </div>
    <div class="tools-actions">
      <button
        class="tool-action clear-input"
        type="button"
        title="Clear input data"
        aria-label="Clear input data"
        @click="$emit('clear-input')"
      >
        <span class="tool-icon eraser"></span>
      </button>
      <button
        class="tool-action reset-page"
        type="button"
        title="Reset all data"
        aria-label="Reset all data"
        @click="$emit('reset-page')"
      >
        <span class="tool-icon refresh"></span>
      </button>
      <button
        class="tool-action collapse-menu"
        :class="{ 'is-collapsed': collapsed }"
        type="button"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click.prevent.stop="$emit('toggle-sidebar')"
      >
        <span class="tool-icon chevron"></span>
      </button>
    </div>
  </article>
</template>

<script>
export default {
  name: "SidebarTools",
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ["clear-input", "reset-page", "toggle-sidebar"]
};
</script>
