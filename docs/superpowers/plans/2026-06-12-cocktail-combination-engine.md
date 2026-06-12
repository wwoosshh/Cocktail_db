# 칵테일 조합 대조 엔진 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이름 있는 칵테일 DB와 사용자 조합을 대조해 식별·탐색·치환·최근접을 수행하는 순수 TypeScript 엔진 모듈을 만든다 (ML 없음, 룩업·CPU 계산).

**Architecture:** 접근 A(정규형 해시 + 색인). 칵테일을 "조합 멀티셋 + 기법 수순"으로 정규화하고, 액상 빌드 역할만 정렬·해시해 트랜스포지션을 제거한다. 4가지 대조 동작(정확 식별 / 접두사 탐색 / 재료 치환 재조회 / 최근접 이웃)이 하나의 정규형 + 카테고리 트리거리 위에서 동작한다. 엔진은 DB·UI와 분리된 순수 함수 모듈이며, `CocktailEngine` facade가 추후 HTTP API/웹 UI가 얹힐 깔끔한 인터페이스를 제공한다.

**Tech Stack:** TypeScript (Node, ESM), Vitest. 외부 런타임 의존성 없음.

설계 문서: `docs/superpowers/specs/2026-06-12-cocktail-combination-engine-design.md`

---

## Task 1: 프로젝트 스캐폴드 + 툴체인

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Test: `tests/smoke.test.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "cocktail-engine",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"],
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: vitest.config.ts 작성**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { globals: true },
});
```

- [ ] **Step 4: 스모크 테스트 작성**

```ts
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 의존성 설치 후 테스트 실행 (PASS 확인)**

Run: `npm install` then `npx vitest run`
Expected: 1 passed (tests/smoke.test.ts)

- [ ] **Step 6: 커밋**

```bash
git add package.json tsconfig.json vitest.config.ts tests/smoke.test.ts package-lock.json
git commit -m "chore: scaffold TypeScript + Vitest toolchain"
```

---

## Task 2: 도메인 타입 + 상수 집합

**Files:**
- Create: `src/types.ts`
- Test: `tests/types.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  LIQUID_BUILD_ROLES,
  IDENTITY_AFFECTING_TECHNIQUES,
  type Component,
  type Cocktail,
} from '../src/types';

