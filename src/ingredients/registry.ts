import type { Role } from '../types';

export interface Ingredient {
  id: string;
  canonicalName: string;
  synonyms: string[];
  brandAliases: string[];
  defaultRole: Role;
}

export type NormalizeResult =
  | { status: 'ok'; id: string }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'unknown'; suggestions: string[] };

export class IngredientRegistry {
  private byKey = new Map<string, Set<string>>();
  private ingredients = new Map<string, Ingredient>();

  constructor(items: Ingredient[]) {
    for (const ing of items) {
      this.ingredients.set(ing.id, ing);
      const keys = [ing.canonicalName, ...ing.synonyms, ...ing.brandAliases, ing.id];
      for (const k of keys) this.add(k, ing.id);
    }
  }

  private norm(s: string): string {
    return s.trim().toLowerCase();
  }

  private add(key: string, id: string): void {
    const n = this.norm(key);
    if (!this.byKey.has(n)) this.byKey.set(n, new Set());
    this.byKey.get(n)!.add(id);
  }

  get(id: string): Ingredient | undefined {
    return this.ingredients.get(id);
  }

  normalize(input: string): NormalizeResult {
    const n = this.norm(input);
    const hit = this.byKey.get(n);
    if (hit && hit.size === 1) return { status: 'ok', id: [...hit][0] };
    if (hit && hit.size > 1) return { status: 'ambiguous', candidates: [...hit].sort() };

    const suggestions = [...this.ingredients.values()]
      .filter((ing) => {
        const cn = ing.canonicalName.toLowerCase();
        return cn.includes(n) || n.includes(cn);
      })
      .map((ing) => ing.id)
      .sort();
    return { status: 'unknown', suggestions };
  }
}
