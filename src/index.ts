export * from './types';
export { CategoryTree } from './ingredients/categoryTree';
export type { CategoryNode } from './ingredients/categoryTree';
export { IngredientRegistry } from './ingredients/registry';
export type { Ingredient, NormalizeResult } from './ingredients/registry';
export { canonicalize } from './canonical/canonicalize';
export { buildIndex } from './engine/index-build';
export type { EngineIndex } from './engine/index-build';
export { distance } from './engine/distance';
export type { TreeDistanceFn } from './engine/distance';
export {
  identify,
  nearest,
  swap,
  explore,
  computeDiff,
} from './engine/match';
export type {
  IdentifyResult,
  NearestResult,
  SwapResult,
  ExploreCandidate,
  Diff,
} from './engine/match';
export { CocktailEngine } from './engine/Engine';
export type { EngineOptions } from './engine/Engine';