describe('domain constants', () => {
  it('liquid-build roles exclude garnish', () => {
    expect(LIQUID_BUILD_ROLES.has('base')).toBe(true);
    expect(LIQUID_BUILD_ROLES.has('lengthener')).toBe(true);
    expect(LIQUID_BUILD_ROLES.has('garnish')).toBe(false);
  });

  it('identity-affecting techniques include smoke but not stir', () => {
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('smoke')).toBe(true);
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('muddle')).toBe(true);
    expect(IDENTITY_AFFECTING_TECHNIQUES.has('stir')).toBe(false);
  });

  it('constructs a Cocktail value', () => {
    const c: Component = { ingredientId: 'gin', role: 'base', bucket: 'full' };
    const ck: Cocktail = {
      id: 'negroni',
      name: 'Negroni',
      aliases: [],
      components: [c],
      techniques: [{ seq: 1, verb: 'stir' }],
      glass: 'rocks',
      ice: 'large',
    };
    expect(ck.components[0].ingredientId).toBe('gin');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/types.test.ts`
Expected: FAIL ("Cannot find module '../src/types'")

- [ ] **Step 3: 최소 구현**

```ts
// src/types.ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/types.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/types.ts tests/types.test.ts
git commit -m "feat: add domain types and role/technique constant sets"
```

---

## Task 3: 카테고리 트리 + 트리거리

**Files:**
- Create: `src/ingredients/categoryTree.ts`
- Test: `tests/categoryTree.test.ts`

**메트릭 정의:** `distance(a, b)` = 트리에서 두 노드를 잇는 최단 경로의 **엣지 수**. 같은 노드 = 0. 형제(같은 부모) = 2. 연결 안 됨 = `Infinity`. 재료는 트리의 리프 노드이며, 카테고리 거리도 같은 함수로 계산된다.

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/categoryTree.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/categoryTree.test.ts`
Expected: FAIL ("Cannot find module '../src/ingredients/categoryTree'")

- [ ] **Step 3: 최소 구현**

```ts
// src/ingredients/categoryTree.ts
export interface CategoryNode {
  id: string;
  parentId: string | null;
}

export class CategoryTree {
  private parent = new Map<string, string | null>();

  constructor(nodes: CategoryNode[]) {
    for (const n of nodes) this.parent.set(n.id, n.parentId);
  }

  private ancestors(id: string): string[] | null {
    if (!this.parent.has(id)) return null;
    const path: string[] = [];
    let cur: string | null | undefined = id;
    while (cur != null) {
      path.push(cur);
      cur = this.parent.get(cur);
    }
    return path;
  }

  distance(a: string, b: string): number {
    if (a === b) return this.parent.has(a) ? 0 : Infinity;
    const pa = this.ancestors(a);
    const pb = this.ancestors(b);
    if (!pa || !pb) return Infinity;
    const idxB = new Map<string, number>();
    pb.forEach((id, i) => idxB.set(id, i));
    for (let i = 0; i < pa.length; i++) {
      const j = idxB.get(pa[i]);
      if (j !== undefined) return i + j;
    }
    return Infinity;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/categoryTree.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/ingredients/categoryTree.ts tests/categoryTree.test.ts
git commit -m "feat: add category tree with shortest-path ingredient distance"
```

---

## Task 4: 재료 레지스트리 + 정규화

**Files:**
- Create: `src/ingredients/registry.ts`
- Test: `tests/registry.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/registry.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/registry.test.ts`
Expected: FAIL ("Cannot find module '../src/ingredients/registry'")

- [ ] **Step 3: 최소 구현**

```ts
// src/ingredients/registry.ts
import type { Role } from '../types';

export interface Ingredient {
  id: string;
  canonicalName: string;
  synonyms: string[];
  brandAliases: string[];
  defaultRole: Role;
}

export type NormalizeResult =
  | { status: 'ok'; id: string }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'unknown'; suggestions: string[] };

export class IngredientRegistry {
  private byKey = new Map<string, Set<string>>();
  private ingredients = new Map<string, Ingredient>();

  constructor(items: Ingredient[]) {
    for (const ing of items) {
      this.ingredients.set(ing.id, ing);
      const keys = [ing.canonicalName, ...ing.synonyms, ...ing.brandAliases, ing.id];
      for (const k of keys) this.add(k, ing.id);
    }
  }

  private norm(s: string): string {
    return s.trim().toLowerCase();
  }

  private add(key: string, id: string): void {
    const n = this.norm(key);
    if (!this.byKey.has(n)) this.byKey.set(n, new Set());
    this.byKey.get(n)!.add(id);
  }

  get(id: string): Ingredient | undefined {
    return this.ingredients.get(id);
  }

  normalize(input: string): NormalizeResult {
    const n = this.norm(input);
    const hit = this.byKey.get(n);
    if (hit && hit.size === 1) return { status: 'ok', id: [...hit][0] };
    if (hit && hit.size > 1) return { status: 'ambiguous', candidates: [...hit].sort() };

    const suggestions = [...this.ingredients.values()]
      .filter((ing) => {
        const cn = ing.canonicalName.toLowerCase();
        return cn.includes(n) || n.includes(cn);
      })
      .map((ing) => ing.id)
      .sort();
    return { status: 'unknown', suggestions };
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/registry.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/ingredients/registry.ts tests/registry.test.ts
git commit -m "feat: add ingredient registry with synonym/brand normalization"
```

---

## Task 5: 시드 데이터셋 (트리·재료·칵테일)

**Files:**
- Create: `src/data/seed.ts`
- Test: `tests/seed.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/seed.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/seed.test.ts`
Expected: FAIL ("Cannot find module '../src/data/seed'")

- [ ] **Step 3: 최소 구현**

```ts
// src/data/seed.ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/seed.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/data/seed.ts tests/seed.test.ts
git commit -m "feat: add seed dataset (tree, ingredients, cocktails)"
```

---

## Task 6: 정규형 직렬화 + 정체성 해시

**Files:**
- Create: `src/canonical/canonicalize.ts`
- Test: `tests/canonicalize.test.ts`

**규칙:** 액상 빌드 역할(garnish 제외)만 사용, 분량버킷 제외, `role:ingredientId`로 정렬(멀티셋 — 중복 유지). 식별 영향 기법만 추가 정렬. 결과 직렬화 문자열이 곧 정체성 해시(키).

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/canonicalize.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/canonicalize.test.ts`
Expected: FAIL ("Cannot find module '../src/canonical/canonicalize'")

- [ ] **Step 3: 최소 구현**

```ts
// src/canonical/canonicalize.ts
import {
  type Component,
  type TechniqueStep,
  LIQUID_BUILD_ROLES,
  IDENTITY_AFFECTING_TECHNIQUES,
} from '../types';

export function canonicalize(
  components: Component[],
  techniques: TechniqueStep[] = [],
): string {
  const liquid = components
    .filter((c) => LIQUID_BUILD_ROLES.has(c.role))
    .map((c) => `${c.role}:${c.ingredientId}`)
    .sort();

  const idTech = techniques
    .filter((t) => IDENTITY_AFFECTING_TECHNIQUES.has(t.verb))
    .map((t) => t.verb)
    .sort();

  return `C[${liquid.join(',')}]|T[${idTech.join(',')}]`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/canonicalize.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/canonical/canonicalize.ts tests/canonicalize.test.ts
git commit -m "feat: add canonical serialization and identity hash"
```

---

## Task 7: 색인 빌더 (정체성 해시맵 + 역색인)

**Files:**
- Create: `src/engine/index-build.ts`
- Test: `tests/index-build.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/index-build.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { canonicalize } from '../src/canonical/canonicalize';
import { SEED_COCKTAILS } from '../src/data/seed';

describe('buildIndex', () => {
  const index = buildIndex(SEED_COCKTAILS);

  it('maps each identity hash to its cocktail', () => {
    const negroni = SEED_COCKTAILS.find((c) => c.id === 'negroni')!;
    const hash = canonicalize(negroni.components, negroni.techniques);
    const matched = index.identityMap.get(hash) ?? [];
    expect(matched.map((c) => c.id)).toContain('negroni');
  });

  it('builds an inverted ingredient index', () => {
    expect([...(index.inverted.get('campari') ?? [])].sort()).toEqual(
      ['americano', 'boulevardier', 'negroni'],
    );
  });

  it('annotates each cocktail with its identityHash', () => {
    for (const ck of index.cocktails) {
      expect(typeof ck.identityHash).toBe('string');
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/index-build.test.ts`
Expected: FAIL ("Cannot find module '../src/engine/index-build'")

- [ ] **Step 3: 최소 구현**

```ts
// src/engine/index-build.ts
import type { Cocktail } from '../types';
import { canonicalize } from '../canonical/canonicalize';

export interface EngineIndex {
  identityMap: Map<string, Cocktail[]>;
  inverted: Map<string, Set<string>>;
  cocktails: Cocktail[];
}

export function buildIndex(cocktails: Cocktail[]): EngineIndex {
  const identityMap = new Map<string, Cocktail[]>();
  const inverted = new Map<string, Set<string>>();

  for (const ck of cocktails) {
    const hash = canonicalize(ck.components, ck.techniques);
    ck.identityHash = hash;

    if (!identityMap.has(hash)) identityMap.set(hash, []);
    identityMap.get(hash)!.push(ck);

    for (const c of ck.components) {
      if (!inverted.has(c.ingredientId)) inverted.set(c.ingredientId, new Set());
      inverted.get(c.ingredientId)!.add(ck.id);
    }
  }

  return { identityMap, inverted, cocktails };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/index-build.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/index-build.ts tests/index-build.test.ts
git commit -m "feat: add index builder (identity map + inverted index)"
```

---

## Task 8: 정확 식별 (identify)

**Files:**
- Create: `src/engine/match.ts`
- Test: `tests/identify.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/identify.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { identify } from '../src/engine/match';
import { SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

describe('identify', () => {
  const index = buildIndex(SEED_COCKTAILS);

  it('exactly identifies a Negroni regardless of pour order', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    };
    const r = identify(combo, index);
    expect(r.status).toBe('exact');
    expect(r.matches.map((c) => c.id)).toContain('negroni');
  });

  it('returns miss for an unknown combination', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    expect(identify(combo, index).status).toBe('miss');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/identify.test.ts`
Expected: FAIL ("Cannot find module '../src/engine/match'")

- [ ] **Step 3: 최소 구현**

```ts
// src/engine/match.ts
import type { Cocktail, Combination } from '../types';
import { canonicalize } from '../canonical/canonicalize';
import type { EngineIndex } from './index-build';

export interface IdentifyResult {
  status: 'exact' | 'miss';
  matches: Cocktail[];
}

export function identify(combo: Combination, index: EngineIndex): IdentifyResult {
  const hash = canonicalize(combo.components, combo.techniques ?? []);
  const matches = index.identityMap.get(hash) ?? [];
  return { status: matches.length > 0 ? 'exact' : 'miss', matches };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/identify.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/match.ts tests/identify.test.ts
git commit -m "feat: add exact identification via identity-hash lookup"
```

---

## Task 9: 가중 집합 편집거리 (distance)

**Files:**
- Create: `src/engine/distance.ts`
- Test: `tests/distance.test.ts`

**비용 모델:** 액상 빌드 역할만 비교. 역할별로 (1) 동일 재료 우선 매칭(같으면 0, 버킷만 다르면 `BUCKET_DIFF`), (2) 남은 것은 트리거리로 그리디 최근접 매칭, (3) 매칭 안 된 잔여는 각 `ADD_REMOVE_PENALTY`. 상수: `ADD_REMOVE_PENALTY=10`, `BUCKET_DIFF=0.5`.

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/distance.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/distance.test.ts`
Expected: FAIL ("Cannot find module '../src/engine/distance'")

- [ ] **Step 3: 최소 구현**

```ts
// src/engine/distance.ts
import { type Component, type Role, LIQUID_BUILD_ROLES } from '../types';

export type TreeDistanceFn = (a: string, b: string) => number;

const ADD_REMOVE_PENALTY = 10;
const BUCKET_DIFF = 0.5;

function groupByRole(components: Component[]): Map<Role, Component[]> {
  const m = new Map<Role, Component[]>();
  for (const c of components) {
    if (!LIQUID_BUILD_ROLES.has(c.role)) continue;
    if (!m.has(c.role)) m.set(c.role, []);
    m.get(c.role)!.push(c);
  }
  return m;
}

export function distance(a: Component[], b: Component[], td: TreeDistanceFn): number {
  const ma = groupByRole(a);
  const mb = groupByRole(b);
  const roles = new Set<Role>([...ma.keys(), ...mb.keys()]);

  let cost = 0;
  for (const role of roles) {
    let listA = [...(ma.get(role) ?? [])];
    let listB = [...(mb.get(role) ?? [])];

    // 1) exact ingredient matches (bucket diff only)
    for (const ca of [...listA]) {
      const j = listB.findIndex((cb) => cb.ingredientId === ca.ingredientId);
      if (j >= 0) {
        cost += ca.bucket === listB[j].bucket ? 0 : BUCKET_DIFF;
        listA = listA.filter((x) => x !== ca);
        listB.splice(j, 1);
      }
    }

    // 2) greedy nearest by tree distance (deterministic order)
    listA.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    for (const ca of [...listA]) {
      if (listB.length === 0) break;
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < listB.length; k++) {
        const d = td(ca.ingredientId, listB[k].ingredientId);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      cost += bestD === Infinity ? ADD_REMOVE_PENALTY * 2 : bestD;
      listA = listA.filter((x) => x !== ca);
      listB.splice(best, 1);
    }

    // 3) leftovers => add/remove penalty
    cost += (listA.length + listB.length) * ADD_REMOVE_PENALTY;
  }

  return cost;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/distance.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/distance.ts tests/distance.test.ts
git commit -m "feat: add weighted set edit distance over compositions"
```

---

## Task 10: 최근접 이웃 (nearest) + diff

**Files:**
- Modify: `src/engine/match.ts` (append `computeDiff`, `nearest`, related types)
- Test: `tests/nearest.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/nearest.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { nearest } from '../src/engine/match';
import { CategoryTree } from '../src/ingredients/categoryTree';
import { SEED_TREE, SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const tree = new CategoryTree(SEED_TREE);
const td = (a: string, b: string) => tree.distance(a, b);
const index = buildIndex(SEED_COCKTAILS);

describe('nearest', () => {
  it('ranks Negroni as nearest to an aperol-for-campari swap', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    const results = nearest(combo, index, td, 3);
    expect(results[0].cocktail.id).toBe('negroni');
    expect(results[0].distance).toBe(2); // aperol<->campari sibling distance
  });

  it('reports the swapped ingredient in the diff', () => {
    const combo: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    };
    const top = nearest(combo, index, td, 1)[0];
    expect(top.diff.swapped).toContainEqual({ role: 'modifier', from: 'aperol', to: 'campari' });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/nearest.test.ts`
Expected: FAIL ("nearest is not exported" / not a function)

- [ ] **Step 3: 구현 추가 (match.ts 끝에 append)**

```ts
// --- append to src/engine/match.ts ---
import { type Component, type Role, LIQUID_BUILD_ROLES } from '../types';
import { distance, type TreeDistanceFn } from './distance';

export interface Diff {
  missing: Component[];
  extra: Component[];
  swapped: { role: Role; from: string; to: string }[];
}

export interface NearestResult {
  cocktail: Cocktail;
  distance: number;
  diff: Diff;
}

function liquidByRole(components: Component[]): Map<Role, Component[]> {
  const m = new Map<Role, Component[]>();
  for (const c of components) {
    if (!LIQUID_BUILD_ROLES.has(c.role)) continue;
    if (!m.has(c.role)) m.set(c.role, []);
    m.get(c.role)!.push(c);
  }
  return m;
}

// diff from combo's perspective toward target cocktail
export function computeDiff(combo: Component[], target: Component[]): Diff {
  const ma = liquidByRole(combo);
  const mb = liquidByRole(target);
  const roles = new Set<Role>([...ma.keys(), ...mb.keys()]);

  const diff: Diff = { missing: [], extra: [], swapped: [] };
  for (const role of roles) {
    let listA = [...(ma.get(role) ?? [])];
    let listB = [...(mb.get(role) ?? [])];

    // remove exact ingredient matches
    for (const ca of [...listA]) {
      const j = listB.findIndex((cb) => cb.ingredientId === ca.ingredientId);
      if (j >= 0) {
        listA = listA.filter((x) => x !== ca);
        listB.splice(j, 1);
      }
    }

    // pair remaining same-role as swaps (deterministic order)
    listA.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    listB.sort((x, y) => x.ingredientId.localeCompare(y.ingredientId));
    while (listA.length > 0 && listB.length > 0) {
      const from = listA.shift()!;
      const to = listB.shift()!;
      diff.swapped.push({ role, from: from.ingredientId, to: to.ingredientId });
    }

    // leftovers
    diff.extra.push(...listA);
    diff.missing.push(...listB);
  }
  return diff;
}

export function nearest(
  combo: Combination,
  index: EngineIndex,
  td: TreeDistanceFn,
  k = 3,
): NearestResult[] {
  const candidateIds = new Set<string>();
  for (const c of combo.components) {
    for (const id of index.inverted.get(c.ingredientId) ?? []) candidateIds.add(id);
  }
  const pool = candidateIds.size > 0
    ? index.cocktails.filter((ck) => candidateIds.has(ck.id))
    : index.cocktails;

  const scored: NearestResult[] = pool.map((ck) => ({
    cocktail: ck,
    distance: distance(combo.components, ck.components, td),
    diff: computeDiff(combo.components, ck.components),
  }));

  scored.sort((x, y) => x.distance - y.distance || x.cocktail.name.localeCompare(y.cocktail.name));
  return scored.slice(0, k);
}
```

Note: `import` 문은 파일 상단으로 합쳐도 되지만, ESM에서는 중복 import가 허용되므로 append 그대로도 동작한다. 정리하고 싶으면 상단 import 블록에 `Component, Role, LIQUID_BUILD_ROLES`, `distance, TreeDistanceFn`를 병합하라.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/nearest.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/match.ts tests/nearest.test.ts
git commit -m "feat: add nearest-neighbor search with composition diff"
```

---

## Task 11: 재료 치환 재조회 (swap)

**Files:**
- Modify: `src/engine/match.ts` (append `swap`, `SwapResult`)
- Test: `tests/swap.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/swap.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { swap } from '../src/engine/match';
import { CategoryTree } from '../src/ingredients/categoryTree';
import { SEED_TREE, SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const tree = new CategoryTree(SEED_TREE);
const td = (a: string, b: string) => tree.distance(a, b);
const index = buildIndex(SEED_COCKTAILS);

const negroni: Combination = {
  components: [
    { ingredientId: 'gin', role: 'base', bucket: 'full' },
    { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
    { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
  ],
};

describe('swap', () => {
  it('turns a Negroni into a Boulevardier when base gin -> bourbon', () => {
    const baseIdx = negroni.components.findIndex((c) => c.role === 'base');
    const r = swap(negroni, baseIdx, 'bourbon', index, td);
    expect(r.status).toBe('exact');
    if (r.status === 'exact') {
      expect(r.matches.map((c) => c.id)).toContain('boulevardier');
    }
  });

  it('falls back to nearest when the swap has no named match', () => {
    const modIdx = negroni.components.findIndex((c) => c.ingredientId === 'campari');
    const r = swap(negroni, modIdx, 'aperol', index, td);
    expect(r.status).toBe('miss');
    if (r.status === 'miss') {
      expect(r.nearest[0].cocktail.id).toBe('negroni');
    }
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/swap.test.ts`
Expected: FAIL ("swap is not exported")

- [ ] **Step 3: 구현 추가 (match.ts 끝에 append)**

```ts
// --- append to src/engine/match.ts ---
export type SwapResult =
  | { status: 'exact'; combination: Combination; matches: Cocktail[] }
  | { status: 'miss'; combination: Combination; nearest: NearestResult[] };

export function swap(
  combo: Combination,
  componentIndex: number,
  newIngredientId: string,
  index: EngineIndex,
  td: TreeDistanceFn,
): SwapResult {
  const newComponents = combo.components.map((c, i) =>
    i === componentIndex ? { ...c, ingredientId: newIngredientId } : c,
  );
  const newCombo: Combination = { components: newComponents, techniques: combo.techniques };

  const id = identify(newCombo, index);
  if (id.status === 'exact') {
    return { status: 'exact', combination: newCombo, matches: id.matches };
  }
  return { status: 'miss', combination: newCombo, nearest: nearest(newCombo, index, td) };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/swap.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/match.ts tests/swap.test.ts
git commit -m "feat: add ingredient-swap re-query (exact or nearest fallback)"
```

---

## Task 12: 접두사/트리 탐색 (explore)

**Files:**
- Modify: `src/engine/match.ts` (append `explore`, `ExploreCandidate`)
- Test: `tests/explore.test.ts`

**규칙:** 부분조합의 액상 빌드 멀티셋이 칵테일의 액상 빌드 멀티셋의 **부분집합**이면 후보. `missing` = 칵테일에서 아직 안 들어간 성분(멀티셋 차집합). 부족 수가 적은 순으로 정렬.

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/explore.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../src/engine/index-build';
import { explore } from '../src/engine/match';
import { SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const index = buildIndex(SEED_COCKTAILS);

describe('explore', () => {
  it('lists Negroni as completable from {gin, campari} with sweet_vermouth missing', () => {
    const partial: Combination = {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    };
    const candidates = explore(partial, index);
    const negroni = candidates.find((c) => c.cocktail.id === 'negroni');
    expect(negroni).toBeDefined();
    expect(negroni!.missing.map((m) => m.ingredientId)).toEqual(['sweet_vermouth']);
  });

  it('excludes cocktails that lack a partial ingredient', () => {
    const partial: Combination = {
      components: [{ ingredientId: 'gin', role: 'base', bucket: 'full' }],
    };
    const ids = explore(partial, index).map((c) => c.cocktail.id);
    expect(ids).toContain('negroni');
    expect(ids).not.toContain('boulevardier'); // boulevardier has no gin
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/explore.test.ts`
Expected: FAIL ("explore is not exported")

- [ ] **Step 3: 구현 추가 (match.ts 끝에 append)**

```ts
// --- append to src/engine/match.ts ---
export interface ExploreCandidate {
  cocktail: Cocktail;
  missing: Component[];
}

function liquidKeys(components: Component[]): string[] {
  return components
    .filter((c) => LIQUID_BUILD_ROLES.has(c.role))
    .map((c) => `${c.role}:${c.ingredientId}`);
}

function countMap(keys: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}

export function explore(partial: Combination, index: EngineIndex): ExploreCandidate[] {
  const haveCount = countMap(liquidKeys(partial.components));

  const candidates: ExploreCandidate[] = [];
  for (const ck of index.cocktails) {
    const ckLiquid = ck.components.filter((c) => LIQUID_BUILD_ROLES.has(c.role));
    const ckCount = countMap(ckLiquid.map((c) => `${c.role}:${c.ingredientId}`));

    let isSubset = true;
    for (const [key, need] of haveCount) {
      if ((ckCount.get(key) ?? 0) < need) {
        isSubset = false;
        break;
      }
    }
    if (!isSubset) continue;

    // missing = cocktail liquid components minus what we already have (multiset diff)
    const remaining = new Map(haveCount);
    const missing: Component[] = [];
    for (const c of ckLiquid) {
      const key = `${c.role}:${c.ingredientId}`;
      const r = remaining.get(key) ?? 0;
      if (r > 0) remaining.set(key, r - 1);
      else missing.push(c);
    }

    candidates.push({ cocktail: ck, missing });
  }

  candidates.sort(
    (a, b) => a.missing.length - b.missing.length || a.cocktail.name.localeCompare(b.cocktail.name),
  );
  return candidates;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/explore.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/engine/match.ts tests/explore.test.ts
git commit -m "feat: add prefix/tree exploration (subset candidates + missing)"
```

---

## Task 13: CocktailEngine facade (API-ready) + 배럴 export

**Files:**
- Create: `src/engine/Engine.ts`
- Create: `src/index.ts`
- Test: `tests/engine.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// tests/engine.test.ts
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/engine.test.ts`
Expected: FAIL ("Cannot find module '../src/index'")

- [ ] **Step 3: facade + 배럴 구현**

```ts
// src/engine/Engine.ts
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
```

```ts
// src/index.ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/engine.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: 전체 테스트 + 타입체크**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: 모든 테스트 PASS, 타입 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/engine/Engine.ts src/index.ts tests/engine.test.ts
git commit -m "feat: add CocktailEngine facade and public barrel export"
```

---

## 완료 기준 (Definition of Done)

- 13개 태스크 전부 커밋됨.
- `npx vitest run` → 전체 PASS.
- `npx tsc --noEmit` → 에러 없음.
- `CocktailEngine`이 identify/explore/swap/nearest/normalizeIngredient 5개 공개 메서드를 제공 (추후 HTTP API/웹 UI가 이 facade를 그대로 감쌀 수 있음).

## 후속 (이 계획 밖)

- HTTP API 계층 (Express/Fastify로 `CocktailEngine` facade 노출).
- 웹 UI (조합 빌더 + 오프닝 익스플로러 시각화).
- 시드 데이터 확장 (IBA 공식 ~100종 + TheCocktailDB 매핑).
- 미등록 재료 퍼지 제안 고도화 (현재는 substring 기반).
- 역할 미지정 입력 파싱 (사용자가 재료만 입력 → `default_role`로 역할 추정 + 역할무시 2차 폴백). 엔진 코어는 역할이 지정된 `Component[]`를 입력으로 받으며, 이 파싱은 입력/API 계층 책임으로 분리.
