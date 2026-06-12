import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { explore } from '../src/engine/match';
import { SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const index = buildIndex(SEED_COCKTAILS);

describe('explore', () => {
  it('lists Negroni as completable from {gin, campari} with sweet_vermouth missing', () => {
    const partial: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    };
    const candidates = explore(partial, index);
    const negroni = candidates.find((c) => c.cocktail.id === 'negroni');
    expect(negroni).toBeDefined();
    expect(negroni!.missing.map((m) => m.ingredientId)).toEqual(['sweet_vermouth']);
  });

  it('excludes cocktails that lack a partial ingredient', () => {
    const partial: Combination = {
      components: [{ ingredientId: 'gin', role: 'base', bucket: 'full' }],
    };
    const ids = explore(partial, index).map((c) => c.cocktail.id);
    expect(ids).toContain('negroni');
    expect(ids).not.toContain('boulevardier'); // boulevardier has no gin
  });
});
