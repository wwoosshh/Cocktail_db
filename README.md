# Cocktail DB — 칵테일 조합 대조 엔진

칵테일 조합을 **체스 오프닝 북처럼 대조(matching)** 하는 정보성 데이터베이스 프로젝트.

사용자가 칵테일 조합을 지정하거나 직접 재료를 쌓아갈 때, 이름 있는 칵테일의 거대한 DB와 대조하여:

- **정확 식별** — 이 조합이 무엇인지 (예: "이건 네그로니다")
- **접두사/트리 탐색** — "지금 네그로니 라인, 다음에 스위트베르무트 넣으면 완성"
- **재료 치환 재조회** — "진→버번으로 바꾸면 불바디에가 됩니다"
- **최근접 이웃** — 이름 없는 조합이면 가장 가까운 칵테일과 차이점 제시

핵심 철학: **추론(ML)이 아니라 대조(룩업·CPU 계산).** 이름 있는 칵테일의 제조 단계를 정규형으로 DB화하고, 트랜스포지션을 해시로 제거해 부을 순서가 달라도 동일하게 식별한다.

## 실행

```bash
npm install
npm start        # http://localhost:3000 에서 웹 UI + API 구동
npm test         # 전체 테스트 (엔진 + API 통합)
npm run demo     # 콘솔에서 엔진 4가지 동작 데모
```

### API 엔드포인트
- `GET  /api/ingredients` — 재료 목록
- `POST /api/identify` — `{components}` → 정확 식별
- `POST /api/explore` — `{components}` → 다음 재료 안내(오프닝 트리)
- `POST /api/swap` — `{components, componentIndex, newIngredientId}` → 치환 결과
- `POST /api/nearest` — `{components, k?}` → 최근접 칵테일 + diff

## 설계 문서

- [`docs/superpowers/specs/2026-06-12-cocktail-combination-engine-design.md`](docs/superpowers/specs/2026-06-12-cocktail-combination-engine-design.md)
- [`docs/superpowers/plans/2026-06-12-cocktail-combination-engine.md`](docs/superpowers/plans/2026-06-12-cocktail-combination-engine.md)

## 상태

엔진 + API + 웹 UI 작동. 시드 데이터 6종(확장 예정).
