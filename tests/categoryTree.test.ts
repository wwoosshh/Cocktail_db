import { describe, it, expect } from 'vitest';
import { CategoryTree, type CategoryNode } from '../src/ingredients/categoryTree';

const NODES: CategoryNode[] = [
  { id: 'spirits', parentId: null },
  { id: 'whisky', parentId: 'spirits' },
  { id: 'bourbon', parentId: 'whisky' },
  { id: 'rye', parentId: 'whisky' },
  { id: 'gin', parentId: 'spirits' },
  { id: 'bitter_liqueur', parentId: 'spirits' },
  { id: 'campari', parentId: 'bitter_liqueur' },
  { id: 'aperol', parentId: 'bitter_liqueur' },
];

describe('CategoryTree.distance', () => {
  const tree = new CategoryTree(NODES);

  it('same node is 0', () => {
    expect(tree.distance('bourbon', 'bourbon')).toBe(0);
  });

  it('siblings are 2', () => {
    expect(tree.distance('bourbon', 'rye')).toBe(2);
    expect(tree.distance('campari', 'aperol')).toBe(2);
  });

  it('cousins across categories are farther', () => {
    expect(tree.distance('bourbon', 'gin')).toBe(3);
    expect(tree.distance('campari', 'gin')).toBe(3);
  });

  it('unknown node is Infinity', () => {
    expect(tree.distance('bourbon', 'nonexistent')).toBe(Infinity);
  });
});
