import { api } from "$lib/api";
import type { Workspace, Page } from "@shared/types";

let workspaces = $state<Workspace[]>([]);
let currentWorkspace = $state<Workspace | null>(null);
let pages = $state<Page[]>([]);
let loading = $state(false);

export const workspaceStore = {
  get workspaces() { return workspaces; },
  get currentWorkspace() { return currentWorkspace; },
  get pages() { return pages; },
  get loading() { return loading; },
  get pageTree() {
    return buildTree(pages);
  },
};

export interface PageNode extends Page {
  children: PageNode[];
}

function buildTree(flat: Page[]): PageNode[] {
  const map = new Map<string, PageNode>();
  const roots: PageNode[] = [];

  for (const p of flat) {
    map.set(p.id, { ...p, children: [] });
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function fetchWorkspaces(): Promise<void> {
  loading = true;
  try {
    const { data, error } = await api.api.workspaces.get();
    if (error) throw error;
    workspaces = (data?.workspaces ?? []) as Workspace[];
    if (workspaces.length > 0 && !currentWorkspace) {
      currentWorkspace = workspaces[0]!;
      await fetchPages(currentWorkspace.id);
    }
  } finally {
    loading = false;
  }
}

export async function selectWorkspace(ws: Workspace): Promise<void> {
  currentWorkspace = ws;
  await fetchPages(ws.id);
}

export async function fetchPages(workspaceId: string): Promise<void> {
  const { data, error } = await api.api.pages["workspace/:workspaceId"]({ workspaceId }).get();
  if (error) throw error;
  pages = (data?.pages ?? []) as Page[];
}

export async function createPage(input: { workspaceId: string; title: string; parentId?: string }): Promise<Page> {
  const { data, error } = await api.api.pages.post(input);
  if (error) throw error;
  const page = data!.page as Page;
  pages = [...pages, page];
  return page;
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await api.api.pages({ id }).delete();
  if (error) throw error;
  pages = pages.filter(p => p.id !== id);
}
