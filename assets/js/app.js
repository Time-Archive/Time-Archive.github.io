/* Time Archive — 데이터(data/plants*.js, data/vivariums.js, data/animals.js)를 읽어 모든 페이지를 그립니다. */
(() => {
  "use strict";
  const PLANTS = window.TA_PLANTS || [];
  const VIVS = window.TA_VIVARIUMS || [];
  const ANIMALS = window.TA_ANIMALS || [];

  // 대분류 (순서 고정)
  const CATS = [
    { key: "orchid", ko: "난초", en: "Orchids" },
    { key: "fern", ko: "양치식물", en: "Ferns" },
    { key: "jungle", ko: "정글플랜츠", en: "Jungle Plants" },
    { key: "aroid", ko: "아로이드", en: "Aroids" },
    { key: "bromeliad", ko: "브로멜리아드", en: "Bromeliads" },
  ];
  // 생물 아카이브 대분류
  const ACATS = [
    { key: "amphibian", ko: "양서류", en: "Amphibians" },
  ];

  // 아카이브 종류별 설정: 식물 아카이브(plants.html / plant.html)와 생물 아카이브(animals.html / animal.html)가 같은 화면 구성을 씁니다
  const KP = {
    items: PLANTS, cats: CATS, list: "plants.html", detail: "plant.html", noun: "식물",
    eyebrow: "Plant Archive", title: "식물 아카이브",
    intro: "Orchids, Ferns, Jungle Plants, Aroids, Bromeliads. 종마다 쌓여가는 시간을 분류군별로 보관합니다.",
    byGenus: ["aroid", "bromeliad"], // 속별로 바로 묶는 대분류 (나머지는 과·족 → 속 2단계)
    groupLabel: "Tribe · Family", mapSrc: "Source: POWO / WGSRPD Level 3",
  };
  const KA = {
    items: ANIMALS, cats: ACATS, list: "animals.html", detail: "animal.html", noun: "생물",
    eyebrow: "Animal Archive", title: "생물 아카이브",
    intro: "비바리움에서 함께 지내는 생물들. 종마다 쌓여가는 시간을 기록합니다.",
    byGenus: [],
    groupLabel: "Family", mapSrc: "Source: AmphibiaWeb / WGSRPD Level 3",
  };
  const catOf = (k, K = KP) => K.cats.find((c) => c.key === k) || { key: k, ko: k || "기타", en: k || "Others" };

  // TDWG level 3 경계 데이터: 저장소에 data/tdwg-level3.geojson 이 있으면 우선 사용, 없으면 CDN
  const TDWG_SOURCES = [
    "data/tdwg-level3.geojson",
    "https://cdn.jsdelivr.net/gh/tdwg/wgsrpd@master/geojson/level3.geojson",
    "https://raw.githubusercontent.com/tdwg/wgsrpd/master/geojson/level3.geojson",
  ];

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const param = (k) => new URLSearchParams(location.search).get(k);
  const fmtDate = (d) => (d ? String(d).slice(0, 10).replace(/-/g, ".") : "");
  const photosOf = (it) => [...(it.photos || [])].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const cover = (it) => photosOf(it)[0] || null; // 메인 사진 = 가장 최근 업로드
  const updated = (it) => (cover(it) && cover(it).date) || it.addedAt || "";
  const byUpdated = (a, b) => String(updated(b)).localeCompare(String(updated(a)));
  const cmp = (a, b) => String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base", numeric: true });

  // 비바리움 사이즈: "20 × 20 × 45 cm" → 정렬용 부피 (작은 사이즈부터)
  const UNSIZED = "사이즈 미상";
  const sizeOf = (v) => v.size || UNSIZED;
  const sizeVol = (s) => {
    const n = String(s).match(/\d+(\.\d+)?/g);
    return n ? n.reduce((a, x) => a * Number(x), 1) : Infinity;
  };
  const sizeSlug = (s) => "size-" + (String(s).match(/\d+/g) || ["na"]).join("x");

  // 학명 이탤릭 처리
  // 정체로 두는 것: sp. · var. 등 표기, 'Cultivar', 교배종 이름(대문자로 시작하는 두 번째 이후 단어), 과 이름(-aceae)
  const sci = (name) =>
    String(name || "")
      .split(/\s+/)
      .map((w, i) => (/^(sp\.|spp\.|cf\.|aff\.|var\.|subsp\.|ssp\.|f\.|×|x)$/i.test(w) || /^['‘"(]/.test(w) || /['’")]$/.test(w) || (i > 0 && /^[A-Z]/.test(w)) || /aceae$/.test(w) ? esc(w) : `<i>${esc(w)}</i>`))
      .join(" ");

  // 식물 하나의 태그 목록: 대분류 / Tribe·Family(중분류) / Genus(소분류) / Native(원산지) / Locality(산지) / 채집자 / 기타
  const tagsOf = (p, K = KP) => {
    const t = [{ t: "cat", label: catOf(p.category, K).en }];
    if (p.group) t.push({ t: "group", label: p.group });
    if (p.genus) t.push({ t: "genus", label: p.genus });
    (p.origin || []).forEach((o) => t.push({ t: "origin", label: o }));
    if (p.locality) t.push({ t: "locality", label: p.locality });
    if (p.collector) t.push({ t: "collector", label: p.collector });
    (p.tags || []).forEach((x) => t.push({ t: "tag", label: x }));
    return t;
  };
  // 아카이브 목록의 묶음 단위: Aroids는 속(Genus)별, Orchids·Ferns·Jungle Plants는 Tribe·Family → Genus 2단계
  const groupOf = (p, K = KP) => (K.byGenus.includes(p.category) ? p.genus || p.group : p.group);
  const chip = (tag, extra = "", K = KP) =>
    `<a class="chip ${extra}" data-t="${tag.t}" data-l="${esc(tag.label)}" href="${K.list}?tag=${encodeURIComponent(tag.label)}">${esc(tag.label)}${tag.n ? `<span class="n">${tag.n}</span>` : ""}</a>`;

  const imgOrPh = (it, label) => {
    const c = cover(it);
    return c ? `<img src="${esc(c.src)}" alt="${esc(label)}" loading="lazy">` : `<div class="ph">${esc(String(label || "?").trim().charAt(0))}</div>`;
  };

  const itemCard = (K) => (p) => `
    <a class="card" href="${K.detail}?id=${encodeURIComponent(p.id)}">
      <div class="card-img">${p.sample ? '<span class="badge">SAMPLE</span>' : ""}${imgOrPh(p, p.scientificName)}</div>
      <div class="card-body">
        <h3 class="sci">${sci(p.scientificName)}</h3>
        <span class="card-meta">${esc([p.koreanName, fmtDate(updated(p))].filter(Boolean).join(" · "))}</span>
      </div>
    </a>`;
  const plantCard = itemCard(KP);
  const animalCard = itemCard(KA);

  const vivCard = (v) => `
    <a class="card viv${v.sold ? " is-sold" : ""}" href="vivarium.html?id=${encodeURIComponent(v.id)}">
      <div class="card-img">${v.sample ? '<span class="badge">SAMPLE</span>' : ""}${v.sold ? '<span class="sold-badge">SOLD</span>' : ""}${imgOrPh(v, v.name)}</div>
      <div class="card-body">
        <span class="card-kicker">${esc([v.type, v.size].filter(Boolean).join(" · ") || "Vivarium")}</span>
        <h3 class="plain">${esc(v.name)}</h3>
        <span class="card-meta">${v.sold ? '<b class="sold-tag">판매 완료</b> · ' : ""}${esc([v.startedAt ? "제작 " + fmtDate(v.startedAt) : "", updated(v) ? "업데이트 " + fmtDate(updated(v)) : ""].filter(Boolean).join(" · "))}</span>
      </div>
    </a>`;

  // 스마트스토어: 항목에 buy(상품 주소)가 있으면 "구매하기", 없으면 "판매 예정"(스토어 홈으로 연결)
  const STORE = "https://smartstore.naver.com/plantimalxkai";
  // sold(판매일)가 있으면 "판매 완료" — 누를 수 없는 버튼 + 스토어 둘러보기 링크
  const buyBtn = (it) =>
    it.sold
      ? `<div class="buy sold"><span class="btn is-sold" aria-disabled="true">판매 완료</span><a class="more" href="${STORE}" target="_blank" rel="noopener">스토어 둘러보기 →</a></div>`
      : `<div class="buy">${it.buy
      ? `<a class="btn fill" href="${esc(it.buy)}" target="_blank" rel="noopener">구매하기 →</a>`
      : `<a class="btn soon" href="${STORE}" target="_blank" rel="noopener">판매 예정 →</a>`}</div>`;

  const empty = (msg) => `<div class="empty">${esc(msg)}</div>`;

  /* ---------- header / footer ---------- */
  function chrome(page) {
    const on = (keys) => (keys.includes(page) ? "on" : "");
    $("#header").innerHTML = `
      <header class="site-header"><div class="wrap">
        <a class="brand" href="index.html" aria-label="Time Archive 홈"><img src="assets/img/logo-trim.png?v=10" alt="Time Archive"></a>
        <nav class="nav">
          <a class="${on(["home"])}" href="index.html">Home</a>
          <a class="${on(["plants", "plant"])}" href="plants.html">식물<span class="l"> 아카이브</span></a>
          <a class="${on(["vivariums", "vivarium"])}" href="vivariums.html">비바리움<span class="l"> 아카이브</span></a>
          <a class="${on(["animals", "animal"])}" href="animals.html">생물<span class="l"> 아카이브</span></a>
        </nav>
      </div></header>`;
    $("#footer").innerHTML = `
      <footer class="site-footer"><div class="wrap">
        <b><span>Time</span> Archive</b>
        <small>식물과 비바리움, 생물의 시간을 기록하고, 보관합니다. © ${new Date().getFullYear()} Time Archive</small>
      </div></footer>`;
  }

  /* ---------- lightbox ---------- */
  function lightbox(list) {
    if (!list.length) return () => {};
    const el = document.createElement("div");
    el.className = "lb";
    el.innerHTML = `<button class="x" aria-label="닫기">×</button><button class="prev" aria-label="이전">‹</button><img alt=""><button class="next" aria-label="다음">›</button><p></p>`;
    document.body.appendChild(el);
    let i = 0;
    const show = (n) => {
      i = (n + list.length) % list.length;
      $("img", el).src = list[i].src;
      $("p", el).textContent = [fmtDate(list[i].date), list[i].caption].filter(Boolean).join(" — ");
      el.classList.add("on");
    };
    const close = () => el.classList.remove("on");
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("prev")) show(i - 1);
      else if (e.target.classList.contains("next")) show(i + 1);
      else if (e.target.tagName !== "IMG") close();
    });
    document.addEventListener("keydown", (e) => {
      if (!el.classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
    return show;
  }

  // 날짜별 사진 타임라인
  function timeline(photos) {
    if (!photos.length) return empty("아직 등록된 사진이 없습니다.");
    const groups = [];
    photos.forEach((ph, idx) => {
      const d = fmtDate(ph.date) || "날짜 미상";
      let g = groups.find((x) => x.d === d);
      if (!g) groups.push((g = { d, items: [] }));
      g.items.push({ ...ph, idx });
    });
    return `<div class="timeline">${groups
      .map(
        (g) => `<div><div class="tl-date">${esc(g.d)}</div><div class="tl-grid">${g.items
          .map((ph) => `<figure data-lb="${ph.idx}"><div class="card-img"><img src="${esc(ph.src)}" alt="${esc(ph.caption || "")}" loading="lazy"></div>${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`)
          .join("")}</div></div>`
      )
      .join("")}</div>`;
  }
  function bindLightbox(root, photos) {
    const show = lightbox(photos);
    root.addEventListener("click", (e) => {
      const f = e.target.closest("[data-lb]");
      if (f && photos.length) show(Number(f.dataset.lb));
    });
  }

  /* ---------- HOME ---------- */
  const HOME_COUNT = 8; // 메인 페이지에 보여줄 최신 항목 수 (식물·비바리움 각각)
  function home() {
    const plants = [...PLANTS].sort(byUpdated);
    const vivs = [...VIVS].sort(byUpdated);
    $("#home-plants").innerHTML = plants.length ? plants.slice(0, HOME_COUNT).map(plantCard).join("") : empty("등록된 식물이 없습니다.");
    $("#home-vivs").innerHTML = vivs.length ? vivs.slice(0, HOME_COUNT).map(vivCard).join("") : empty("등록된 비바리움이 없습니다.");
    $("#home-plants-count").textContent = `${PLANTS.length} species`;
    $("#home-vivs-count").textContent = `${VIVS.length} vivariums`;
    if ($("#home-animals")) {
      const animals = [...ANIMALS].sort(byUpdated);
      $("#home-animals").innerHTML = animals.length ? animals.slice(0, HOME_COUNT).map(animalCard).join("") : empty("등록된 생물이 없습니다.");
      $("#home-animals-count").textContent = `${ANIMALS.length} species`;
    }
  }

  /* ---------- PLANTS / ANIMALS (archive) ---------- */
  function archive(K) {
    const app = $("#app");
    const ITEMS = K.items, CATS = K.cats;
    const state = { tag: param("tag") || "", q: "" };

    // 전체 태그 집계
    const tally = {};
    ITEMS.forEach((p) => tagsOf(p, K).forEach((t) => {
      if (t.t === "cat") return;
      const k = t.t + "|" + t.label;
      tally[k] = tally[k] || { ...t, n: 0 };
      tally[k].n++;
    }));
    const tagList = (types) => Object.values(tally).filter((t) => types.includes(t.t)).sort((a, b) => cmp(a.label, b.label));
    const row = (title, types, open) => { // 태그 줄은 기본으로 접어 둠 (선택된 태그가 있는 줄만 펼침)
      const l = tagList(types);
      return l.length ? `<details ${open ? "open" : ""}><summary>${title} (${l.length})</summary><div class="tagrow">${l.map((t) => chip(t, "", K)).join("")}</div></details>` : "";
    };

    app.innerHTML = `
      <div class="page-head"><div class="wrap">
        <span class="eyebrow">${K.eyebrow}</span>
        <h1>${K.title}</h1>
        <p>${esc(K.intro)}</p>
      </div></div>
      <div class="toolbar"><div class="wrap">
        <div class="catnav">${CATS.map((c) => `<a class="chip dark" href="#${c.key}">${c.en}<span class="n">${ITEMS.filter((p) => p.category === c.key).length}</span></a>`).join("")}</div>
        <input class="search" type="search" placeholder="학명 · 국명 · 태그 검색" aria-label="검색">
      </div></div>
      <div class="wrap">
        <div class="tagpanel">
          ${row(K.groupLabel, ["group"], false)}
          ${row("Genus", ["genus"], false)}
          ${row("Native", ["origin"], false)}
          ${row("Locality", ["locality"], false)}
          ${row("채집자 · 기타", ["collector", "tag"], false)}
        </div>
        <div id="active"></div>
        <div id="cats"></div>
      </div>`;

    const closed = new Set(); // 접어 둔 대분류·중분류 키
    const match = (p) => {
      const tags = tagsOf(p, K).map((t) => t.label);
      if (state.tag && !tags.includes(state.tag)) return false;
      if (!state.q) return true;
      const hay = [p.scientificName, p.koreanName, p.author, ...tags, ...(p.aliases || [])].join(" ").toLowerCase(); // aliases = 화면에는 안 보이는 검색용 다른 이름
      return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
    };

    // 소분류: 중분류(Tribe·Family) 안에서 속(Genus)별로 한 번 더 묶기 (속 이름 abc 순, 그 안은 학명 abc 순). 속을 모르면 제목 없이 바로 표시
    const genusBlocks = (items) => {
      const gs = [];
      items.forEach((p) => {
        const k = String(p.genus || "").replace(/^Genus\s+/, "") || "미분류";
        let o = gs.find((x) => x.k === k);
        if (!o) gs.push((o = { k, items: [] }));
        o.items.push(p);
      });
      return gs.map((o) => `<div class="genus-block">${o.k === "미분류" ? "" : `<div class="genus-head"><small>Genus</small><i>${esc(o.k)}</i><span>${o.items.length}</span></div>`}<div class="grid">${o.items.map(itemCard(K)).join("")}</div></div>`).join("");
    };

    function draw() {
      const list = ITEMS.filter(match);
      $("#active").innerHTML = state.tag || state.q
        ? `<div class="tagrow" style="padding:18px 0 0">${state.tag ? `<a class="chip on" href="${K.list}">${esc(state.tag)} ×</a>` : ""}<span class="count" style="align-self:center">${list.length}종</span></div>`
        : "";
      app.querySelectorAll(".tagpanel .chip").forEach((c) => {
        const on = c.dataset.l === state.tag;
        c.classList.toggle("on", on);
        if (on) c.closest("details").open = true; // 선택된 태그가 있는 줄은 펼쳐 둠
      });

      $("#cats").innerHTML = CATS.map((c, i) => {
        // 중분류(Tribe / Family) → 소분류(Genus) → 학명 abc 순
        const items = list.filter((p) => p.category === c.key).sort((a, b) => cmp(groupOf(a, K), groupOf(b, K)) || cmp(a.genus, b.genus) || cmp(a.scientificName, b.scientificName));
        if (!items.length && (state.tag || state.q)) return "";
        const groups = [];
        items.forEach((p) => {
          const g = groupOf(p, K) || "미분류";
          let o = groups.find((x) => x.g === g);
          if (!o) groups.push((o = { g, items: [] }));
          o.items.push(p);
        });
        const ck = "cat:" + c.key;
        return `<section class="cat" id="${c.key}">
          <details class="fold cat-fold" data-k="${esc(ck)}" ${closed.has(ck) ? "" : "open"}>
          <summary class="cat-head"><span class="no">0${i + 1}</span><h2>${c.en}</h2><span class="count">${items.length}종</span><i class="fold-ico" aria-hidden="true"></i></summary>
          <div class="cat-body">
          ${items.length ? groups.map((g) => {
            const gk = "grp:" + c.key + ":" + g.g;
            return `<details class="fold grp-fold" data-k="${esc(gk)}" ${closed.has(gk) ? "" : "open"}><summary class="group-head">${esc(g.g)} <span>${g.items.length}</span></summary>${K.byGenus.includes(c.key) ? `<div class="grid">${g.items.map(itemCard(K)).join("")}</div>` : genusBlocks(g.items)}</details>`;
          }).join("") : `<div style="margin-top:22px">${empty(`아직 등록된 ${K.noun}이 없습니다.`)}</div>`}
          </div>
          </details>
        </section>`;
      }).join("") || `<div style="padding:48px 0">${empty(`조건에 맞는 ${K.noun}이 없습니다.`)}</div>`;
    }

    // 대분류·중분류 접기/펼치기: 검색·태그로 다시 그려도 접어 둔 상태 유지 (기본은 모두 펼침)
    $("#cats").addEventListener("toggle", (e) => {
      const d = e.target;
      if (!d.matches || !d.matches("details.fold")) return;
      if (d.open) closed.delete(d.dataset.k); else closed.add(d.dataset.k);
    }, true);
    // 상단 분류 버튼을 누르면 해당 대분류를 펼침
    $(".catnav", app).addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      const d = a && document.querySelector(a.getAttribute("href") + " > details.fold");
      if (d) d.open = true;
    });
    $(".search", app).addEventListener("input", (e) => { state.q = e.target.value.trim(); draw(); });
    draw();
  }

  /* ---------- PLANT (detail) ---------- */
  let tdwgCache = null;
  async function loadTDWG() {
    if (tdwgCache) return tdwgCache;
    for (const url of TDWG_SOURCES) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        tdwgCache = await r.json();
        return tdwgCache;
      } catch (e) { /* 다음 소스 시도 */ }
    }
    throw new Error("TDWG 경계 데이터를 불러오지 못했습니다.");
  }

  async function drawMap(el, codes) {
    if (!window.L) { el.innerHTML = '<div class="empty">지도를 불러오지 못했습니다.</div>'; return; }
    // Leaflet 기본 좌표계 = EPSG:3857 (웹 메르카토르), POWO 분포도와 동일한 도법
    const map = L.map(el, { scrollWheelZoom: false, worldCopyJump: true, minZoom: 1, maxZoom: 7, zoomSnap: 0.25 }).setView([15, 100], 2);
    // 배경 지도: OpenStreetMap 기본 타일 (API 키 불필요, 저작권 표기 필수)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    try {
      const gj = await loadTDWG();
      const set = new Set(codes.map((c) => String(c).toUpperCase()));
      const prop = (f, k) => f.properties[k] ?? f.properties[k.toLowerCase()];
      const layer = L.geoJSON(gj, {
        filter: (f) => set.has(String(prop(f, "LEVEL3_COD") || "").toUpperCase()),
        style: { color: "#537f21", weight: 1.2, fillColor: "#537f21", fillOpacity: 0.5 },
        onEachFeature: (f, l) => l.bindTooltip(String(prop(f, "LEVEL3_NAM") || ""), { sticky: true }),
      }).addTo(map);
      if (layer.getLayers().length) map.fitBounds(layer.getBounds(), { padding: [28, 28], maxZoom: 5 });
    } catch (e) {
      const s = $("#map-status");
      if (s) s.textContent = "분포 경계 데이터를 불러오지 못했습니다.";
    }
  }

  function detail(K) {
    const app = $("#app");
    const isPlant = K === KP;
    const p = K.items.find((x) => x.id === param("id"));
    if (!p) { app.innerHTML = `<div class="wrap" style="padding:80px 0">${empty(`${K.noun}을 찾을 수 없습니다.`)}<p style="text-align:center"><a class="more" href="${K.list}">${K.title}로</a></p></div>`; return; }
    document.title = `${p.scientificName} — Time Archive`;
    const c = catOf(p.category, K);
    const photos = photosOf(p);
    const cv = photos[0];
    const inViv = isPlant ? VIVS.filter((v) => (v.plants || []).includes(p.id)) : VIVS.filter((v) => (v.animals || []).includes(p.id));
    // 꽃 사진 탭 (난초 또는 꽃 사진이 있는 식물) — 꽃 사진은 메인 사진·업데이트순에 영향을 주지 않음
    const hasFlowerTab = isPlant && (p.category === "orchid" || (p.flowers || []).length > 0);
    const flowers = hasFlowerTab ? p.flowers || [] : [];
    const flowerGrid = flowers.length
      ? `<div class="tl-grid">${flowers.map((f, i) => `<figure data-lb="${photos.length + i}"><div class="card-img flower"><img src="${esc(f.src)}" alt="${esc(f.caption || p.scientificName + " 꽃")}" loading="lazy"></div>${f.caption || f.credit ? `<figcaption>${esc(f.caption || "")}${f.credit ? `<span class="credit">사진: ${esc(f.credit)}${f.license ? ` · ${f.licenseUrl ? `<a href="${esc(f.licenseUrl)}" target="_blank" rel="noopener">${esc(f.license)}</a>` : esc(f.license)}` : ""}${f.link ? ` · <a href="${esc(f.link)}" target="_blank" rel="noopener">원본</a>` : ""}</span>` : ""}</figcaption>` : ""}</figure>`).join("")}</div>`
      : empty("아직 등록된 꽃 사진이 없습니다.");
    const lbList = [...photos, ...flowers.map((f) => ({ src: f.src, date: f.date, caption: [f.caption, f.credit ? "사진: " + f.credit + (f.license ? " · " + f.license : "") : ""].filter(Boolean).join(" · ") }))];
    const powo = p.powo || `https://powo.science.kew.org/results?q=${encodeURIComponent(p.scientificName)}`;
    const dl = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "");

    // 지도: 자생지(POWO)가 있으면 자생지, 없으면(sp. 등) 이 개체의 산지
    const nativeMap = (p.tdwg || []).length > 0;
    const mapCodes = nativeMap ? p.tdwg : p.localityTdwg || [];
    const mapText = nativeMap ? p.nativeRange || (p.origin || []).join(", ") : p.locality;

    app.innerHTML = `
      <div class="wrap">
        <div class="crumbs"><a href="${K.list}">${K.title}</a><i>/</i><a href="${K.list}#${c.key}">${c.en}</a>${p.group ? `<i>/</i><a href="${K.list}?tag=${encodeURIComponent(p.group)}">${esc(p.group)}</a>` : ""}</div>
        <div class="detail">
          <figure class="detail-photo" style="margin:0" ${cv ? 'data-lb="0"' : ""}>
            ${imgOrPh(p, p.scientificName)}${cv && cv.date ? `<figcaption>${fmtDate(cv.date)}</figcaption>` : ""}
          </figure>
          <div>
            <span class="eyebrow">${c.en}</span>
            <h1 class="sci">${sci(p.scientificName)}</h1>
            ${p.author ? `<div class="author">${esc(p.author)}</div>` : ""}
            ${p.koreanName ? `<p class="kname">${esc(p.koreanName)}</p>` : ""}
            <dl class="info">
              ${dl("학명", `<span class="sci" style="font-size:19px">${sci(p.scientificName)}</span> ${esc(p.author || "")}`)}
              ${dl("국명", esc(p.koreanName) || "—")}
              ${dl("분류", esc([c.en, p.group && p.family && p.group.includes(p.family) ? "" : p.family, p.group, p.genus].filter(Boolean).join(" › ")))}
              ${dl("Native", esc(p.nativeRange || (p.origin || []).join(", ")))}
              ${dl("산지", esc(p.locality))}
              ${dl("서식지 환경", esc(p.habitat))}
              ${dl("해발고도", esc(p.elevation))}
              ${dl("채집자 · 번호", esc(p.collector))}
              ${dl("최근 기록", fmtDate(updated(p)))}
            </dl>
            ${buyBtn(p)}
            <div class="tags">${tagsOf(p, K).map((t) => chip(t, "", K)).join("")}</div>
            ${p.notes ? `<div class="note">${esc(p.notes)}</div>` : ""}
            ${p.sample ? `<div class="note">샘플 데이터입니다. 실제 등록 시 POWO 기준으로 다시 확인합니다.</div>` : ""}
            <div class="sources">
              <h3>Sources · 출처</h3>
              <ul>${((p.sources || []).length || !isPlant ? p.sources || [] : [{ title: "Plants of the World Online (POWO)", url: powo }])
                .map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)} ↗</a>` : esc(s.title)}${s.note ? `<span>${esc(s.note)}</span>` : ""}</li>`)
                .join("")}</ul>
            </div>
          </div>
        </div>
      </div>
      ${mapCodes.length ? `
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">${nativeMap ? "Native Range" : "Locality"}</span><h2>${nativeMap ? "서식지 분포" : "산지"}</h2></div></div>
        <div class="map-box"><div id="map"></div>
          <div class="map-foot"><span class="key">${nativeMap ? "Native" : "산지"}</span><span id="map-status">${esc(mapText)}</span><span class="src">${nativeMap ? K.mapSrc : "산지가 속한 지역 (WGSRPD Level 3)"}</span></div>
        </div>
      </div></section>` : ""}
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Time Archive</span><h2>시간의 기록<small>${photos.length} photos</small></h2></div></div>
        ${hasFlowerTab ? `
        <div class="tabs" role="tablist">
          <button class="tab on" role="tab" data-tab="time">기록 <span>${photos.length}</span></button>
          <button class="tab" role="tab" data-tab="flower">꽃 <span>${flowers.length}</span></button>
        </div>
        <div data-pane="time">${timeline(photos)}</div>
        <div data-pane="flower" hidden>${flowerGrid}</div>` : timeline(photos)}
      </div></section>
      ${inViv.length ? `
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">${isPlant ? "Planted in" : "Lives in"}</span><h2>${isPlant ? "식재된 비바리움" : "함께 사는 비바리움"}</h2></div></div>
        <div class="grid wide">${inViv.map(vivCard).join("")}</div>
      </div></section>` : ""}`;

    bindLightbox(app, lbList);
    const openTab = (name) => {
      app.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
      app.querySelectorAll("[data-pane]").forEach((el) => (el.hidden = el.dataset.pane !== name));
    };
    app.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => openTab(t.dataset.tab)));
    if (hasFlowerTab && location.hash === "#flower") openTab("flower");
    if (mapCodes.length) drawMap($("#map"), mapCodes);
  }

  /* ---------- VIVARIUMS (사이즈별) ---------- */
  function vivariums() {
    const app = $("#app");
    // 사이즈 목록: 작은 사이즈부터
    const sizes = [...new Set(VIVS.map(sizeOf))].sort((a, b) => sizeVol(a) - sizeVol(b) || cmp(a, b));
    let cur = sizes.includes(param("size")) ? param("size") : "";

    app.innerHTML = `
      <div class="page-head"><div class="wrap">
        <span class="eyebrow">Vivarium Archive</span>
        <h1>비바리움 아카이브</h1>
        <p>세팅한 날부터 지금까지. 작은 생태계가 자리 잡아가는 과정을 기록합니다.</p>
      </div></div>
      <div class="toolbar"><div class="wrap">
        <div class="catnav" role="tablist" aria-label="사이즈">
          <button class="chip dark" data-size="">전체<span class="n">${VIVS.length}</span></button>
          ${sizes.map((s) => `<button class="chip dark" data-size="${esc(s)}">${esc(s)}<span class="n">${VIVS.filter((v) => sizeOf(v) === s).length}</span></button>`).join("")}
        </div>
      </div></div>
      <div class="wrap"><div id="sizes"></div></div>`;

    function draw() {
      app.querySelectorAll("[data-size]").forEach((b) => b.classList.toggle("on", b.dataset.size === cur));
      const show = cur ? [cur] : sizes;
      $("#sizes").innerHTML = show.length
        ? show.map((s, i) => {
            // 같은 사이즈 안에서는 순번(id) 순
            const items = VIVS.filter((v) => sizeOf(v) === s).sort((a, b) => cmp(a.no || a.id, b.no || b.id));
            return `<section class="cat" id="${sizeSlug(s)}">
              <div class="cat-head"><span class="no">${String(sizes.indexOf(s) + 1).padStart(2, "0")}</span><h2>${esc(s)}</h2><span class="count">${items.length}개</span></div>
              <div class="grid wide" style="margin-top:26px">${items.map(vivCard).join("")}</div>
            </section>`;
          }).join("")
        : `<div style="padding:48px 0">${empty("등록된 비바리움이 없습니다.")}</div>`;
    }

    app.querySelector(".catnav").addEventListener("click", (e) => {
      const b = e.target.closest("[data-size]");
      if (!b) return;
      cur = b.dataset.size;
      const url = new URL(location.href);
      if (cur) url.searchParams.set("size", cur); else url.searchParams.delete("size");
      history.replaceState(null, "", url);
      draw();
      const top = $("#sizes").getBoundingClientRect().top + scrollY - 140;
      if (scrollY > top) scrollTo({ top, behavior: "smooth" });
    });
    draw();
  }

  function vivarium() {
    const app = $("#app");
    const v = VIVS.find((x) => x.id === param("id"));
    if (!v) { app.innerHTML = `<div class="wrap" style="padding:80px 0">${empty("비바리움을 찾을 수 없습니다.")}</div>`; return; }
    document.title = `${v.name} — Time Archive`;
    const photos = photosOf(v);
    const cv = photos[0];
    const planted = (v.plants || []).map((id) => PLANTS.find((p) => p.id === id)).filter(Boolean);
    const living = (v.animals || []).map((id) => ANIMALS.find((a) => a.id === id)).filter(Boolean);
    const dl = (k, val) => (val ? `<div><dt>${k}</dt><dd>${val}</dd></div>` : "");
    app.innerHTML = `
      <div class="wrap">
        <div class="crumbs"><a href="vivariums.html">비바리움 아카이브</a><i>/</i>${v.size ? `<a href="vivariums.html?size=${encodeURIComponent(v.size)}">${esc(v.size)}</a><i>/</i>` : ""}${esc(v.name)}</div>
        <div class="detail">
          <figure class="detail-photo viv${v.sold ? " is-sold" : ""}" style="margin:0" ${cv ? 'data-lb="0"' : ""}>
            ${v.sold ? '<span class="sold-badge">SOLD</span>' : ""}${imgOrPh(v, v.name)}${cv && cv.date ? `<figcaption>${fmtDate(cv.date)}</figcaption>` : ""}
          </figure>
          <div>
            <span class="eyebrow">Vivarium${v.sold ? ' <span class="sold-tag">· Sold</span>' : ""}</span>
            <h1 class="plain">${esc(v.name)}</h1>
            <dl class="info">
              ${dl("타입", esc(v.type))}
              ${dl("크기", esc(v.size))}
              ${dl("제작일", fmtDate(v.startedAt))}
              ${dl("조명", esc(v.lighting))}
              ${dl("환경", esc(v.environment))}
              ${dl("생물", esc((v.inhabitants || []).join(", ")))}
              ${dl("최근 기록", fmtDate(updated(v)))}
              ${v.sold ? dl("판매", `판매 완료${typeof v.sold === "string" ? " · " + fmtDate(v.sold) : ""}`) : ""}
            </dl>
            ${buyBtn(v)}
            ${(v.tags || []).length ? `<div class="tags">${v.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
            ${v.description ? `<div class="note">${esc(v.description)}</div>` : ""}
            ${v.sample ? `<div class="note">샘플 데이터입니다. 실제 비바리움 등록 시 교체됩니다.</div>` : ""}
          </div>
        </div>
      </div>
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Time Archive</span><h2>시간의 기록<small>${photos.length} photos</small></h2></div></div>
        ${timeline(photos)}
      </div></section>
      ${planted.length ? `
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Plants</span><h2>식재 식물<small>${planted.length} species</small></h2></div></div>
        <div class="grid">${planted.map(plantCard).join("")}</div>
      </div></section>` : ""}
      ${living.length ? `
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Animals</span><h2>함께 사는 생물<small>${living.length} species</small></h2></div></div>
        <div class="grid">${living.map(animalCard).join("")}</div>
      </div></section>` : ""}`;
    bindLightbox(app, photos);
  }

  /* ---------- boot ---------- */
  const page = document.body.dataset.page;
  chrome(page);
  ({
    home, vivariums, vivarium,
    plants: () => archive(KP), plant: () => detail(KP),
    animals: () => archive(KA), animal: () => detail(KA),
  }[page] || (() => {}))();
})();

/* 사진 보호: 우클릭(저장·복사) 메뉴, 끌어서 저장, 모바일 길게 눌러 저장을 막습니다.
   위키미디어 등 외부 라이선스 사진은 원작자 조건상 막지 않습니다. */
(() => {
  const own = (img) => img && img.tagName === "IMG" && new URL(img.currentSrc || img.src, location.href).origin === location.origin;
  const target = (e) => {
    const t = e.target;
    if (own(t)) return t;
    // 라이트박스·카드처럼 사진 위에 겹친 요소에서 우클릭한 경우
    const img = t.closest && t.closest(".card-img, .detail-photo, .lb") ? t.closest(".card-img, .detail-photo, .lb").querySelector("img") : null;
    return own(img) ? img : null;
  };
  document.addEventListener("contextmenu", (e) => { if (target(e)) e.preventDefault(); });
  document.addEventListener("dragstart", (e) => { if (target(e)) e.preventDefault(); });
  // 표시 직후 속성 지정 (끌기 방지)
  const mark = () => document.querySelectorAll("img").forEach((img) => { if (own(img)) { img.draggable = false; img.classList.add("protected"); } });
  new MutationObserver(mark).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  mark();
})();
