import { describe, it, expect } from 'vitest';
import { CocktailEngine } from '../src/index';
import { SEED_TREE, SEED_INGREDIENTS, SEED_COCKTAILS } from '../src/data/seed';

const engine = new CocktailEngine({
  cocktails: SEED_COCKTAILS,
  tree: SEED_TREE,
  ingredients: SEED_INGREDIENTS,
});

const negroniComponents = [
  { ingredientId: 'gin', role: 'base', bucket: 'full' },
  { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
  { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
] as const;

describe('CocktailEngine facade', () => {
  it('identifies', () => {
    const r = engine.identify({ components: [...negroniComponents] });
    expect(r.status).toBe('exact');
    expect(r.matches.map((c) => c.id)).toContain('negroni');
  });

  it('explores', () => {
    const r = engine.explore({
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    });
    expect(r.find((c) => c.cocktail.id === 'negroni')).toBeDefined();
  });

  it('swaps', () => {
    const r = engine.swap({ components: [...negroniComponents] }, 0, 'bourbon');
    expect(r.status).toBe('exact');
  });

  it('finds nearest', () => {
    const r = engine.nearest({
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    });
    expect(r[0].cocktail.id).toBe('negroni');
  });

  it('normalizes an ingredient string', () => {
    expect(engine.normalizeIngredient('tanqueray')).toEqual({ status: 'ok', id: 'gin' });
  });
});
