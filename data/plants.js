/* 식물 데이터 — 식물 1종 = 항목 1개. 사진은 images/plants/<id>/ 에 넣고 photos 에 추가합니다.
   category: "orchid"(난초) | "fern"(양치식물) | "jungle"(정글플랜츠) | "aroid"(아로이드)
   group = 중분류(예: "Tribe Dendrobium"), genus = 소분류, origin = 원산지 태그(POWO 기준), tdwg = 지도용 WGSRPD Level 3 코드 */
window.TA_PLANTS = [
  {
    id: "dendrobium-jenkinsii",
    sample: true, // 실제 등록 시 이 줄 삭제
    scientificName: "Dendrobium jenkinsii",
    author: "Wall. ex Lindl.",
    koreanName: "",
    category: "orchid",
    family: "Orchidaceae",
    group: "Tribe Dendrobium",
    genus: "Dendrobium속",
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
