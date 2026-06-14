<script lang="ts">
  import { store } from '../store.svelte'

  let dragIndex = $state<number | null>(null)
  let overIndex = $state<number | null>(null)

  function onDrop(target: number) {
    if (dragIndex !== null && dragIndex !== target) {
      store.reorderStep(dragIndex, target)
    }
    dragIndex = null
    overIndex = null
  }
</script>

<div class="timeline">
  <div class="nodes">
    {#each store.steps as step, i (step.id)}
      <div class="node-wrap">
        {#if i > 0}
          <span class="connector" class:active={i <= store.currentIndex}></span>
        {/if}
        <button
          class="node"
          class:active={i === store.currentIndex}
          class:dragover={overIndex === i}
          title="Step {i + 1}"
          draggable="true"
          ondragstart={() => (dragIndex = i)}
          ondragover={(e) => {
            e.preventDefault()
            overIndex = i
          }}
          ondragleave={() => {
            if (overIndex === i) overIndex = null
          }}
          ondrop={(e) => {
            e.preventDefault()
            onDrop(i)
          }}
          ondragend={() => {
            dragIndex = null
            overIndex = null
          }}
          onclick={() => store.selectStep(i)}
        >
          {i + 1}
        </button>
      </div>
    {/each}

    <button class="node add" title="Add step" onclick={() => store.addStep()}>+</button>
  </div>

  <div class="step-actions">
    <button title="Duplicate step" onclick={() => store.duplicateStep(store.currentIndex)}>⧉ Duplicate</button>
    <button
      title="Delete step"
      class="danger"
      disabled={store.steps.length <= 1}
      onclick={() => store.deleteStep(store.currentIndex)}>✕ Delete</button
    >
  </div>
</div>

<style>
  .timeline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 14px 20px;
    flex-wrap: wrap;
  }

  .nodes {
    display: flex;
    align-items: center;
  }

  .node-wrap {
    display: flex;
    align-items: center;
  }

  .connector {
    width: 26px;
    height: 3px;
    background: rgba(255, 255, 255, 0.14);
    border-radius: 2px;
  }
  .connector.active {
    background: #a855f7;
  }

  .node {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: #2a2a33;
    color: #d1d5db;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: transform 0.12s ease, background 0.12s ease;
  }
  .node:hover {
    transform: scale(1.08);
    background: #34343f;
  }
  .node.active {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: white;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.2);
  }
  .node.dragover {
    outline: 2px dashed #a855f7;
    outline-offset: 2px;
  }
  .node.add {
    margin-left: 12px;
    background: #1c1c22;
    color: #9ca3af;
    font-size: 22px;
    line-height: 0;
  }
  .node.add:hover {
    background: #2a2a33;
    color: white;
  }

  .step-actions {
    display: flex;
    gap: 8px;
  }
  .step-actions button {
    background: #1c1c22;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    border-radius: 8px;
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  .step-actions button:hover {
    background: #26262e;
  }
  .step-actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .step-actions button.danger:hover:not(:disabled) {
    background: #3b1d1d;
    color: #fca5a5;
  }
</style>
