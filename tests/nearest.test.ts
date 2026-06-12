import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { nearest } from '../src/engine/match';
import { CategoryTree } from '../src/ingredients/categoryTree';
import { SEED_TREE, SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const tree = new CategoryTree(SEED_TREE);
const td = (a: string, b: string) => tree.distance(a, b);
const index = buildIndex(SEED_COCKTAILS);

describe('nearest', () => {
  it('ranks Negroni as nearest to an aperol-for-campari swap', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    const results = nearest(combo, index, td, 3);
    expect(results[0].cocktail.id).toBe('negroni');
    expect(results[0].distance).toBe(2); // aperol<->campari sibling distance
  });

  it('reports the swapped ingredient in the diff', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    const top = nearest(combo, index, td, 1)[0];
    expect(top.diff.swapped).toContainEqual({ role: 'modifier', from: 'aperol', to: 'campari' });
  });
});
