import { type Cocktail, type Combination, type Component, type Role, LIQUID_BUILD_ROLES } from '../types';
import { canonicalize } from '../canonical/canonicalize';
import type { EngineIndex } from './index-build';
import { distance, type TreeDistanceFn } from './distance';

export interface IdentifyResult {
  status: 'exact' | 'miss';
  matches: Cocktail[];
}

export function identify(combo: Combination, index: EngineIndex): IdentifyResult {
  const hash = canonicalize(combo.components, combo.techniques ?? []);
  const matches = index.identityMap.get(hash) ?? [];
  return { status: matches.length > 0 ? 'exact' : 'miss', matches };
}

export interface Diff {
  missing: Component[];
  extra: Component[];
  swapped: { role: Role; from: string; to: string }[];
}

export interface NearestResult {
  cocktail: Cocktail;
  distance: number;
  diff: Diff;
}

function liquidByRole(components: Component[]): Map<Role, Component[]> {
  const m = new Map<Role, Component[]>();
  for (const c of components) {
    if (!LIQUID_BUILD_ROLES.has(c.role)) continue;
    if (!m.has(c.role)) m.set(c.role, []);
    m.get(c.role)!.push(c);
  }
  return m;
}

// diff from combo's perspective toward target cocktail
export function computeDiff(combo: Component[], target: Component[]): Diff {
  const ma = liquidByRole(combo);
  const mb = liquidByRole(target);
  const roles = new Set<Role>([...ma.keys(), ...mb.keys()]);

  const diff: Diff = { missing: [], extra: [], swapped: [] };
  for (const role of roles) {
    let listA = [...(ma.get(role) ?? [])];
    let listB = [...(mb.get(role) ?? [])];

    // remove exact ingredient matches
    for (const ca of [...listA]) {
      const j = listB.findIndex((cb) => cb.ingredientId === ca.ingredientId);
      if (j >= 0) {
        listA = listA.filter((x) => x !== ca);
        listB.splice(j, 1);
      }
    }

    // pair remaining same-role as swaps (deterministic order)
    listA.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    listB.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    while (listA.length > 0 && listB.length > 0) {
      const from = listA.shift()!;
      const to = listB.shift()!;
      diff.swapped.push({ role, from: from.ingredientId, to: to.ingredientId });
    }

    // leftovers
    diff.extra.push(...listA);
    diff.missing.push(...listB);
  }
  return diff;
}

export function nearest(
  combo: Combination,
  index: EngineIndex,
  td: TreeDistanceFn,
  k = 3,
): NearestResult[] {
  const candidateIds = new Set<string>();
  for (const c of combo.components) {
    for (const id of index.inverted.get(c.ingredientId) ?? []) candidateIds.add(id);
  }
  const pool = candidateIds.size > 0
    ? index.cocktails.filter((ck) => candidateIds.has(ck.id))
    : index.cocktails;

  const scored: NearestResult[] = pool.map((ck) => ({
    cocktail: ck,
    distance: distance(combo.components, ck.components, td),
    diff: computeDiff(combo.components, ck.components),
  }));

  scored.sort((x, y) => x.distance - y.distance || x.cocktail.name.localeCompare(y.cocktail.name));
  return scored.slice(0, k);
}

export type SwapResult =
  | { status: 'exact'; combination: Combination; matches: Cocktail[] }
  | { status: 'miss'; combination: Combination; nearest: NearestResult[] };

export function swap(
  combo: Combination,
  componentIndex: number,
  newIngredientId: string,
  index: EngineIndex,
  td: TreeDistanceFn,
): SwapResult {
  const newComponents = combo.components.map((c, i) =>
    i === componentIndex ? { ...c, ingredientId: newIngredientId } : c,
  );
  const newCombo: Combination = { components: newComponents, techniques: combo.techniques };

  const id = identify(newCombo, index);
  if (id.status === 'exact') {
    return { status: 'exact', combination: newCombo, matches: id.matches };
  }
  return { status: 'miss', combination: newCombo, nearest: nearest(newCombo, index, td) };
}
