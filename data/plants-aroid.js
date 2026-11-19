/* 식물 데이터 — 아로이드 (Aroids)
   형식은 data/plants.js 와 같습니다. 이 파일은 기존 목록(window.TA_PLANTS)에 항목을 덧붙입니다.
   group = Family(과), genus = Genus(속), locality = 이 개체의 산지(from …), localityTdwg = 산지 지도용 WGSRPD 코드,
   collector = 채집자 또는 채집자가 붙인 식별 번호([…]) */
window.TA_PLANTS = (window.TA_PLANTS || []).concat([
  {
    id: "pms",
    scientificName: "Philodendron sp. 'Mini Santiago'",
    author: "",
    koreanName: "필로덴드론 sp. 'Mini Santiago'",
    category: "aroid",
    family: "Araceae",
    group: "Family Araceae",
    genus: "Genus Philodendron",
    origin: [],
    tdwg: [],
    nativeRange: "",
    locality: "",
    localityTdwg: [],
    habitat: "",
    elevation: "",
    collector: "",
    tags: [],
    notes: "",
    sources: [{"title": "POWO — Philodendron (속)", "url": "https://powo.science.kew.org/results?q=Philodendron", "note": "속 정보"}],
    addedAt: "2026-11-19",
    photos: [{"src": "images/plants/philodendron-sp-mini-santiago/2026-11-18-01.jpg", "date": "2026-11-18", "caption": ""}],
    flowers: [],
  },
]);
