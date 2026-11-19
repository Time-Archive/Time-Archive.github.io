/* 식물 데이터 — 양치식물 (Ferns)
   형식은 data/plants.js 와 같습니다. 이 파일은 기존 목록(window.TA_PLANTS)에 항목을 덧붙입니다.
   group = Family(과), genus = Genus(속), locality = 이 개체의 산지(from …), localityTdwg = 산지 지도용 WGSRPD 코드,
   collector = 채집자 또는 채집자가 붙인 식별 번호([…]) */
window.TA_PLANTS = (window.TA_PLANTS || []).concat([
  {
    id: "ps",
    scientificName: "Ptisana squamosa",
    author: "(Christ) Murdock",
    koreanName: "프티사나 스쿠아모사",
    category: "fern",
    family: "Marattiaceae",
    group: "Family Marattiaceae",
    genus: "Genus Ptisana",
    origin: ["New Guinea"],
    tdwg: ["NWG"],
    nativeRange: "New Guinea",
    locality: "Papua",
    localityTdwg: ["NWG"],
    habitat: "습윤 열대의 아관목형 지생 양치식물",
    elevation: "",
    collector: "",
    tags: [],
    notes: "",
    sources: [{"title": "POWO — Ptisana squamosa (Christ) Murdock", "url": "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77091905-1", "note": "학명 · 원산지 · 생활형"}, {"title": "Indonesia Plants — Marattiaceae", "url": "https://www.indonesiaplants.org/fernlyco/marattiaceae/", "note": "분포 (Papua)"}],
    addedAt: "2026-11-19",
    photos: [{"src": "images/plants/ptisana-squamosa/2026-11-18-01.jpg", "date": "2026-11-18", "caption": ""}, {"src": "images/plants/ptisana-squamosa/2026-11-18-02.jpg", "date": "2026-11-18", "caption": ""}],
    flowers: [],
  },
]);
