<script lang="ts">
  import { store } from '../store.svelte'
</script>

<div class="playback">
  <button class="play" onclick={() => store.togglePlay()}>
    {#if store.isPlaying}
      <span class="icon">❚❚</span> Pause
    {:else}
      <span class="icon">▶</span> Play
    {/if}
  </button>
  <button class="restart" title="Restart from step 1" onclick={() => store.play()}>↺</button>

  <div class="counter">Step {store.currentIndex + 1} / {store.steps.length}</div>
</div>

<style>
  .playback {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  button {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #1c1c22;
    color: #e5e7eb;
    border-radius: 9px;
    cursor: pointer;
    font-size: 13px;
  }
  button:hover {
    background: #26262e;
  }

  .play {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border: none;
    font-weight: 600;
  }
  .play:hover {
    filter: brightness(1.08);
  }
  .icon {
    font-size: 11px;
  }

  .restart {
    width: 36px;
    height: 36px;
    font-size: 16px;
    display: grid;
    place-items: center;
  }

  .counter {
    font-size: 12px;
    color: #9ca3af;
    margin-left: 4px;
  }
</style>
