/* 식물 데이터 — 식물 1종 = 항목 1개. 사진은 images/plants/<id>/ 에 넣고 photos 에 추가합니다.
   category: "orchid"(Orchids) | "fern"(Ferns) | "jungle"(Jungle Plants) | "aroid"(Aroids)
   group = 중분류(예: "Tribe Cymbidieae"), genus = 소분류(예: "Genus Maxillaria"),
   origin = Native 태그(POWO 기준), tdwg = 지도용 WGSRPD Level 3 코드 */
window.TA_PLANTS = [
  {
    id: "maxillaria-spilotantha",
    scientificName: "Maxillaria spilotantha",
    author: "Rchb.f.",
    koreanName: "",
    category: "orchid",
    family: "Orchidaceae",
    group: "Tribe Cymbidieae",
    genus: "Genus Maxillaria",
    origin: ["Colombia", "Ecuador", "Peru", "Venezuela"],
    tdwg: ["CLM", "ECU", "PER", "VEN"],
    nativeRange: "W. South America to N. Venezuela",
    habitat: "습윤 열대 산지 숲의 착생란 (위구경이 있는 소형 저온성 종)",
    elevation: "1,500–2,700 m",
    collector: "",
    tags: [],
    notes: "",
    powo: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:643819-1",
    // 상세 페이지 하단 "Sources · 출처" 목록. note = 어떤 정보의 출처인지
    sources: [
      { title: "Plants of the World Online (POWO) — Maxillaria spilotantha Rchb.f.", url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:643819-1", note: "학명 · 원산지 · 서식지" },
      { title: "Internet Orchid Species Photo Encyclopedia (orchidspecies.com)", url: "https://www.orchidspecies.com/maxspilotantha.htm", note: "해발고도" },
    ],
    addedAt: "2026-11-17",
    photos: [
      { src: "images/plants/maxillaria-spilotantha/2026-03-23-01.jpg", date: "2026-03-23", caption: "" },
      { src: "images/plants/maxillaria-spilotantha/2026-03-23-02.jpg", date: "2026-03-23", caption: "" },
      { src: "images/plants/maxillaria-spilotantha/2026-03-23-03.jpg", date: "2026-03-23", caption: "" },
    ],
    // 꽃 사진 (난초 상세 페이지의 "꽃" 탭). credit = 사진 출처
    flowers: [
      { src: "images/plants/maxillaria-spilotantha/flower-01.jpg", caption: "", credit: "" },
    ],
  },
  {
    id: "dendrobium-jenkinsii",
    sample: true, // 실제 등록 시 이 줄 삭제
    scientificName: "Dendrobium jenkinsii",
    author: "Wall. ex Lindl.",
    koreanName: "",
    category: "orchid",
    family: "Orchidaceae",
    group: "Tribe Dendrobium",
    genus: "Genus Dendrobium",
    origin: ["S. China", "E. Himalayas", "Vietnam", "Thailand", "Laos", "Myanmar"],
    tdwg: ["CHC", "EHM", "VIE", "THA", "LAO", "MYA"],
    nativeRange: "E. Himalaya to S. China and Indo-China",
    habitat: "성긴 숲의 나무 줄기에 붙어 자라는 착생란",
    elevation: "700–1,300 m",
    collector: "",
    tags: [],
    notes: "",
    addedAt: "2026-11-17",
    photos: [
      // { src: "images/plants/dendrobium-jenkinsii/2026-11-17-01.jpg", date: "2026-11-17", caption: "" },
    ],
  },
];
