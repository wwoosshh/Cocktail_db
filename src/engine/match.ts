import { type Cocktail, type Combination } from '../types';
import { canonicalize } from '../canonical/canonicalize';
import type { EngineIndex } from './index-build';

export interface IdentifyResult {
  status: 'exact' | 'miss';
  matches: Cocktail[];
}

export function identify(combo: Combination, index: EngineIndex): IdentifyResult {
  const hash = canonicalize(combo.components, combo.techniques ?? []);
  const matches = index.identityMap.get(hash) ?? [];
  return { status: matches.length > 0 ? 'exact' : 'miss', matches };
}
