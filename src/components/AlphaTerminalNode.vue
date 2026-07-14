<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true }
})
</script>

<template>
  <div class="terminal-node">
    <div class="terminal-body">
      <span class="pi pi-calculator terminal-icon"></span>
      <span class="terminal-label">ALPHA</span>
    </div>
    <Handle type="target" :position="Position.Left" class="terminal-handle" />
  </div>
</template>

<style scoped>
.terminal-node {
  background: linear-gradient(135deg, var(--p-primary-600, #059669), var(--p-primary-700, #047857));
  border: 2px solid var(--p-primary-500, #10b981);
  border-radius: 16px;
  padding: 0;
  min-width: 120px;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
}

.terminal-body {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
}

.terminal-icon {
  font-size: 20px;
  color: white;
}

.terminal-label {
  font-weight: 700;
  font-size: 18px;
  color: white;
  letter-spacing: 1px;
}

.terminal-handle {
  width: 12px !important;
  height: 12px !important;
  border: 3px solid var(--p-primary-300, #6ee7b7) !important;
  background: white !important;
  left: -6px !important;
}
</style>
