<script lang="ts">
  import { onMount } from "svelte";
  import Login from "./routes/Login.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import { authStore } from "$lib/stores/auth.store.svelte";

  onMount(() => authStore.loadSession());
</script>

<svelte:head>
  <title>Notion Clone</title>
</svelte:head>

{#if authStore.loading}
  <div class="splash">
    <div class="splash-icon">📝</div>
    <div class="splash-text">Loading…</div>
  </div>
{:else if !authStore.isAuthenticated}
  <Login onSuccess={() => authStore.loadSession()} />
{:else}
  <Dashboard onSignOut={() => authStore.loadSession()} />
{/if}

<style>
  :global(body) { margin: 0; padding: 0; }

  .splash {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: var(--color-surface);
  }

  .splash-icon { font-size: 3rem; }
  .splash-text { font-size: 14px; color: var(--color-text-muted); }
</style>
