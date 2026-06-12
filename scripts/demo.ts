import { CocktailEngine } from '../src/index';
import { SEED_TREE, SEED_INGREDIENTS, SEED_COCKTAILS } from '../src/data/seed';
import type { Combination } from '../src/types';

const engine = new CocktailEngine({
  cocktails: SEED_COCKTAILS,
  tree: SEED_TREE,
  ingredients: SEED_INGREDIENTS,
});

const line = (s: string) => console.log(s);
const hr = () => line('─'.repeat(60));

const negroni: Combination = {
  components: [
    { ingredientId: 'gin', role: 'base', bucket: 'full' },
    { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
    { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
  ],
};

line('\n🍸  COCKTAIL ENGINE — LIVE DEMO\n');

hr();
line('① 정확 식별  (입력: gin + campari + sweet_vermouth, 순서 섞음)');
const id = engine.identify({
  components: [negroni.components[2], negroni.components[0], negroni.components[1]],
});
line(`   → status: ${id.status}, matches: [${id.matches.map((c) => c.name).join(', ')}]`);

hr();
line('② 접두사 탐색  (입력: gin + campari, 아직 미완성)');
const exp = engine.explore({
  components: [
    { ingredientId: 'gin', role: 'base', bucket: 'full' },
    { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
  ],
});
for (const c of exp) {
  line(`   → ${c.cocktail.name}: 다음에 넣으면 완성 = [${c.missing.map((m) => m.ingredientId).join(', ') || '(이미 완성)'}]`);
}

hr();
line('③ 재료 치환  (네그로니에서 base: gin → bourbon)');
const baseIdx = negroni.components.findIndex((c) => c.role === 'base');
const sw = engine.swap(negroni, baseIdx, 'bourbon');
if (sw.status === 'exact') {
  line(`   → "${sw.matches.map((c) => c.name).join(', ')}" 가 됩니다`);
} else {
  line(`   → 이름 없는 변형. 가장 가까운: ${sw.nearest[0]?.cocktail.name}`);
}

hr();
line('③-b 재료 치환  (네그로니에서 modifier: campari → aperol)');
const camIdx = negroni.components.findIndex((c) => c.ingredientId === 'campari');
const sw2 = engine.swap(negroni, camIdx, 'aperol');
if (sw2.status === 'exact') {
  line(`   → "${sw2.matches.map((c) => c.name).join(', ')}" 가 됩니다`);
} else {
  const top = sw2.nearest[0];
  const sw_d = top.diff.swapped.map((s) => `${s.from}→${s.to}`).join(', ');
  line(`   → 이름 없는 변형. 가장 가까운: ${top.cocktail.name} (거리 ${top.distance}, 차이: ${sw_d})`);
}

hr();
line('④ 최근접 이웃  (입력: gin + aperol + sweet_vermouth = 이름 없음)');
const near = engine.nearest({
  components: [
    { ingredientId: 'gin', role: 'base', bucket: 'full' },
    { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
    { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
  ],
});
for (const r of near) {
  const d = r.diff.swapped.map((s) => `${s.from}→${s.to}`).join(', ') || '(없음)';
  line(`   → ${r.cocktail.name}  거리=${r.distance}  치환=${d}`);
}

hr();
line('⑤ 재료 정규화  (브랜드/동의어 → 정규 ID)');
for (const q of ['Tanqueray', 'London Dry', 'vermouth', 'xyzzy']) {
  line(`   → "${q}" = ${JSON.stringify(engine.normalizeIngredient(q))}`);
}
hr();
line('');
