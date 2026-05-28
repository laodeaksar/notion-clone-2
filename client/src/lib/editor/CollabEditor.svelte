<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Collaboration from "@tiptap/extension-collaboration";
  import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
  import Placeholder from "@tiptap/extension-placeholder";
  import Image from "@tiptap/extension-image";
  import { createClient } from "@liveblocks/client";
  import LiveblocksProvider from "@liveblocks/yjs";
  import * as Y from "yjs";
  import { authState } from "$lib/stores/auth.store";

  interface Props {
    pageId: string;
    roomId: string;
  }

  let { pageId, roomId }: Props = $props();

  let editorContainer = $state<HTMLDivElement | null>(null);
  let editor = $state<Editor | null>(null);
  let isConnected = $state(false);

  const liveblocksClient = createClient({
    authEndpoint: async (room: string) => {
      const res = await fetch("/api/blocks/liveblocks-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ room }),
      });
      return res.json() as Promise<{ token: string }>;
    },
  });

  onMount(() => {
    if (!editorContainer) return;

    const ydoc = new Y.Doc();
    const { room, leave } = liveblocksClient.enterRoom(roomId);
    const provider = new LiveblocksProvider(room, ydoc);

    provider.on("sync", (synced: boolean) => { isConnected = synced; });

    const instance = new Editor({
      element: editorContainer,
      extensions: [
        StarterKit.configure({ history: false }),
        Image,
        Placeholder.configure({ placeholder: "Start writing…" }),
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({
          provider,
          user: {
            name: authState.user?.name ?? "Anonymous",
            color: `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`,
          },
        }),
      ],
      editorProps: {
        attributes: { class: "tiptap" },
      },
    });

    editor = instance;

    return () => {
      instance.destroy();
      provider.destroy();
      ydoc.destroy();
      leave();
    };
  });

  function cmd(action: () => boolean | void) {
    return (e: MouseEvent) => {
      e.preventDefault();
      action();
    };
  }
</script>

<div class="editor-wrapper">
  <div class="toolbar" role="toolbar" aria-label="Text formatting">
    {#if editor}
      <button
        class="tb" class:active={editor.isActive("bold")}
        onmousedown={cmd(() => editor?.chain().focus().toggleBold().run())}
        title="Bold">
        <strong>B</strong>
      </button>
      <button
        class="tb" class:active={editor.isActive("italic")}
        onmousedown={cmd(() => editor?.chain().focus().toggleItalic().run())}
        title="Italic">
        <em>I</em>
      </button>
      <button
        class="tb" class:active={editor.isActive("strike")}
        onmousedown={cmd(() => editor?.chain().focus().toggleStrike().run())}
        title="Strikethrough">
        <s>S</s>
      </button>
      <button
        class="tb" class:active={editor.isActive("code")}
        onmousedown={cmd(() => editor?.chain().focus().toggleCode().run())}
        title="Inline code">
        <code>`</code>
      </button>
      <span class="sep"></span>
      {#each [1, 2, 3] as level}
        <button
          class="tb" class:active={editor.isActive("heading", { level })}
          onmousedown={cmd(() => editor?.chain().focus().toggleHeading({ level: level as 1|2|3 }).run())}
          title="Heading {level}">
          H{level}
        </button>
      {/each}
      <span class="sep"></span>
      <button
        class="tb" class:active={editor.isActive("bulletList")}
        onmousedown={cmd(() => editor?.chain().focus().toggleBulletList().run())}
        title="Bullet list">
        • List
      </button>
      <button
        class="tb" class:active={editor.isActive("orderedList")}
        onmousedown={cmd(() => editor?.chain().focus().toggleOrderedList().run())}
        title="Ordered list">
        1. List
      </button>
      <button
        class="tb" class:active={editor.isActive("codeBlock")}
        onmousedown={cmd(() => editor?.chain().focus().toggleCodeBlock().run())}
        title="Code block">
        { "</>" }
      </button>
      <button
        class="tb"
        onmousedown={cmd(() => editor?.chain().focus().setHorizontalRule().run())}
        title="Divider">
        —
      </button>
    {/if}
    <span class="ml-auto flex items-center gap-2">
      <span class="dot" class:live={isConnected}></span>
      <span class="status-text">{isConnected ? "Live" : "Connecting…"}</span>
    </span>
  </div>

  <div bind:this={editorContainer} class="editor-content"></div>
</div>

<style>
  .editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .tb {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    color: var(--color-text);
    transition: background 0.1s;
  }

  .tb:hover { background: rgba(55 53 47 / 0.08); }
  .tb.active {
    background: rgba(35 131 226 / 0.12);
    color: var(--color-accent);
  }

  .sep {
    width: 1px;
    height: 18px;
    background: var(--color-border);
    margin: 0 4px;
    flex-shrink: 0;
  }

  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 48px 10%;
  }

  .ml-auto { margin-left: auto; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .gap-2 { gap: 8px; }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-text-muted);
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .dot.live { background: #22c55e; }

  .status-text {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  @media (max-width: 768px) {
    .editor-content { padding: 24px 16px; }
  }
</style>
