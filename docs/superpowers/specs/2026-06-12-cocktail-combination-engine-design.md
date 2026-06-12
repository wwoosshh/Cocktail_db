# 칵테일 조합 대조 엔진 — 설계 문서

- **작성일:** 2026-06-12
- **상태:** 설계 승인됨 (구현 계획 대기)
- **범위:** 칵테일 "조합 대조 엔진" 코어 — 정규형 표현(칵테일판 FEN) + 대조 로직. 웹 UI/API, 시딩 파이프라인, 위스키 단독 시음 DB는 범위 밖(후속 스펙).

---

## 1. 목적과 핵심 통찰

### 목적
사용자가 칵테일 조합을 지정하거나 직접 재료를 쌓아갈 때, **이름 있는 칵테일의 거대한 DB와 대조하여** 그것이 무엇인지 식별하고, 재료를 바꾸면 무엇이 되는지를 알려주는 엔진.

### 핵심 통찰 — "체스 오프닝 북" 모델
이 엔진은 **추론(inference)이 아니라 대조(matching)** 문제다. 체스 엔진이 오프닝을 판정하는 방식(신경망 추론이 아니라 오프닝 북 룩업)과 동일하다:

- 이름 있는 칵테일의 제조 단계를 하나하나 분리해 DB화한다.
- 사용자 조합을 정규화해 DB와 대조한다 — 맞으면 그 이름, 없으면 "이름 없는 변형".
- DB에 없는 조합을 "추론"할 필요가 없다. 맞는가/아닌가의 **CPU 계산·색인 조회** 영역.
- ML·GPU·풍미 예측이 불필요하다 (관련 ML 접근의 SOTA Hit@1 ≈ 22%로 신뢰성 부족 — 이 문제를 룩업으로 우회).

### 체스 자료구조 매핑
| 체스 | 칵테일 엔진 |
|---|---|
| 오프닝 북 | 이름 있는 칵테일 제조수순 DB |
| 한 수(move) | 분해된 단일 행동(재료 추가, 기법) |
| 포지션 해시 / 트랜스포지션 테이블 | 정규화된 조합 해시 (부을 순서 무관) |
| 오프닝 트리 탐색 | "지금 네그로니 라인 N수째" 실시간 분기 안내 |

---

## 2. 확정된 설계 결정 (Decision Log)

| # | 결정 | 선택 |
|---|---|---|
| D1 | 모델링 입자 | **조합 + 기법 수순** (2계층) |
| D2 | 분량 처리 | **역할 버킷** (정밀 ml 아님) |
| D3 | 대조 동작 | **정확 식별 + 접두사/트리 탐색 + 치환 재조회 + 최근접 이웃** (4종 전부) |
| D4 | 재료 모델 | **카테고리 트리** (정규화 + 계층 거리), 풍미 임베딩 아님 |
| D5 | 위스키 범위 | **조합 엔진에 집중**. 위스키는 칵테일/하이볼의 베이스 재료로만 등장. 단독 시음 DB는 후속 |
| D6 | 표현·대조 전략 | **접근 A** (정규형 해시 + 색인). 치환 그래프는 저장이 아니라 재조회로 창발 |
| D7 | 하이볼 | 칵테일의 한 종류(베이스 + lengthener). 데이터셋 주 타깃은 칵테일 전반 |
| D8 | 스모킹 | 기법으로 추가. 기법은 `identity_affecting` 플래그로 식별 영향 여부 구분 |

---

## 3. 정규형 (칵테일 상태 표현, "칵테일 FEN")

칵테일 하나 = 3블록.

### 3.1 조합(Composition) — 순서 무관 멀티셋
각 성분 = `(정규재료 ID, 역할, 분량버킷)`.

**역할 enum (7종)** — Death & Co `Cocktail Codex`의 core/balance/seasoning 이론 기반:

| 역할 | 의미 | 예 |
|---|---|---|
| `base` | 핵심 베이스 주류 | 진, 위스키, 럼 |
| `modifier` | 성격을 바꾸는 보조 주류/주정강화 | 베르무트, 캄파리, 리큐어 |
| `sweet` | 당 요소 | 시럽, 설탕, 큐라소 |
| `sour` | 산 요소 | 레몬·라임즙 |
| `bitters` | 시즈닝/액센트 | 앙고스투라, 오렌지비터 |
| `lengthener` | 길이내기/탑 (하이볼의 핵심) | 소다, 토닉, 진저비어 |
| `garnish` | 비액상 마무리 | 오렌지필, 체리 |

**분량버킷** — coarse 등급: `dash / accent / part / full / top`. (역할과 결합해 식별 안정성 확보)

### 3.2 기법 수순(Technique) — 순서 있는 행동 리스트
통제된 동사 어휘: `build, stir, shake, dry-shake, muddle, strain, double-strain, top, float, garnish, smoke, flame, rinse`.

- 고정 슬롯 제약: garnish는 항상 끝, strain은 shake/stir 뒤.
- 각 동사에 **`identity_affecting` 플래그**:
  - **식별 영향 O** (정체성 해시 포함): `smoke`, `muddle`, `flame`, `rinse` (= "aromatic finish" 그룹 + 머들링)
  - **식별 영향 X** (2차 판별자로만): `stir`, `shake`, `strain`, `top`, `build` 등

