import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { canonicalize } from '../src/canonical/canonicalize';
import { SEED_COCKTAILS } from '../src/data/seed';

describe('buildIndex', () => {
  const index = buildIndex(SEED_COCKTAILS);

  it('maps each identity hash to its cocktail', () => {
    const negroni = SEED_COCKTAILS.find((c) => c.id === 'negroni')!;
    const hash = canonicalize(negroni.components, negroni.techniques);
    const matched = index.identityMap.get(hash) ?? [];
    expect(matched.map((c) => c.id)).toContain('negroni');
  });

  it('builds an inverted ingredient index', () => {
    expect([...(index.inverted.get('campari') ?? [])].sort()).toEqual(
      ['americano', 'boulevardier', 'negroni'],
    );
  });

  it('annotates each cocktail with its identityHash', () => {
    for (const ck of index.cocktails) {
      expect(typeof ck.identityHash).toBe('string');
    }
  });
});
