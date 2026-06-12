import type { Cocktail, Combination } from '../types';
import { CategoryTree, type CategoryNode } from '../ingredients/categoryTree';
import { IngredientRegistry, type Ingredient, type NormalizeResult } from '../ingredients/registry';
import { buildIndex, type EngineIndex } from './index-build';
import {
  identify,
  nearest,
  swap,
  explore,
  type IdentifyResult,
  type NearestResult,
  type SwapResult,
  type ExploreCandidate,
} from './match';

export interface EngineOptions {
  cocktails: Cocktail[];
  tree: CategoryNode[];
  ingredients: Ingredient[];
}

export class CocktailEngine {
  private index: EngineIndex;
  private tree: CategoryTree;
  private registry: IngredientRegistry;
  private td: (a: string, b: string) => number;

  constructor(opts: EngineOptions) {
    this.index = buildIndex(opts.cocktails);
    this.tree = new CategoryTree(opts.tree);
    this.registry = new IngredientRegistry(opts.ingredients);
    this.td = (a, b) => this.tree.distance(a, b);
  }

  identify(combo: Combination): IdentifyResult {
    return identify(combo, this.index);
  }

  explore(combo: Combination): ExploreCandidate[] {
    return explore(combo, this.index);
  }

  swap(combo: Combination, componentIndex: number, newIngredientId: string): SwapResult {
    return swap(combo, componentIndex, newIngredientId, this.index, this.td);
  }

  nearest(combo: Combination, k = 3): NearestResult[] {
    return nearest(combo, this.index, this.td, k);
  }

  normalizeIngredient(input: string): NormalizeResult {
    return this.registry.normalize(input);
  }
}