### 3.3 제공(Service)
`glass`(rocks/coupe/highball…), `ice`(none/cubed/crushed/large).

### 3.4 워크드 예시
```
네그로니   조합:{(gin,base,full),(campari,modifier,full),(sweet_vermouth,modifier,full)}
          기법:[stir, strain]   잔:rocks   얼음:large   가니시:orange_peel
하이볼     조합:{(whisky,base,full),(soda_water,lengthener,top)}
          기법:[build, top]     잔:highball 얼음:cubed
불바디에   조합:{(bourbon,base,full),(campari,modifier,full),(sweet_vermouth,modifier,full)}
          → 네그로니에서 base만 gin→bourbon 치환된 해시. "치환=재조회"가 그대로 보임.
```

---

## 4. 정체성 경계 (브리틀니스 방지)

정체성 해시에 들어가는 것을 **좁게** 못박는다:

| 정체성 해시 **포함** | **제외** (저장·거리·표시용으로만) |
|---|---|
| `(재료, 역할)` 멀티셋 중 **액상 빌드 역할** (base/modifier/sweet/sour/bitters/lengthener) | `garnish` 역할 (오렌지필↔레몬필이어도 동일 칵테일) |
| `identity_affecting` 기법 (smoke/muddle/flame/rinse) | `ice`, 비식별 기법(stir/shake/strain/top) |
| | **분량버킷** (식별엔 역할만, 버킷은 거리·표시로) |

→ 비율을 살짝 다르게 만들어도 같은 칵테일, 가니시·얼음 바꿔도 동일. 안정적 식별.

---

## 5. 재료 모델 (정규화 + 카테고리 트리)

### 5.1 재료 레지스트리
각 정규재료 = `{id, 정규명, 동의어[], 브랜드별칭[], 카테고리경로, 기본역할}`.
- **정규화 파이프라인:** 입력 문자열 → 동의어/브랜드 매칭 → 정규 ID (예: "탱커레이", "London Dry" → `gin`).
- **기본역할:** 입력 파싱 보조 힌트일 뿐. 실제 역할은 레시피 성분마다 지정 (캄파리는 네그로니에선 `modifier`, 캄파리소다에선 `base`).

### 5.2 카테고리 트리 (거리의 근거)
```
Spirits
├─ Whisky ─ Bourbon / Rye / Scotch / Japanese …
├─ Gin ─ London Dry / Old Tom …
├─ Rum / Tequila / Vodka / Brandy …
Bitter-Liqueur(Amaro) ─ Campari / Aperol / Cynar …
Fortified-Wine ─ Sweet Vermouth / Dry Vermouth / Lillet …
Citrus ─ Lemon / Lime …   Sweetener ─ Simple Syrup / Honey …
Bitters ─ Angostura / Orange …   Lengthener ─ Soda / Tonic / Ginger Beer …
```
- **트리 거리 = 두 재료의 최저공통조상까지 경로 길이.** bourbon↔rye(형제, 거리1) < bourbon↔gin(먼 거리). campari↔aperol(형제) → 치환 시 "가장 가까운 후보"로 우선.
- 치환 재조회·최근접 랭킹이 이 거리로 계산 (ML 없이 결정론적).

### 5.3 핵심 원칙
재료의 **역할은 내재 속성이 아니라 레시피 성분의 속성.** 트리는 "재료가 무엇인가(정체성·유사도)"만, "어떤 역할로 쓰였나"는 조합 블록이 담는다. 두 축 분리.

---

## 6. 대조 엔진 (4가지 동작)

전부 **하나의 정규형 + 트리거리** 위에서 동작. ML 없음, CPU 색인·계산.

### 6.1 사전 구축 색인
- **정체성 해시맵:** `identity_hash → cocktail`. 정확 식별 O(1).
- **역색인(부분집합):** `ingredient_id → [cocktail_id]`. 접두사 탐색·1차 필터.

### 6.2 ① 정확 식별
사용자 조합 정규화·해시 → 해시맵 룩업.
- 히트 → "이건 네그로니다."
- 조합 같고 기법만 다름 → "네그로니인데, 당신 건 셰이크 버전" (2차 판별자).
- 미스 → ④로 폴백.

### 6.3 ② 접두사/트리 탐색 (오프닝 익스플로러)
재료를 하나씩 쌓을 때마다 현재 부분조합 S로 부분집합 색인 조회 → "S를 포함하는 후보 + 각각을 완성시키는 다음 재료" 제시.
```
진 + 캄파리 → [네그로니(+스위트베르무트)…]  "다음에 스위트베르무트 넣으면 네그로니 완성"
```

### 6.4 ③ 재료 치환 재조회
현재 조합에서 한 성분 재료를 바꿔 ①을 재실행.
```
네그로니 base: gin→bourbon → 히트: "불바디에가 됩니다"
캄파리→아페롤 → 미스 → ④로 "가장 가까운 건 네그로니(형제 치환, 거리1)"
```

