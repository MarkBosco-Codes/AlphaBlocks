<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ToggleButton from 'primevue/togglebutton'
import CustomAlphaNode from '@/components/CustomAlphaNode.vue'
import AlphaTerminalNode from '@/components/AlphaTerminalNode.vue'
import DataFieldNode from '@/components/DataFieldNode.vue'
import { BLOCK_TEMPLATES, CURRENT_DATA_FIELDS } from '@/blocks-registry.js'

const toast = useToast()

const nodes = ref([])
const edges = ref([])
const universe = ref('TOP3000')
const delay = ref(1)
const categoryFilter = ref('All')
const compileDialogVisible = ref(false)
const compiledCode = ref('')
const darkMode = ref(false)

const activeToolbarNodeId = ref(null)
let nodeCounter = 0
const sidebarVisible = ref(true)

provide('activeToolbarNodeId', activeToolbarNodeId)

const nodeTypes = {
  custom: CustomAlphaNode,
  alpha: AlphaTerminalNode,
  datafield: DataFieldNode
}

const categories = computed(() => {
  return ['All', ...new Set(BLOCK_TEMPLATES.map(b => b.category))]
})

const filteredBlocks = computed(() => {
  if (categoryFilter.value === 'All') return BLOCK_TEMPLATES
  return BLOCK_TEMPLATES.filter(b => b.category === categoryFilter.value)
})

const universeOptions = ['TOP500', 'TOP200', 'TOP3000', "TOPSP500"]

function addBlock(template) {
  nodeCounter++
  const id = `node-${nodeCounter}`
  const newNode = {
    id,
    type: 'custom',
    position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 300 },
    data: {
      label: template.name,
      template: template.template,
      arguments: JSON.parse(JSON.stringify(template.arguments))
    }
  }
  nodes.value.push(newNode)
}

function addDataField(field) {
  nodeCounter++
  const id = `node-${nodeCounter}`
  const newNode = {
    id,
    type: 'datafield',
    position: { x: 50 + Math.random() * 100, y: 100 + Math.random() * 300 },
    data: {
      label: field,
      selectedValue: field
    }
  }
  nodes.value.push(newNode)
}

function addAlphaBlock() {
  nodeCounter++
  const id = `node-${nodeCounter}`
  const newNode = {
    id,
    type: 'alpha',
    position: { x: 600, y: 250 },
    data: { label: 'ALPHA' }
  }
  nodes.value.push(newNode)
}

function onNodeDataUpdate(nodeId, newData) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (node) {
    node.data = newData
  }
}

function onNodeClick({ node }) {
  if (activeToolbarNodeId.value === node.id) {
    activeToolbarNodeId.value = null
  } else {
    activeToolbarNodeId.value = node.id
  }
}

function onPaneClick() {
  activeToolbarNodeId.value = null
}

function deleteNode(nodeId) {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
}

