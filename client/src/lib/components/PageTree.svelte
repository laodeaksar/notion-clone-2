<script lang="ts">
  import type { PageNode } from "$lib/stores/workspace.store";

  interface Props {
    nodes: PageNode[];
    depth?: number;
    currentPageId?: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }

  let { nodes, depth = 0, currentPageId, onSelect, onDelete }: Props = $props();

  let expanded = $state<Set<string>>(new Set());

  function toggle(id: string) {
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    expanded = new Set(expanded);
  }
</script>

{#each nodes as node (node.id)}
  <div class="tree-node" style:padding-left="{depth * 16}px">
    <div
      class="tree-item"
      class:active={currentPageId === node.id}
      role="button"
      tabindex="0"
      onclick={() => onSelect(node.id)}
      onkeydown={e => e.key === "Enter" && onSelect(node.id)}
    >
      {#if node.children.length > 0}
        <button
          class="toggle-btn"
          onclick={e => { e.stopPropagation(); toggle(node.id); }}
          aria-label={expanded.has(node.id) ? "Collapse" : "Expand"}
        >
          {expanded.has(node.id) ? "▾" : "▸"}
        </button>
      {:else}
        <span class="toggle-placeholder"></span>
      {/if}

      <span class="page-icon">{node.icon ?? "📄"}</span>
      <span class="page-title">{node.title || "Untitled"}</span>

      <button
        class="delete-btn"
        onclick={e => { e.stopPropagation(); onDelete(node.id); }}
        aria-label="Delete page"
        title="Delete"
      >✕</button>
    </div>

    {#if expanded.has(node.id) && node.children.length > 0}
      <svelte:self
        nodes={node.children}
        depth={depth + 1}
        {currentPageId}
        {onSelect}
        {onDelete}
      />
    {/if}
  </div>
{/each}

<style>
  .tree-node {
    display: flex;
    flex-direction: column;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px 3px 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: var(--color-text);
    user-select: none;
    position: relative;
  }

  .tree-item:hover {
    background: rgba(55 53 47 / 0.06);
  }

  .tree-item:hover .delete-btn {
    opacity: 1;
  }

  .tree-item.active {
    background: rgba(35 131 226 / 0.1);
    color: var(--color-accent);
  }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--color-text-muted);
    flex-shrink: 0;
    padding: 0;
  }

  .toggle-placeholder {
    width: 16px;
    flex-shrink: 0;
  }

  .page-icon {
    font-size: 13px;
    flex-shrink: 0;
  }

  .page-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0;
    color: var(--color-text-muted);
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
    transition: opacity 0.1s;
  }

  .delete-btn:hover {
    background: rgba(235 87 87 / 0.1);
    color: var(--color-danger);
  }
</style>
