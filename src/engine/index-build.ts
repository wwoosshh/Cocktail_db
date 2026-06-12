import type { Cocktail } from '../types';
import { canonicalize } from '../canonical/canonicalize';

export interface EngineIndex {
  identityMap: Map<string, Cocktail[]>;
  inverted: Map<string, Set<string>>;
  cocktails: Cocktail[];
}

export function buildIndex(cocktails: Cocktail[]): EngineIndex {
  const identityMap = new Map<string, Cocktail[]>();
  const inverted = new Map<string, Set<string>>();

  for (const ck of cocktails) {
    const hash = canonicalize(ck.components, ck.techniques);
    ck.identityHash = hash;

    if (!identityMap.has(hash)) identityMap.set(hash, []);
    identityMap.get(hash)!.push(ck);

    for (const c of ck.components) {
      if (!inverted.has(c.ingredientId)) inverted.set(c.ingredientId, new Set());
      inverted.get(c.ingredientId)!.add(ck.id);
    }
  }

  return { identityMap, inverted, cocktails };
}