function onConnect(connection) {
  const existingSource = edges.value.findIndex(
    e => e.source === connection.source && e.sourceHandle === connection.sourceHandle
  )
  if (existingSource !== -1) {
    edges.value.splice(existingSource, 1)
  }
  const existingTarget = edges.value.findIndex(
    e => e.target === connection.target && e.targetHandle === connection.targetHandle
  )
  if (existingTarget !== -1) {
    edges.value.splice(existingTarget, 1)
  }
  edges.value.push({
    id: `e-${connection.source}-${connection.target}-${connection.sourceHandle || 'default'}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    animated: true
  })
}

function onEdgeDragStart(edge) {
  edges.value = edges.value.filter(e => e.id !== edge.id)
}

function onDragStart(event, block) {
  event.dataTransfer.setData('application/block', JSON.stringify(block))
  event.dataTransfer.effectAllowed = 'move'
}

function onDataFieldDragStart(event, field) {
  event.dataTransfer.setData('application/datafield', field)
  event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event) {
  const blockData = event.dataTransfer.getData('application/block')
  const fieldData = event.dataTransfer.getData('application/datafield')
  const bounds = event.currentTarget.getBoundingClientRect()
  const position = {
    x: event.clientX - bounds.left - 100,
    y: event.clientY - bounds.top - 50
  }

  if (blockData) {
    const template = JSON.parse(blockData)
    nodeCounter++
    const id = `node-${nodeCounter}`
    nodes.value.push({
      id,
      type: 'custom',
      position,
      data: {
        label: template.name,
        template: template.template,
        arguments: JSON.parse(JSON.stringify(template.arguments))
      }
    })
  } else if (fieldData) {
    nodeCounter++
    const id = `node-${nodeCounter}`
    nodes.value.push({
      id,
      type: 'datafield',
      position,
      data: {
        label: fieldData,
        selectedValue: fieldData
      }
    })
  }
}

function compileExpression() {
  const alphaNode = nodes.value.find(n => n.type === 'alpha')
  if (!alphaNode) {
    compiledCode.value = 'Error: Missing terminal ALPHA block.'
    return
  }

  const lines = []
  const assignedLetters = new Map()
  let currentLetterCode = 97
  const visited = new Set()
  const queue = [alphaNode.id]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (visited.has(currentId)) continue
    visited.add(currentId)
    const currentNode = nodes.value.find(n => n.id === currentId)
    if (!currentNode) continue
    if (!assignedLetters.has(currentId) && currentNode.type !== 'alpha') {
      assignedLetters.set(currentId, String.fromCharCode(currentLetterCode++))
    }
    const incomingEdges = edges.value.filter(e => e.target === currentId)
    incomingEdges.forEach(edge => {
      if (!visited.has(edge.source)) {
        queue.push(edge.source)
      }
    })
  }

  const orderedNodeIds = Array.from(assignedLetters.keys()).reverse()

  for (const id of orderedNodeIds) {
    const node = nodes.value.find(n => n.id === id)
    const letter = assignedLetters.get(id)
    if (node.type === 'datafield') {
      lines.push(`${letter} = ${node.data.selectedValue};`)
      continue
    }
    let compiledTemplate = node.data.template
    node.data.arguments.forEach(arg => {
      const incomingEdge = edges.value.find(e => e.target === id && e.targetHandle === arg.name)
      if (incomingEdge) {
        const sourceLetter = assignedLetters.get(incomingEdge.source)
        if (sourceLetter) {
          compiledTemplate = compiledTemplate.replaceAll(`<<${arg.name}>>`, sourceLetter)
        } else {
          compiledTemplate = compiledTemplate.replaceAll(`<<${arg.name}>>`, arg.value)
        }
      } else {
        compiledTemplate = compiledTemplate.replaceAll(`<<${arg.name}>>`, arg.value)
      }
    })
    lines.push(`${letter} = ${compiledTemplate};`)
  }

  const finalEdge = edges.value.find(e => e.target === alphaNode.id)
  if (!finalEdge) {
    compiledCode.value = 'Error: The ALPHA terminal block has no connected inputs!'
    return
  }
  const terminalLetter = assignedLetters.get(finalEdge.source)
  if (!terminalLetter) {
    compiledCode.value = 'Error: Could not resolve terminal connection.'
    return
  }
  lines.push(terminalLetter)
  compiledCode.value = lines.join('\n')
}

function simulateAlpha() {
  toast.add({
    severity: 'success',
    summary: 'Alpha Simulation Complete',
    detail: 'Sharpe: 1.84 | Turnover: 12.3% | Fitness: 0.76 | Max Drawdown: -8.2%',
    life: 5000
  })
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('app-dark', darkMode.value)
}

onMounted(() => {
  addAlphaBlock()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <span class="pi pi-sitemap header-logo"></span>
        <h1 class="header-title">AlphaBlocks Workbench 2026</h1>
      </div>
      <div class="header-controls">
        <button class="sidebar-toggle-btn" @click="toggleSidebar" onclick="document.querySelector('#app > div > div > aside').hidden = !document.querySelector('#app > div > div > aside').hidden">
          <span class="pi pi-bars"></span>
        </button>
        <div class="control-group">
          <label class="control-label">Universe</label>
          <Select
            v-model="universe"
            :options="universeOptions"
            size="small"
            class="control-select"
          />
        </div>
        <div class="control-group">
          <label class="control-label">Delay</label>
          <Select v-model="delay" :options="[0, 1]" size="small" class="delay-select" />
        </div>
        <div class="header-divider"></div>
        <div class="control-group dark-toggle-group">
          <label class="control-label">Theme</label>
          <button
            class="dark-toggle-btn"
            :class="{ 'dark-active': darkMode }"
            @click="toggleDarkMode"
          >
            <span class="pi pi-sun toggle-icon sun-icon"></span>
            <span class="toggle-slider"></span>
            <span class="pi pi-moon toggle-icon moon-icon"></span>
          </button>
        </div>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar" :class="{ 'sidebar-hidden': !sidebarVisible }">
        <div class="sidebar-header">
          <h2 class="sidebar-title">Block Library</h2>
          <Select
            v-model="categoryFilter"
            :options="categories"
            class="category-select"
            size="small"
          />
        </div>
        <div class="sidebar-blocks">
          <div
            v-for="block in filteredBlocks"
            :key="block.name"
            class="block-card"
            draggable="true"
            @dragstart="onDragStart($event, block)"
            @click="addBlock(block)"
          >
            <span class="block-name">{{ block.name }}</span>
            <span class="block-category">{{ block.category }}</span>
          </div>
        </div>
        <div class="sidebar-divider"></div>
        <div class="sidebar-datafields">
          <h3 class="datafields-title">Data Fields</h3>
          <div
            v-for="field in CURRENT_DATA_FIELDS"
            :key="field"
            class="datafield-card"
            draggable="true"
            @dragstart="onDataFieldDragStart($event, field)"
            @click="addDataField(field)"
          >
            <span class="pi pi-database df-card-icon"></span>
            <span class="df-card-name">{{ field }}</span>
          </div>
        </div>
      </aside>

      <main class="canvas-area">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          :default-edge-options="{ type: 'smoothstep', animated: true }"
          :connection-mode="'strict'"
          fit-view-on-init
          class="vue-flow-instance"
          @connect="onConnect"
          @drop="onDrop"
          @dragover.prevent
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
          @edge-drag-start="onEdgeDragStart"
        >
          <Background :gap="20" :size="1" pattern-color="#e5e7eb" />
          <MiniMap
            :node-color="n => n.type === 'alpha' ? '#10b981' : n.type === 'datafield' ? '#3b82f6' : '#8b5cf6'"
            :mask-color="darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'"
          />

          <template #node-custom="nodeProps">
            <CustomAlphaNode
              v-bind="nodeProps"
              @update:data="onNodeDataUpdate(nodeProps.id, $event)"
              @delete="deleteNode"
            />
          </template>
          <template #node-alpha="nodeProps">
            <AlphaTerminalNode v-bind="nodeProps" />
          </template>
          <template #node-datafield="nodeProps">
            <DataFieldNode v-bind="nodeProps" @delete="deleteNode" />
          </template>
        </VueFlow>
      </main>
    </div>

    <footer class="app-footer">
      <Button
        label="Compile Alpha"
        icon="pi pi-cog"
        severity="success"
        size="large"
        class="compile-btn"
        @click="compileExpression(); compileDialogVisible = true"
      />
    </footer>

    <Dialog
      v-model:visible="compileDialogVisible"
      header="Compiled Alpha Expression"
      :modal="true"
      :style="{ width: '650px' }"
      class="compile-dialog"
    >
      <div class="dialog-content">
        <div class="compile-info">
          <div class="info-chip">
            <span class="pi pi-globe chip-icon"></span>
            <span>Universe: {{ universe }}</span>
          </div>
          <div class="info-chip">
            <span class="pi pi-clock chip-icon"></span>
            <span>Delay: {{ delay }}</span>
          </div>
        </div>
        <pre class="code-block"><code>{{ compiledCode }}</code></pre>
        <div class="dialog-actions">
          <Button
            label="Simulate Alpha"
            icon="pi pi-play"
            severity="success"
            size="large"
            class="simulate-btn"
            @click="simulateAlpha"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--p-surface-50, #f9fafb);
  overflow: hidden;
}

.sidebar-toggle-btn {
  width: 32px;
  height: 32px;
  background: var(--p-surface-0, #ffffff);
  border: 1px solid var(--p-surface-300, #d1d5db);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--p-surface-600, #4b5563);
  font-size: 14px;
}

.sidebar-toggle-btn:hover {
  background: var(--p-surface-100, #f3f4f6);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--p-surface-0, #ffffff);
  border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  font-size: 24px;
  color: var(--p-primary-500, #10b981);
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--p-surface-900, #111827);
  margin: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--p-surface-600, #4b5563);
  white-space: nowrap;
}

.control-select {
  width: 160px;
}

.control-input {
  width: 80px;
}

.header-divider {
  width: 1px;
  height: 28px;
  background: var(--p-surface-200, #e5e7eb);
}

.dark-toggle-group {
  gap: 8px;
}

.dark-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--p-surface-300, #d1d5db);
  border-radius: 20px;
  background: var(--p-surface-100, #f3f4f6);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.dark-toggle-btn:hover {
  border-color: var(--p-primary-400, #34d399);
}

.dark-toggle-btn.dark-active {
  background: var(--p-surface-700, #374151);
  border-color: var(--p-surface-600, #4b5563);
}

.toggle-icon {
  font-size: 14px;
  line-height: 1;
  transition: color 0.2s ease;
}

.sun-icon {
  color: #f59e0b;
}

.moon-icon {
  color: #6366f1;
}

.dark-active .sun-icon {
  color: #9ca3af;
}

.dark-active .moon-icon {
  color: #a5b4fc;
}

.toggle-slider {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 1px solid var(--p-surface-300, #d1d5db);
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.dark-active .toggle-slider {
  background: var(--p-primary-500, #10b981);
  border-color: var(--p-primary-500, #10b981);
  transform: translateX(2px);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  min-width: 300px;
  background: var(--p-surface-0, #ffffff);
  border-right: 1px solid var(--p-surface-200, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: width 0.3s ease, min-width 0.3s ease, padding 0.3s ease, border 0.3s ease;
}

.sidebar-hidden {
  width: 0;
  min-width: 0;
  padding: 0;
  border-right: none;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--p-surface-800, #1f2937);
  margin: 0 0 10px 0;
}

.category-select {
  width: 100%;
}

.sidebar-blocks {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--p-surface-50, #f9fafb);
  border: 1px solid var(--p-surface-200, #e5e7eb);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.15s ease;
}

.block-card:hover {
  border-color: var(--p-primary-400, #34d399);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
  transform: translateY(-1px);
}

.block-card:active {
  cursor: grabbing;
}

.block-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--p-surface-800, #1f2937);
}

.block-category {
  font-size: 11px;
  color: var(--p-surface-500, #6b7280);
  font-weight: 500;
}

.sidebar-divider {
  height: 1px;
  background: var(--p-surface-200, #e5e7eb);
  margin: 8px 16px;
}

.sidebar-datafields {
  padding: 0 12px 12px;
}

.datafields-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--p-surface-700, #374151);
  margin: 0 0 8px 0;
}

.datafield-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--p-blue-50, #eff6ff);
  border: 1px solid var(--p-blue-200, #bfdbfe);
  border-radius: 8px;
  cursor: grab;
  margin-bottom: 6px;
  transition: all 0.15s ease;
}

.datafield-card:hover {
  border-color: var(--p-blue-400, #60a5fa);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.df-card-icon {
  font-size: 12px;
  color: var(--p-blue-500, #3b82f6);
}

.df-card-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--p-blue-700, #1d4ed8);
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.canvas-area {
  flex: 1;
  position: relative;
}

.vue-flow-instance {
  width: 100%;
  height: 100%;
}

.app-footer {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: var(--p-surface-0, #ffffff);
  border-top: 1px solid var(--p-surface-200, #e5e7eb);
}

.compile-btn {
  min-width: 220px;
  font-weight: 600;
}

.compile-dialog :deep(.p-dialog-header) {
  padding: 16px 24px;
}

.compile-dialog :deep(.p-dialog-content) {
  padding: 0 24px 24px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.compile-info {
  display: flex;
  gap: 12px;
}

.info-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--p-surface-100, #f3f4f6);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--p-surface-700, #374151);
}

.chip-icon {
  font-size: 12px;
  color: var(--p-primary-500, #10b981);
}

.code-block {
  background: var(--p-surface-900, #111827);
  color: var(--p-primary-300, #6ee7b7);
  padding: 20px;
  border-radius: 10px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
  border: 1px solid var(--p-surface-700, #374151);
}

.code-block code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

.dialog-actions {
  display: flex;
  justify-content: center;
}

.simulate-btn {
  min-width: 200px;
  font-weight: 600;
}
</style>
