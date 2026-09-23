<script lang="ts">
  import { store } from '../store.svelte'
  import type { Project } from '../types'
  import ExportDialog from './ExportDialog.svelte'

  let fileInput = $state<HTMLInputElement>()
  let exportOpen = $state(false)

  function exportJson() {
    const data = JSON.stringify(store.project, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeName = store.project.name.trim().replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'snip'
    a.href = url
    a.download = `${safeName}.snip.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJson(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Project
      if (!parsed?.steps?.length) throw new Error('Invalid project file')
      store.loadProject(parsed)
    } catch {
      alert('Could not import that file. Make sure it is a Snippet Cast .snip.json export.')
    }
    input.value = ''
  }

  function newProject() {
    if (confirm('Start a new project? Your current snip will be replaced.')) {
      store.newProject()
    }
  }
</script>

<div class="toolbar">
  <input
    class="name"
    value={store.project.name}
    oninput={(e) => store.setName(e.currentTarget.value)}
    aria-label="Project name"
  />

  <div class="actions">
    <button onclick={newProject}>New</button>
    <button onclick={() => fileInput?.click()}>Import</button>
    <button onclick={exportJson}>Export JSON</button>
    <button class="primary" onclick={() => (exportOpen = true)}>⬇ Export</button>
  </div>

  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    onchange={importJson}
    hidden
  />
</div>

<ExportDialog open={exportOpen} onClose={() => (exportOpen = false)} />

<style>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .name {
    background: #15151c;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e5e7eb;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    width: 200px;
  }
  .name:focus {
    outline: none;
    border-color: #a855f7;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
  .actions button {
    background: #1c1c22;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
    border-radius: 8px;
    padding: 7px 13px;
    font-size: 13px;
    cursor: pointer;
  }
  .actions button:hover {
    background: #26262e;
  }
  .actions button.primary {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border: none;
    font-weight: 600;
  }
  .actions button.primary:hover {
    filter: brightness(1.08);
  }
</style>
