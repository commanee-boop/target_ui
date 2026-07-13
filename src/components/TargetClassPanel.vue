<template>
  <article class="panel step-panel target-panel target-class-panel">
    <button class="target-class-head" type="button" :aria-expanded="!collapsed" @click="$emit('toggle-collapsed')">
      <span class="target-head-icon"></span>
      <strong>TARGET CLASSES</strong>
      <span class="target-head-chevron"></span>
    </button>
    <div v-show="!collapsed" class="target-class-list" id="targetGrid">
      <button
        class="target-class-row"
        :class="{ 'is-selected': allSelected, 'is-muted': !allSelected }"
        type="button"
        data-type="ALL"
        title="Select all target classes"
        aria-label="Select all target classes"
        @click="$emit('select-target', 'ALL')"
      >
        <span class="target-check" aria-hidden="true"></span>
        <span class="target-class-copy">SELECT ALL</span>
        <span class="target-class-action"></span>
      </button>
      <button
        v-for="target in targets"
        :key="target.id"
        class="target-class-row"
        :class="{ 'is-selected': selectedTargets.includes(target.id), 'is-muted': !selectedTargets.includes(target.id) }"
        type="button"
        :data-type="target.id"
        :title="target.detail"
        :aria-label="target.detail"
        @click="$emit('select-target', target.id)"
      >
        <span class="target-check" aria-hidden="true"></span>
        <span class="target-class-copy">
          <strong>{{ target.id }}</strong>
          <small>{{ target.detail }}</small>
        </span>
        <span class="target-color-swatch" :style="{ '--target-row-color': target.color }"></span>
      </button>
    </div>
  </article>
</template>

<script>
export default {
  name: "TargetClassPanel",
  props: {
    allSelected: {
      type: Boolean,
      default: false
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    selectedTargets: {
      type: Array,
      required: true
    },
    targets: {
      type: Array,
      required: true
    }
  },
  emits: ["select-target", "toggle-collapsed"]
};
</script>
