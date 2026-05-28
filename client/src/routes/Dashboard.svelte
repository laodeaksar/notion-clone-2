<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Editor from "./Editor.svelte";
  import { workspaceStore } from "$lib/stores/workspace.store.svelte";
  import { authStore } from "$lib/stores/auth.store.svelte";

  interface Props {
    onSignOut: () => void;
  }
  let { onSignOut }: Props = $props();

  let currentPageId = $state<string>("");
  let showCreateWorkspace = $state(false);
  let newWorkspaceName = $state("");
  let creatingWorkspace = $state(false);

  onMount(async () => {
    await workspaceStore.fetchWorkspaces();
    if (workspaceStore.workspaces.length === 0) {
      showCreateWorkspace = true;
    }
  });

  async function handleCreateWorkspace(): Promise<void> {
    if (!newWorkspaceName.trim()) return;
    creatingWorkspace = true;
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create workspace");
      newWorkspaceName = "";
      showCreateWorkspace = false;
      await workspaceStore.fetchWorkspaces();
    } finally {
      creatingWorkspace = false;
    }
  }

  async function handleSignOut(): Promise<void> {
    await authStore.signOut();
    onSignOut();
  }
</script>

{#if showCreateWorkspace && workspaceStore.workspaces.length === 0}
  <div class="onboarding-overlay">
    <div class="onboarding-card">
      <div class="logo">📝</div>
      <h2>Create your first workspace</h2>
      <p>A workspace is where you organize your pages and collaborate with your team.</p>
      <input
        class="input"
        type="text"
        placeholder="My Workspace"
        bind:value={newWorkspaceName}
        onkeydown={e => e.key === "Enter" && handleCreateWorkspace()}
      />
      <button
        class="btn btn-primary"
        onclick={handleCreateWorkspace}
        disabled={creatingWorkspace || !newWorkspaceName.trim()}
      >
        {creatingWorkspace ? "Creating…" : "Create workspace"}
      </button>
    </div>
  </div>
{:else}
  <div class="app-layout">
    <Sidebar
      currentPageId={currentPageId}
      onPageSelect={(id) => { currentPageId = id; }}
    />

    <main class="main-area">
      <header class="top-bar">
        <div class="breadcrumb">
          {workspaceStore.currentWorkspace?.name ?? ""} {currentPageId ? "›" : ""}
        </div>
        <div class="top-actions">
          <span class="user-name">{authStore.user?.name}</span>
          <button class="btn btn-ghost" onclick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div class="content-area">
        {#if currentPageId}
          <Editor pageId={currentPageId} />
        {:else}
          <div class="welcome">
            <div class="welcome-icon">📝</div>
            <h2>Select a page to start writing</h2>
            <p>Create a page from the sidebar or select an existing one.</p>
          </div>
        {/if}
      </div>
    </main>
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .onboarding-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 40px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 4px 24px rgba(0 0 0 / 0.08);
    text-align: center;
  }

  .logo { font-size: 2.5rem; }

  .onboarding-card h2 {
    font-size: 1.4rem;
    font-weight: 700;
  }

  .onboarding-card p {
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .app-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 44px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    background: var(--color-bg);
  }

  .breadcrumb {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-name {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .content-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--color-text-muted);
    text-align: center;
    padding: 32px;
  }

  .welcome-icon { font-size: 4rem; }

  .welcome h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .welcome p { font-size: 13px; }
</style>
