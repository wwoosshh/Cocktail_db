import { describe, it, expect } from 'vitest';
import { distance } from '../src/engine/distance';
import { CategoryTree } from '../src/ingredients/categoryTree';
import { SEED_TREE, SEED_COCKTAILS } from '../src/data/seed';
import type { Component } from '../src/types';

const tree = new CategoryTree(SEED_TREE);
const td = (a: string, b: string) => tree.distance(a, b);
const comp = (id: string) => SEED_COCKTAILS.find((c) => c.id === id)!.components;

describe('distance', () => {
  it('is zero for identical compositions', () => {
    expect(distance(comp('negroni'), comp('negroni'), td)).toBe(0);
  });

  it('equals the single base-swap tree distance for Negroni vs Boulevardier', () => {
    // gin -> bourbon is tree distance 3; modifiers identical
    expect(distance(comp('negroni'), comp('boulevardier'), td)).toBe(3);
  });

  it('is symmetric', () => {
    const a = distance(comp('negroni'), comp('boulevardier'), td);
    const b = distance(comp('boulevardier'), comp('negroni'), td);
    expect(a).toBe(b);
  });

  it('penalizes an extra ingredient', () => {
    const negroniPlus: Component[] = [
      ...comp('negroni'),
      { ingredientId: 'orange_bitters', role: 'bitters', bucket: 'dash' },
    ];
    expect(distance(comp('negroni'), negroniPlus, td)).toBe(10);
  });
});
