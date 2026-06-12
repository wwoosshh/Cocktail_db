import type { Cocktail } from '../types';
import type { CategoryNode } from '../ingredients/categoryTree';
import type { Ingredient } from '../ingredients/registry';

export const SEED_TREE: CategoryNode[] = [
  { id: 'spirits', parentId: null },
  { id: 'whisky', parentId: 'spirits' },
  { id: 'bourbon', parentId: 'whisky' },
  { id: 'rye', parentId: 'whisky' },
  { id: 'scotch', parentId: 'whisky' },
  { id: 'gin', parentId: 'spirits' },
  { id: 'rum', parentId: 'spirits' },
  { id: 'bitter_liqueur', parentId: 'spirits' },
  { id: 'campari', parentId: 'bitter_liqueur' },
  { id: 'aperol', parentId: 'bitter_liqueur' },
  { id: 'fortified_wine', parentId: null },
  { id: 'sweet_vermouth', parentId: 'fortified_wine' },
  { id: 'dry_vermouth', parentId: 'fortified_wine' },
  { id: 'citrus', parentId: null },
  { id: 'lime_juice', parentId: 'citrus' },
  { id: 'lemon_juice', parentId: 'citrus' },
  { id: 'sweetener', parentId: null },
  { id: 'simple_syrup', parentId: 'sweetener' },
  { id: 'sugar', parentId: 'sweetener' },
  { id: 'bitters_group', parentId: null },
  { id: 'angostura', parentId: 'bitters_group' },
  { id: 'orange_bitters', parentId: 'bitters_group' },
  { id: 'lengthener', parentId: null },
  { id: 'soda_water', parentId: 'lengthener' },
  { id: 'tonic_water', parentId: 'lengthener' },
];

export const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'gin', canonicalName: 'Gin', synonyms: ['london dry'], brandAliases: ['tanqueray', 'beefeater'], defaultRole: 'base' },
  { id: 'bourbon', canonicalName: 'Bourbon', synonyms: ['bourbon whiskey'], brandAliases: ['buffalo trace'], defaultRole: 'base' },
  { id: 'rye', canonicalName: 'Rye', synonyms: ['rye whiskey'], brandAliases: ['rittenhouse'], defaultRole: 'base' },
  { id: 'scotch', canonicalName: 'Scotch', synonyms: ['scotch whisky'], brandAliases: [], defaultRole: 'base' },
  { id: 'rum', canonicalName: 'Rum', synonyms: ['white rum'], brandAliases: [], defaultRole: 'base' },
  { id: 'campari', canonicalName: 'Campari', synonyms: [], brandAliases: [], defaultRole: 'modifier' },
  { id: 'aperol', canonicalName: 'Aperol', synonyms: [], brandAliases: [], defaultRole: 'modifier' },
  { id: 'sweet_vermouth', canonicalName: 'Sweet Vermouth', synonyms: ['vermouth', 'rosso vermouth'], brandAliases: ['carpano'], defaultRole: 'modifier' },
  { id: 'dry_vermouth', canonicalName: 'Dry Vermouth', synonyms: ['vermouth', 'french vermouth'], brandAliases: ['dolin dry'], defaultRole: 'modifier' },
  { id: 'lime_juice', canonicalName: 'Lime Juice', synonyms: ['lime'], brandAliases: [], defaultRole: 'sour' },
  { id: 'lemon_juice', canonicalName: 'Lemon Juice', synonyms: ['lemon'], brandAliases: [], defaultRole: 'sour' },
  { id: 'simple_syrup', canonicalName: 'Simple Syrup', synonyms: ['sugar syrup'], brandAliases: [], defaultRole: 'sweet' },
  { id: 'sugar', canonicalName: 'Sugar', synonyms: ['sugar cube'], brandAliases: [], defaultRole: 'sweet' },
  { id: 'angostura', canonicalName: 'Angostura Bitters', synonyms: ['angostura'], brandAliases: [], defaultRole: 'bitters' },
  { id: 'orange_bitters', canonicalName: 'Orange Bitters', synonyms: [], brandAliases: [], defaultRole: 'bitters' },
  { id: 'soda_water', canonicalName: 'Soda Water', synonyms: ['soda', 'club soda'], brandAliases: [], defaultRole: 'lengthener' },
  { id: 'tonic_water', canonicalName: 'Tonic Water', synonyms: ['tonic'], brandAliases: [], defaultRole: 'lengthener' },
];

export const SEED_COCKTAILS: Cocktail[] = [
  {
    id: 'negroni', name: 'Negroni', aliases: [],
    components: [
      { ingredientId: 'gin', role: 'base', bucket: 'full' },
      { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
    ],
    techniques: [{ seq: 1, verb: 'stir' }, { seq: 2, verb: 'strain' }],
    glass: 'rocks', ice: 'large',
  },
  {
    id: 'boulevardier', name: 'Boulevardier', aliases: [],
    components: [
      { ingredientId: 'bourbon', role: 'base', bucket: 'full' },
      { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
    ],
    techniques: [{ seq: 1, verb: 'stir' }, { seq: 2, verb: 'strain' }],
    glass: 'rocks', ice: 'large',
  },
  {
    id: 'americano', name: 'Americano', aliases: [],
    components: [
      { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      { ingredientId: 'soda_water', role: 'lengthener', bucket: 'top' },
    ],
    techniques: [{ seq: 1, verb: 'build' }, { seq: 2, verb: 'top' }],
    glass: 'highball', ice: 'cubed',
  },
  {
    id: 'whisky_highball', name: 'Whisky Highball', aliases: ['highball'],
    components: [
      { ingredientId: 'scotch', role: 'base', bucket: 'full' },
      { ingredientId: 'soda_water', role: 'lengthener', bucket: 'top' },
    ],
    techniques: [{ seq: 1, verb: 'build' }, { seq: 2, verb: 'top' }],
    glass: 'highball', ice: 'cubed',
  },
  {
    id: 'old_fashioned', name: 'Old Fashioned', aliases: [],
    components: [
      { ingredientId: 'bourbon', role: 'base', bucket: 'full' },
      { ingredientId: 'simple_syrup', role: 'sweet', bucket: 'accent' },
      { ingredientId: 'angostura', role: 'bitters', bucket: 'dash' },
    ],
    techniques: [{ seq: 1, verb: 'stir' }, { seq: 2, verb: 'strain' }],
    glass: 'rocks', ice: 'large',
  },
  {
    id: 'daiquiri', name: 'Daiquiri', aliases: [],
    components: [
      { ingredientId: 'rum', role: 'base', bucket: 'full' },
      { ingredientId: 'lime_juice', role: 'sour', bucket: 'part' },
      { ingredientId: 'simple_syrup', role: 'sweet', bucket: 'part' },
    ],
    techniques: [{ seq: 1, verb: 'shake' }, { seq: 2, verb: 'double-strain' }],
    glass: 'coupe', ice: 'none',
  },
];
