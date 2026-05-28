import { api } from "$lib/api";
import type { Workspace, Page } from "@shared/types";

export interface PageNode extends Page {
  children: PageNode[];
}

function buildTree(flat: Page[]): PageNode[] {
  const map = new Map<string, PageNode>();
  const roots: PageNode[] = [];
  for (const p of flat) map.set(p.id, { ...p, children: [] });
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

class WorkspaceStore {
  workspaces = $state<Workspace[]>([]);
  currentWorkspace = $state<Workspace | null>(null);
  pages = $state<Page[]>([]);
  loading = $state(false);

  get pageTree(): PageNode[] {
    return buildTree(this.pages);
  }

  async fetchWorkspaces(): Promise<void> {
    this.loading = true;
    try {
      const { data, error } = await api.api.workspaces.get();
      if (error) throw error;
      this.workspaces = (data?.workspaces ?? []) as Workspace[];
      if (this.workspaces.length > 0 && !this.currentWorkspace) {
        this.currentWorkspace = this.workspaces[0]!;
        await this.fetchPages(this.currentWorkspace.id);
      }
    } finally {
      this.loading = false;
    }
  }

  async selectWorkspace(ws: Workspace): Promise<void> {
    this.currentWorkspace = ws;
    await this.fetchPages(ws.id);
  }

  async fetchPages(workspaceId: string): Promise<void> {
    const { data, error } = await api.api.pages["workspace/:workspaceId"]({ workspaceId }).get();
    if (error) throw error;
    this.pages = (data?.pages ?? []) as Page[];
  }

  async createPage(input: { workspaceId: string; title: string; parentId?: string }): Promise<Page> {
    const { data, error } = await api.api.pages.post(input);
    if (error) throw error;
    const page = data!.page as Page;
    this.pages = [...this.pages, page];
    return page;
  }

  async deletePage(id: string): Promise<void> {
    const { error } = await api.api.pages({ id }).delete();
    if (error) throw error;
    this.pages = this.pages.filter(p => p.id !== id);
  }
}

export const workspaceStore = new WorkspaceStore();
