export interface CategoryNode {
  id: string;
  parentId: string | null;
}

export class CategoryTree {
  private parent = new Map<string, string | null>();

  constructor(nodes: CategoryNode[]) {
    for (const n of nodes) this.parent.set(n.id, n.parentId);
  }

  private ancestors(id: string): string[] | null {
    if (!this.parent.has(id)) return null;
    const path: string[] = [];
    let cur: string | null | undefined = id;
    while (cur != null) {
      path.push(cur);
      cur = this.parent.get(cur);
    }
    return path;
  }

  distance(a: string, b: string): number {
    if (a === b) return this.parent.has(a) ? 0 : Infinity;
    const pa = this.ancestors(a);
    const pb = this.ancestors(b);
    if (!pa || !pb) return Infinity;
    const idxB = new Map<string, number>();
    pb.forEach((id, i) => idxB.set(id, i));
    for (let i = 0; i < pa.length; i++) {
      const j = idxB.get(pa[i]);
      if (j !== undefined) return i + j;
    }
    return Infinity;
  }
}
