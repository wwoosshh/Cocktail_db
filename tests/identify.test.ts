import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { identify } from '../src/engine/match';
import { SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

describe('identify', () => {
  const index = buildIndex(SEED_COCKTAILS);

  it('exactly identifies a Negroni regardless of pour order', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    };
    const r = identify(combo, index);
    expect(r.status).toBe('exact');
    expect(r.matches.map((c) => c.id)).toContain('negroni');
  });

  it('returns miss for an unknown combination', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    expect(identify(combo, index).status).toBe('miss');
  });
});
