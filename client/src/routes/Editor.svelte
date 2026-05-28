<script lang="ts">
  import CollabEditor from "$lib/editor/CollabEditor.svelte";
  import { api } from "$lib/api";
  import type { Page } from "@shared/types";

  interface Props {
    pageId: string;
  }

  let { pageId }: Props = $props();

  let page = $state<Page | null>(null);
  let loading = $state(true);
  let error = $state("");
  let editingTitle = $state(false);
  let titleInput = $state("");

  $effect(() => {
    if (pageId) void loadPage(pageId);
  });

  async function loadPage(id: string): Promise<void> {
    loading = true;
    error = "";
    try {
      const { data, error: err } = await api.api.pages({ id }).get();
      if (err) throw new Error(String(err));
      page = data!.page as Page;
      titleInput = page.title;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load page";
    } finally {
      loading = false;
    }
  }

  async function saveTitle(): Promise<void> {
    if (!page || titleInput === page.title) {
      editingTitle = false;
      return;
    }
    const { data, error: err } = await api.api.pages({ id: page.id }).patch({ title: titleInput });
    if (!err && data?.page) page = data.page as Page;
    editingTitle = false;
  }

  const roomId = $derived(`page-${pageId}`);
</script>

<div class="editor-page">
  {#if loading}
    <div class="loading">Loading page…</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if page}
    <div class="page-header">
      {#if page.coverUrl}
        <div class="cover" style:background-image="url({page.coverUrl})"></div>
      {/if}

      <div class="page-meta">
        <span class="page-icon-large">{page.icon ?? "📄"}</span>

        {#if editingTitle}
          <input
            class="title-input"
            bind:value={titleInput}
            onblur={saveTitle}
            onkeydown={e => e.key === "Enter" && saveTitle()}
            autofocus
          />
        {:else}
          <h1
            class="page-title"
            role="button"
            tabindex="0"
            onclick={() => { editingTitle = true; }}
            onkeydown={e => e.key === "Enter" && (editingTitle = true)}
          >
            {page.title || "Untitled"}
          </h1>
        {/if}
      </div>
    </div>

    <div class="editor-area">
      <CollabEditor {pageId} {roomId} />
    </div>
  {:else}
    <div class="empty">Select a page from the sidebar</div>
  {/if}
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .loading, .error, .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .error { color: var(--color-danger); }

  .page-header {
    flex-shrink: 0;
  }

  .cover {
    height: 200px;
    background-size: cover;
    background-position: center;
    background-color: var(--color-surface);
  }

  .page-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 96px 8px;
  }

  .page-icon-large {
    font-size: 2.5rem;
    line-height: 1;
  }

  .page-title {
    font-size: 2.25rem;
    font-weight: 700;
    flex: 1;
    cursor: text;
    outline: none;
  }

  .page-title:hover {
    background: rgba(55 53 47 / 0.04);
    border-radius: 4px;
  }

  .title-input {
    font-size: 2.25rem;
    font-weight: 700;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text);
    font-family: inherit;
    width: 100%;
  }

  .editor-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 768px) {
    .page-meta {
      padding: 16px 16px 8px;
    }
  }
</style>
