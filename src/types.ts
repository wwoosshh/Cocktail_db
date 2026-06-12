export type Role =
  | 'base'
  | 'modifier'
  | 'sweet'
  | 'sour'
  | 'bitters'
  | 'lengthener'
  | 'garnish';

export type Bucket = 'dash' | 'accent' | 'part' | 'full' | 'top';

export type TechniqueVerb =
  | 'build'
  | 'stir'
  | 'shake'
  | 'dry-shake'
  | 'muddle'
  | 'strain'
  | 'double-strain'
  | 'top'
  | 'float'
  | 'garnish'
  | 'smoke'
  | 'flame'
  | 'rinse';

export type Ice = 'none' | 'cubed' | 'crushed' | 'large';

export interface Component {
  ingredientId: string;
  role: Role;
  bucket: Bucket;
}

export interface TechniqueStep {
  seq: number;
  verb: TechniqueVerb;
}

export interface Cocktail {
  id: string;
  name: string;
  aliases: string[];
  components: Component[];
  techniques: TechniqueStep[];
  glass: string;
  ice: Ice;
  origin?: string;
  era?: string;
  source?: string;
  notes?: string;
  identityHash?: string;
}

export interface Combination {
  components: Component[];
  techniques?: TechniqueStep[];
}

export const LIQUID_BUILD_ROLES: ReadonlySet<Role> = new Set<Role>([
  'base',
  'modifier',
  'sweet',
  'sour',
  'bitters',
  'lengthener',
]);

export const IDENTITY_AFFECTING_TECHNIQUES: ReadonlySet<TechniqueVerb> = new Set<TechniqueVerb>([
  'smoke',
  'muddle',
  'flame',
  'rinse',
]);
