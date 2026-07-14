<script setup>
import { inject, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true }
})

const emit = defineEmits(['update:data', 'delete'])

const activeToolbarNodeId = inject('activeToolbarNodeId')
const toolbarVisible = computed(() => activeToolbarNodeId.value === props.id)

function toggleToolbar() {
  if (activeToolbarNodeId.value === props.id) {
    activeToolbarNodeId.value = null
  } else {
    activeToolbarNodeId.value = props.id
  }
}

function updateArg(argName, newValue) {
  const updatedArgs = props.data.arguments.map(a =>
    a.name === argName ? { ...a, value: newValue } : a
  )
  emit('update:data', { ...props.data, arguments: updatedArgs })
}
</script>

<template>
  <div class="custom-alpha-node">
    <NodeToolbar :position="Position.Top" :offset="8" :is-visible="toolbarVisible">
      <div class="toolbar-content">
        <div v-for="arg in data.arguments" :key="arg.name" class="toolbar-group">
          <div class="toolbar-title">{{ arg.name }}</div>
          <InputNumber
            v-if="arg.type === 'integer'"
            :modelValue="arg.value"
            @update:modelValue="v => updateArg(arg.name, v)"
            :min="1"
            :max="252"
            size="small"
            class="toolbar-input"
          />
          <Select
            v-else-if="arg.type === 'operator'"
            :modelValue="arg.value"
            @update:modelValue="v => updateArg(arg.name, v)"
            :options="arg.options"
            class="toolbar-input"
            size="small"
          />
        </div>
      </div>
    </NodeToolbar>

    <div class="node-body" @click.stop="toggleToolbar">
      <div class="node-header-row">
        <div class="node-label">{{ data.label }}</div>
        <Button
          icon="pi pi-trash"
          severity="danger"
          size="small"
          rounded
          text
          class="delete-btn"
          @click.stop="emit('delete', props.id)"
        />
      </div>
      <div class="node-args">
        <div v-for="arg in data.arguments.filter(a => a.type !== 'input')" :key="arg.name" class="arg-row">
          <span class="arg-name">{{ arg.name }}</span>
          <span class="arg-value">{{ arg.value }}</span>
        </div>
      </div>
    </div>

    <Handle
      v-for="arg in data.arguments"
      :key="'target-' + arg.name"
      type="target"
      :position="Position.Left"
      :id="arg.name"
      class="custom-handle target-handle"
    />
    <Handle type="source" :position="Position.Right" class="custom-handle source-handle" />
  </div>
</template>

<style scoped>
.custom-alpha-node {
  background: var(--p-surface-0, #ffffff);
  border: 2px solid var(--p-primary-500, #10b981);
  border-radius: 12px;
  padding: 0;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: 'Inter', system-ui, sans-serif;
}

.node-body {
  padding: 12px 16px;
}

.node-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.node-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--p-primary-700, #047857);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delete-btn {
  opacity: 0.5;
  transition: opacity 0.15s;
}

.delete-btn:hover {
  opacity: 1;
}

.node-args {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.arg-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 2px 0;
}

.arg-name {
  color: var(--p-surface-500, #6b7280);
  font-weight: 500;
}

.arg-value {
  color: var(--p-surface-700, #374151);
  font-weight: 600;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 11px;
  background: var(--p-surface-100, #f3f4f6);
  padding: 1px 6px;
  border-radius: 4px;
}

.toolbar-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--p-surface-800, #1f2937);
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.toolbar-title {
  font-size: 11px;
  color: var(--p-surface-300, #d1d5db);
  font-weight: 600;
  text-transform: capitalize;
}

.toolbar-input {
  width: 100%;
}

:deep(.toolbar-input .p-inputnumber) {
  width: 100%;
}

:deep(.toolbar-input .p-select) {
  width: 100%;
}

.custom-handle {
  width: 10px !important;
  height: 10px !important;
  border: 2px solid var(--p-primary-500, #10b981) !important;
  background: var(--p-surface-0, #ffffff) !important;
}

.target-handle {
  left: -5px !important;
}

.source-handle {
  right: -5px !important;
}
</style>
