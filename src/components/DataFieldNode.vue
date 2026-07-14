<script setup>
import { inject, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import Button from 'primevue/button'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true }
})

const emit = defineEmits(['delete'])

const activeToolbarNodeId = inject('activeToolbarNodeId')
const toolbarVisible = computed(() => activeToolbarNodeId.value === props.id)

function toggleToolbar() {
  if (activeToolbarNodeId.value === props.id) {
    activeToolbarNodeId.value = null
  } else {
    activeToolbarNodeId.value = props.id
  }
}
</script>

<template>
  <div class="datafield-node">
    <NodeToolbar :position="Position.Top" :offset="8" :is-visible="toolbarVisible">
      <div class="df-toolbar">
        <span class="df-toolbar-label">{{ data.label }}</span>
      </div>
    </NodeToolbar>

    <div class="df-body" @click.stop="toggleToolbar">
      <span class="pi pi-database df-icon"></span>
      <span class="df-label">{{ data.label }}</span>
      <Button
        icon="pi pi-trash"
        severity="danger"
        size="small"
        rounded
        text
        class="df-delete-btn"
        @click.stop="emit('delete', id)"
      />
    </div>
    <Handle type="source" :position="Position.Right" class="df-handle" />
  </div>
</template>

<style scoped>
.datafield-node {
  background: var(--p-surface-0, #ffffff);
  border: 2px solid var(--p-blue-500, #3b82f6);
  border-radius: 20px;
  padding: 0;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.df-body {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
}

.df-icon {
  font-size: 14px;
  color: var(--p-blue-500, #3b82f6);
}

.df-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--p-blue-700, #1d4ed8);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.df-delete-btn {
  opacity: 0.5;
  transition: opacity 0.15s;
  margin-left: auto;
}

.df-delete-btn:hover {
  opacity: 1;
}

.df-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--p-surface-800, #1f2937);
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.df-toolbar-label {
  font-size: 12px;
  color: var(--p-primary-300, #6ee7b7);
  font-weight: 600;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.df-handle {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid var(--p-blue-500, #3b82f6) !important;
  background: white !important;
  right: -5px !important;
}
</style>
