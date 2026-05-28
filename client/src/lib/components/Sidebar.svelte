<script lang="ts">
  import PageTree from "./PageTree.svelte";
  import { workspaceStore } from "$lib/stores/workspace.store.svelte";
  import type { Workspace } from "@shared/types";

  interface Props {
    currentPageId?: string;
    onPageSelect: (id: string) => void;
  }

  let { currentPageId, onPageSelect }: Props = $props();

  let creatingPage = $state(false);
  let newPageTitle = $state("");
  let showWorkspaceMenu = $state(false);

  async function handleCreatePage(): Promise<void> {
    const ws = workspaceStore.currentWorkspace;
    if (!ws || !newPageTitle.trim()) return;
    creatingPage = true;
    try {
      const page = await workspaceStore.createPage({ workspaceId: ws.id, title: newPageTitle.trim() });
      newPageTitle = "";
      onPageSelect(page.id);
    } finally {
      creatingPage = false;
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm("Delete this page?")) return;
    await workspaceStore.deletePage(id);
    if (currentPageId === id) onPageSelect("");
  }

  async function handleSelectWorkspace(ws: Workspace): Promise<void> {
    showWorkspaceMenu = false;
    await workspaceStore.selectWorkspace(ws);
  }
</script>

<nav class="sidebar" aria-label="Sidebar">
  <div class="sidebar-header">
    <button
      class="workspace-btn"
      onclick={() => showWorkspaceMenu = !showWorkspaceMenu}
      aria-expanded={showWorkspaceMenu}
    >
      <span class="workspace-icon">🏢</span>
      <span class="workspace-name">{workspaceStore.currentWorkspace?.name ?? "Select workspace"}</span>
      <span class="chevron">▾</span>
    </button>

    {#if showWorkspaceMenu}
      <div class="workspace-dropdown">
        {#each workspaceStore.workspaces as ws (ws.id)}
          <button
            class="workspace-option"
            class:selected={workspaceStore.currentWorkspace?.id === ws.id}
            onclick={() => handleSelectWorkspace(ws)}
          >
            {ws.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="sidebar-pages">
    <div class="section-label">Pages</div>

    {#if workspaceStore.loading}
      <div class="loading-placeholder">Loading…</div>
    {:else if workspaceStore.pageTree.length === 0}
      <div class="empty-state">No pages yet</div>
    {:else}
      <PageTree
        nodes={workspaceStore.pageTree}
        {currentPageId}
        onSelect={onPageSelect}
        onDelete={handleDelete}
      />
    {/if}
  </div>

  <div class="sidebar-footer">
    <div class="add-page-row">
      <input
        class="input add-page-input"
        type="text"
        placeholder="New page title…"
        bind:value={newPageTitle}
        onkeydown={e => e.key === "Enter" && handleCreatePage()}
      />
      <button
        class="btn btn-primary add-btn"
        onclick={handleCreatePage}
        disabled={creatingPage || !newPageTitle.trim()}
        title="Create page"
      >+</button>
    </div>
  </div>
</nav>

<style>
  .sidebar-header {
    padding: 12px;
    border-bottom: 1px solid var(--color-border);
    position: relative;
  }

  .workspace-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    text-align: left;
  }

  .workspace-btn:hover { background: rgba(55 53 47 / 0.06); }

  .workspace-icon { font-size: 16px; }

  .workspace-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron { font-size: 10px; color: var(--color-text-muted); }

  .workspace-dropdown {
    position: absolute;
    top: calc(100% - 4px);
    left: 12px;
    right: 12px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(0 0 0 / 0.1);
    z-index: 50;
    overflow: hidden;
  }

  .workspace-option {
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 13px;
    color: var(--color-text);
  }

  .workspace-option:hover,
  .workspace-option.selected { background: var(--color-surface); }

  .sidebar-pages {
    flex: 1;
    overflow-y: auto;
    padding: 8px 4px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
    padding: 4px 12px 8px;
  }

  .loading-placeholder,
  .empty-state {
    font-size: 12px;
    color: var(--color-text-muted);
    padding: 8px 12px;
  }

  .sidebar-footer {
    padding: 8px 12px;
    border-top: 1px solid var(--color-border);
  }

  .add-page-row { display: flex; gap: 6px; }

  .add-page-input { font-size: 12px; padding: 6px 8px; }

  .add-btn { padding: 6px 12px; font-size: 16px; flex-shrink: 0; }
</style>
