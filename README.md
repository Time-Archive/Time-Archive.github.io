# Time Archive

식물과 비바리움의 시간을 기록하고, 보관하는 아카이브 사이트. 빌드 과정 없는 정적 사이트(HTML/CSS/JS)라 GitHub Pages에 그대로 올리면 됩니다.

## 배포 (GitHub Pages)
1. GitHub에서 새 저장소 생성 (예: `time-archive`, Public)
2. 이 폴더의 파일 전체를 저장소 루트에 업로드
3. Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
4. 1~2분 뒤 `https://<아이디>.github.io/time-archive/` 에서 확인

## 구조
```
index.html        메인 (브랜드 소개 + 식물/비바리움 갤러리, 업데이트순)
plants.html       식물 아카이브 (대분류 섹션 → 중분류 → 소분류 → abc순, 태그 필터/검색)
plant.html?id=    식물 상세 (정보, 분포 지도, 사진 타임라인) ← 네임택 QR이 가리킬 주소
vivariums.html    비바리움 아카이브
vivarium.html?id= 비바리움 상세
data/plants.js    식물 데이터      data/vivariums.js  비바리움 데이터
images/plants/<id>/   images/vivariums/<id>/   사진
assets/           css, js, 로고
```

## 식물 등록
1. 사진을 `images/plants/<id>/YYYY-MM-DD-01.jpg` 로 저장 (긴 변 1600px 정도로 줄이면 로딩이 빠름)
2. `data/plants.js` 에 항목 추가, 또는 기존 항목의 `photos` 에 한 줄 추가

- 메인 사진은 `photos` 중 `date` 가 가장 최근인 사진으로 자동 선택됩니다.
- 태그는 `category`(대분류), `group`(중분류), `genus`(소분류), `origin`(원산지), `collector`(채집자), `tags`(기타)에서 자동 생성됩니다.
- `tdwg` 는 분포 지도에 칠할 지역 코드(WGSRPD Level 3, POWO가 쓰는 구역)입니다.

## 분포 지도
Leaflet(웹 메르카토르) 위에 TDWG Level 3 구역을 브랜드 녹색으로 칠합니다. 경계 데이터는 `data/tdwg-level3.geojson` 이 있으면 그것을, 없으면 CDN(tdwg/wgsrpd)에서 불러옵니다. 원본이 10MB 안팎이라, 모바일 로딩이 느리면 단순화한 파일을 `data/` 에 넣는 것을 권장합니다.