### 6.5 ④ 최근접 이웃 (정확 미스일 때)
사용자 조합 ↔ 후보들의 **가중 집합 편집거리** 계산, 상위 k개 반환.

| 연산 | 비용 |
|---|---|
| 같은 역할 내 재료 교체 | 트리거리 (형제=저, 먼친척=고) |
| 역할 불일치 | 패널티(고) |
| 성분 추가/삭제 | 패널티 |
| 분량버킷 차이 | 소(小) 패널티 |

후보 DB가 수천 규모 → 베이스로 1차 필터 후 선형 스캔으로 충분 (Stockfish식 CPU 계산).

### 6.6 출력 통합
정확매치 → 이름. 미스 → "이름 없는 변형 + 가장 가까운 N개 + 무엇이 다른지(diff)". 전부 룩업/거리 결과.

---

## 7. 데이터 모델 · 저장

스택 미확정. 구조 중심, 기본 후보는 관계형 DB.

### 7.1 엔티티
```
Category(id, name, parent_id)                         ← 재료 카테고리 트리
Ingredient(id, canonical_name, synonyms[], brand_aliases[],
           category_id, default_role)                 ← 정규 재료 레지스트리
Cocktail(id, name, aliases[], glass, ice,
         identity_hash, origin, era, source, notes)   ← 이름있는 칵테일
CompositionComponent(cocktail_id, ingredient_id, role, bucket)   ← 조합 멀티셋
TechniqueStep(cocktail_id, seq, verb, identity_affecting)        ← 기법 수순
```

### 7.2 파생 색인 (앱 기동 시 빌드 또는 인덱스 테이블)
- 정체성 해시맵: `identity_hash → cocktail_id`. `identity_hash`는 Cocktail 컬럼.
- 역색인: `ingredient_id → [cocktail_id]`.

### 7.3 정규 직렬화 함수 (엔진의 단일 진실)
```
canonicalize(composition, techniques):
  comp   = sort( liquid-build components by (role, ingredient_id) )   # bucket 제외, garnish 제외
  idtech = sort( techniques where identity_affecting )                # 예: smoke
  identity_hash = hash( serialize(comp) + serialize(idtech) )
```
정렬이 트랜스포지션을 제거 → 부을 순서가 달라도 동일 해시. **이 함수가 식별의 유일한 기준점** (테스트 집중 대상).

### 7.4 거리 모듈
`distance(compA, compB)` = §6.5의 가중 집합 편집거리. 트리거리는 Category 트리의 최저공통조상 경로(사전 캐시 가능).

### 7.5 엔진은 순수 모듈
정규화·해시·거리·대조 로직은 DB와 분리된 **순수 함수 모듈** (입력 조합 → 결과). DB는 저장·색인만. → 단위 테스트·이식·교체 용이.

---

## 8. 엣지케이스 처리

| 상황 | 처리 |
|---|---|
| 미등록 재료 | 조용히 버리지 않음 → "X 모름, 가까운 건 Y?" 퍼지 제안 후 사용자 확정 |
| 모호한 동의어/브랜드 | 1개 문자열 → 다중 정규재료면 후보 제시(disambiguation) |
| 역할 미지정 입력 | default_role로 추정 + 저신뢰 플래그 + 역할무시 매칭 2차 폴백 |
| 다중 정확매치 | 같은 해시에 여러 이름(지역별 별칭) → 전부 반환, 출처 권위·인지도순 |
| 빈/부분 입력 | 에러 아님 → 접두사 탐색 모드 |

---

## 9. 테스트 전략 (TDD — 구현 전 작성)

- **골든셋:** IBA 공식 ~100종 정답 픽스처. 정확 식별이 올바른 이름 반환.
- **트랜스포지션 불변성:** 같은 조합을 순서 섞어 입력 → 동일 해시 (property test).
- **치환 픽스처:** 네그로니 base 스왑 → 불바디에 등 알려진 쌍.
- **최근접 픽스처:** near-miss 입력 → 기대 최근접 + 기대 diff.
- **정규화:** 동의어·브랜드 → 정확 ID, 미등록 → 제안.
- **속성 테스트:** canonicalize 순서불변, distance 대칭·`distance(x,x)=0`.

---

## 10. 비목표 (YAGNI)

- 이름 없는 조합의 "맛 서술" 생성 (풍미 임베딩 / ML)
- 위스키 단독 시음 DB (캐스크·산지·테이스팅 노트)
- 웹 UI / API 계층
- 시딩·인제스트 파이프라인 (IBA·TheCocktailDB·수기 → 본 스키마 매핑)

이들은 각자 후속 스펙으로 분리.

---

## 11. 의존성 / 다음 단계

- **시드 데이터:** 본 엔진은 "이름 있는 칵테일이 §7 스키마로 들어와 있다"를 가정. 시딩은 별도 작업. 후보: IBA 공식 레시피, TheCocktailDB(무료·합법), 수기 큐레이션.
- **다음 단계:** writing-plans 스킬로 구현 계획 작성.
