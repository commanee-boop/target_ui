<template>
  <article class="panel step-panel model-panel">
    <div class="step-head">
      <span class="step-number step-model">3</span>
      <h2>Detection Model</h2>
    </div>
    <label class="model-select">
      <span>Model</span>
      <select :value="selectedModel" aria-label="Detection model" @change="$emit('update:selected-model', $event.target.value)">
        <option v-for="model in models" :key="model.id" :value="model.id">
          {{ model.name }}
        </option>
      </select>
    </label>
    <div class="model-summary">
      <span class="processor">AI</span>
      <div>
        <strong>{{ selectedModelName }}</strong>
        <span>{{ selectedModelDetail }}</span>
      </div>
    </div>
    <button id="startBtn" class="primary-action" :class="{ 'is-running': running }" @click="$emit('toggle-running')">
      <span class="play-icon"></span>
      <strong>{{ running ? 'Detecting...' : 'Start Detection' }}</strong>
    </button>
    <button class="stop-action" type="button" :disabled="!running" @click="$emit('stop-detection')">
      <span class="stop-action-icon"></span>
      <strong>Stop Detection</strong>
    </button>
  </article>
</template>

<script>
export default {
  name: "DetectionModelPanel",
  props: {
    models: {
      type: Array,
      required: true
    },
    running: {
      type: Boolean,
      default: false
    },
    selectedModel: {
      type: String,
      required: true
    },
    selectedModelName: {
      type: String,
      required: true
    }
  },
  emits: ["stop-detection", "toggle-running", "update:selected-model"],
  computed: {
    selectedModelDetail() {
      return this.models.find((model) => model.id === this.selectedModel)?.detail || "";
    }
  }
};
</script>
