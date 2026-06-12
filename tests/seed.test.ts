import { describe, it, expect } from 'vitest';
import { SEED_TREE, SEED_INGREDIENTS, SEED_COCKTAILS } from '../src/data/seed';
import { LIQUID_BUILD_ROLES } from '../src/types';

describe('seed dataset integrity', () => {
  const ingredientIds = new Set(SEED_INGREDIENTS.map((i) => i.id));
  const treeIds = new Set(SEED_TREE.map((n) => n.id));

  it('every ingredient is a node in the tree', () => {
    for (const id of ingredientIds) expect(treeIds.has(id)).toBe(true);
  });

  it('every cocktail component references a known ingredient', () => {
    for (const ck of SEED_COCKTAILS) {
      for (const c of ck.components) {
        expect(ingredientIds.has(c.ingredientId)).toBe(true);
      }
    }
  });

  it('contains Negroni and Boulevardier', () => {
    const names = SEED_COCKTAILS.map((c) => c.id);
    expect(names).toContain('negroni');
    expect(names).toContain('boulevardier');
  });

  it('Negroni and Boulevardier differ only by base ingredient', () => {
    const liquid = (id: string) =>
      SEED_COCKTAILS.find((c) => c.id === id)!.components
        .filter((c) => LIQUID_BUILD_ROLES.has(c.role))
        .map((c) => `${c.role}:${c.ingredientId}`)
        .sort();
    const neg = liquid('negroni');
    const boul = liquid('boulevardier');
    expect(neg).toContain('base:gin');
    expect(boul).toContain('base:bourbon');
    expect(neg.filter((x) => !x.startsWith('base:'))).toEqual(
      boul.filter((x) => !x.startsWith('base:')),
    );
  });
});
