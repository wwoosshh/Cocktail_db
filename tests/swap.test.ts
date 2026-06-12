import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { swap } from '../src/engine/match';
import { CategoryTree } from '../src/ingredients/categoryTree';
import { SEED_TREE, SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const tree = new CategoryTree(SEED_TREE);
const td = (a: string, b: string) => tree.distance(a, b);
const index = buildIndex(SEED_COCKTAILS);

const negroni: Combination = {
  components: [
    { ingredientId: 'gin', role: 'base', bucket: 'full' },
    { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
    { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
  ],
};

describe('swap', () => {
  it('turns a Negroni into a Boulevardier when base gin -> bourbon', () => {
    const baseIdx = negroni.components.findIndex((c) => c.role === 'base');
    const r = swap(negroni, baseIdx, 'bourbon', index, td);
    expect(r.status).toBe('exact');
    if (r.status === 'exact') {
      expect(r.matches.map((c) => c.id)).toContain('boulevardier');
    }
  });

  it('falls back to nearest when the swap has no named match', () => {
    const modIdx = negroni.components.findIndex((c) => c.ingredientId === 'campari');
    const r = swap(negroni, modIdx, 'aperol', index, td);
    expect(r.status).toBe('miss');
    if (r.status === 'miss') {
      expect(r.nearest[0].cocktail.id).toBe('negroni');
    }
  });
});
