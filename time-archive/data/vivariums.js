/* 비바리움 데이터 — 비바리움 1개 = 항목 1개. 사진은 images/vivariums/<id>/ 에 넣습니다.
   plants: data/plants.js 의 식물 id 목록 (상세 페이지에서 서로 연결됩니다) */
window.TA_VIVARIUMS = [
  {
    id: "sample-vivarium",
    sample: true, // 실제 등록 시 이 항목을 교체
    name: "Sample Vivarium",
    type: "Paludarium",
    size: "45 × 45 × 60 cm",
    startedAt: "2026-11-17",
    lighting: "",
    environment: "",
    inhabitants: [],
    plants: ["dendrobium-jenkinsii"],
    tags: [],
    description: "",
    addedAt: "2026-11-17",
    photos: [
      // { src: "images/vivariums/sample-vivarium/2026-11-17-01.jpg", date: "2026-11-17", caption: "세팅 직후" },
    ],
  },
];
