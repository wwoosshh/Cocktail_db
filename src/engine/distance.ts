import { type Component, type Role, LIQUID_BUILD_ROLES } from '../types';

export type TreeDistanceFn = (a: string, b: string) => number;

const ADD_REMOVE_PENALTY = 10;
const BUCKET_DIFF = 0.5;

function groupByRole(components: Component[]): Map<Role, Component[]> {
  const m = new Map<Role, Component[]>();
  for (const c of components) {
    if (!LIQUID_BUILD_ROLES.has(c.role)) continue;
    if (!m.has(c.role)) m.set(c.role, []);
    m.get(c.role)!.push(c);
  }
  return m;
}

export function distance(a: Component[], b: Component[], td: TreeDistanceFn): number {
  const ma = groupByRole(a);
  const mb = groupByRole(b);
  const roles = new Set<Role>([...ma.keys(), ...mb.keys()]);

  let cost = 0;
  for (const role of roles) {
    let listA = [...(ma.get(role) ?? [])];
    let listB = [...(mb.get(role) ?? [])];

    // 1) exact ingredient matches (bucket diff only)
    for (const ca of [...listA]) {
      const j = listB.findIndex((cb) => cb.ingredientId === ca.ingredientId);
      if (j >= 0) {
        cost += ca.bucket === listB[j].bucket ? 0 : BUCKET_DIFF;
        listA = listA.filter((x) => x !== ca);
        listB.splice(j, 1);
      }
    }

    // 2) greedy nearest by tree distance (deterministic order)
    listA.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    for (const ca of [...listA]) {
      if (listB.length === 0) break;
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < listB.length; k++) {
        const d = td(ca.ingredientId, listB[k].ingredientId);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      cost += bestD === Infinity ? ADD_REMOVE_PENALTY * 2 : bestD;
      listA = listA.filter((x) => x !== ca);
      listB.splice(best, 1);
    }

    // 3) leftovers => add/remove penalty
    cost += (listA.length + listB.length) * ADD_REMOVE_PENALTY;
  }

  return cost;
}
