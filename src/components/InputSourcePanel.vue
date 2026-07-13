<template>
  <article class="panel step-panel">
    <div class="step-head">
      <span class="step-number step-source">1</span>
      <h2>Input Source</h2>
    </div>
    <div class="source-tabs" role="tablist" aria-label="Input source type">
      <button
        class="source-tab"
        :class="{ 'is-active': inputMode === 'url' }"
        @click="$emit('set-input-mode', 'url')"
      >
        URL / STREAM
      </button>
      <button
        class="source-tab"
        :class="{ 'is-active': inputMode === 'file' }"
        @click="$emit('set-input-mode', 'file')"
      >
        VIDEO / PICTURE
      </button>
    </div>

    <div v-if="inputMode === 'url'" class="source-list">
      <div v-for="(slot, index) in sourceSlots" :key="slot.id" class="source-slot">
        <span class="source-index">CAM {{ index + 1 }}</span>
        <input
          :value="slot.url"
          type="url"
          :aria-label="`URL stream ${index + 1}`"
          placeholder="rtsp:// or https:// stream"
          @input="$emit('update-source-url', slot, $event.target.value)"
        />
        <button
          class="source-remove"
          type="button"
          title="Remove source"
          aria-label="Remove source"
          :disabled="sourceSlots.length === 1"
          @click="$emit('remove-source-slot', slot)"
        >
          ×
        </button>
      </div>
      <div class="source-actions-row">
        <button class="secondary-small" type="button" :disabled="sourceSlots.length >= 4" @click="$emit('add-source-slot')">Add source</button>
        <button id="connectBtn" class="primary-small" @click="$emit('connect-stream')">{{ connectLabel }}</button>
      </div>
    </div>

    <div v-else class="source-list">
      <div v-for="(slot, index) in sourceSlots" :key="slot.id" class="source-slot file-source">
        <span class="source-index">CAM {{ index + 1 }}</span>
        <label class="file-button-inline">
          <input class="hidden-file" type="file" :accept="fileAccept" @change="$emit('file-select', $event, slot)" />
          <span>{{ slot.fileName || 'Choose Video / Picture' }}</span>
        </label>
        <button
          class="source-remove"
          type="button"
          title="Remove source"
          aria-label="Remove source"
          :disabled="sourceSlots.length === 1"
          @click="$emit('remove-source-slot', slot)"
        >
          ×
        </button>
      </div>
      <div class="source-actions-row">
        <button class="secondary-small" type="button" :disabled="sourceSlots.length >= 4" @click="$emit('add-source-slot')">Add source</button>
        <button class="primary-small" @click="$emit('connect-stream')">{{ connectLabel }}</button>
      </div>
    </div>

    <div class="connection-state" :class="sourceStatusClass">
      <span></span>
      <strong id="connectionText">{{ sourceStatus }}</strong>
    </div>
  </article>
</template>

<script>
export default {
  name: "InputSourcePanel",
  props: {
    inputMode: {
      type: String,
      required: true
    },
    sourceSlots: {
      type: Array,
      required: true
    },
    fileAccept: {
      type: String,
      required: true
    },
    connectLabel: {
      type: String,
      required: true
    },
    sourceStatus: {
      type: String,
      required: true
    },
    sourceStatusClass: {
      type: String,
      required: true
    }
  },
  emits: [
    "add-source-slot",
    "connect-stream",
    "file-select",
    "remove-source-slot",
    "set-input-mode",
    "update-source-url"
  ]
};
</script>
