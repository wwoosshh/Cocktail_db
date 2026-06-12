import { describe, it, expect } from 'vitest';
import { IngredientRegistry, type Ingredient } from '../src/ingredients/registry';

const ITEMS: Ingredient[] = [
  { id: 'gin', canonicalName: 'Gin', synonyms: ['london dry'], brandAliases: ['tanqueray'], defaultRole: 'base' },
  { id: 'sweet_vermouth', canonicalName: 'Sweet Vermouth', synonyms: ['vermouth'], brandAliases: [], defaultRole: 'modifier' },
  { id: 'dry_vermouth', canonicalName: 'Dry Vermouth', synonyms: ['vermouth'], brandAliases: [], defaultRole: 'modifier' },
];

describe('IngredientRegistry.normalize', () => {
  const reg = new IngredientRegistry(ITEMS);

  it('resolves canonical name (case-insensitive)', () => {
    expect(reg.normalize('GIN')).toEqual({ status: 'ok', id: 'gin' });
  });

  it('resolves a synonym and a brand alias', () => {
    expect(reg.normalize('London Dry')).toEqual({ status: 'ok', id: 'gin' });
    expect(reg.normalize('tanqueray')).toEqual({ status: 'ok', id: 'gin' });
  });

  it('flags ambiguous shared synonyms', () => {
    const r = reg.normalize('vermouth');
    expect(r.status).toBe('ambiguous');
    if (r.status === 'ambiguous') {
      expect(r.candidates).toEqual(['dry_vermouth', 'sweet_vermouth']);
    }
  });

  it('returns substring suggestions for unknown input', () => {
    const r = reg.normalize('gin tonic');
    expect(r.status).toBe('unknown');
    if (r.status === 'unknown') {
      expect(r.suggestions).toContain('gin');
    }
  });

  it('returns empty suggestions for fully unknown input', () => {
    const r = reg.normalize('xyzzy');
    expect(r).toEqual({ status: 'unknown', suggestions: [] });
  });
});
