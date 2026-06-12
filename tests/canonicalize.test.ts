import { describe, it, expect } from 'vitest';
import { canonicalize } from '../src/canonical/canonicalize';
import type { Component, TechniqueStep } from '../src/types';

const negroni: Component[] = [
  { ingredientId: 'gin', role: 'base', bucket: 'full' },
  { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
  { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
];

describe('canonicalize', () => {
  it('is invariant to component order (transposition)', () => {
    const shuffled = [negroni[2], negroni[0], negroni[1]];
    expect(canonicalize(shuffled)).toBe(canonicalize(negroni));
  });

  it('ignores garnish, ice, and bucket', () => {
    const withGarnish: Component[] = [
      ...negroni,
      { ingredientId: 'orange_peel', role: 'garnish', bucket: 'accent' },
    ];
    const differentBuckets: Component[] = negroni.map((c) => ({ ...c, bucket: 'part' as const }));
    expect(canonicalize(withGarnish)).toBe(canonicalize(negroni));
    expect(canonicalize(differentBuckets)).toBe(canonicalize(negroni));
  });

  it('ignores non-identity-affecting techniques', () => {
    const stirred: TechniqueStep[] = [{ seq: 1, verb: 'stir' }];
    const shaken: TechniqueStep[] = [{ seq: 1, verb: 'shake' }];
    expect(canonicalize(negroni, stirred)).toBe(canonicalize(negroni, shaken));
  });

  it('distinguishes identity-affecting techniques (smoke)', () => {
    const smoked: TechniqueStep[] = [{ seq: 1, verb: 'smoke' }];
    expect(canonicalize(negroni, smoked)).not.toBe(canonicalize(negroni));
  });

  it('distinguishes a base-ingredient swap', () => {
    const boulevardier = negroni.map((c) =>
      c.role === 'base' ? { ...c, ingredientId: 'bourbon' } : c,
    );
    expect(canonicalize(boulevardier)).not.toBe(canonicalize(negroni));
  });
});
