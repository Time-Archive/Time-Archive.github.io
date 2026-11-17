/* Time Archive — 데이터(data/plants.js, data/vivariums.js)를 읽어 모든 페이지를 그립니다. */
(() => {
  "use strict";
  const PLANTS = window.TA_PLANTS || [];
  const VIVS = window.TA_VIVARIUMS || [];

  // 대분류 (순서 고정)
  const CATS = [
    { key: "orchid", ko: "난초", en: "Orchids" },
    { key: "fern", ko: "양치식물", en: "Ferns" },
    { key: "jungle", ko: "정글플랜츠", en: "Jungle Plants" },
    { key: "aroid", ko: "아로이드", en: "Aroids" },
  ];
  const catOf = (k) => CATS.find((c) => c.key === k) || { key: k, ko: k || "기타", en: "" };

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
  const cmp = (a, b) => String(a || "").localeCompare(String(b || ""), "en", { sensitivity: "base" });

  // 학명 이탤릭 처리 (sp., cf., var. 및 'Cultivar' 는 정체)
  const sci = (name) =>
    String(name || "")
      .split(/\s+/)
      .map((w) => (/^(sp\.|spp\.|cf\.|aff\.|var\.|subsp\.|ssp\.|f\.|×|x)$/i.test(w) || /^['‘"(]/.test(w) || /['’")]$/.test(w) ? esc(w) : `<i>${esc(w)}</i>`))
      .join(" ");

  // 식물 하나의 태그 목록: 대분류 / 중분류 / 소분류 / 원산지 / 채집자 / 기타
  const tagsOf = (p) => {
    const t = [{ t: "cat", label: catOf(p.category).en }];
    if (p.group) t.push({ t: "group", label: p.group });
    if (p.genus) t.push({ t: "genus", label: p.genus });
    (p.origin || []).forEach((o) => t.push({ t: "origin", label: o }));
    if (p.collector) t.push({ t: "collector", label: p.collector });
    (p.tags || []).forEach((x) => t.push({ t: "tag", label: x }));
    return t;
  };
  const chip = (tag, extra = "") =>
    `<a class="chip ${extra}" data-t="${tag.t}" data-l="${esc(tag.label)}" href="plants.html?tag=${encodeURIComponent(tag.label)}">${esc(tag.label)}${tag.n ? `<span class="n">${tag.n}</span>` : ""}</a>`;

  const imgOrPh = (it, label) => {
    const c = cover(it);
    return c ? `<img src="${esc(c.src)}" alt="${esc(label)}" loading="lazy">` : `<div class="ph">${esc(String(label || "?").trim().charAt(0))}</div>`;
  };

  const plantCard = (p) => `
    <a class="card" href="plant.html?id=${encodeURIComponent(p.id)}">
      <div class="card-img">${p.sample ? '<span class="badge">SAMPLE</span>' : ""}${imgOrPh(p, p.scientificName)}</div>
      <div class="card-body">
        <span class="card-kicker">${esc([catOf(p.category).en, p.genus].filter(Boolean).join(" · "))}</span>
        <h3 class="sci">${sci(p.scientificName)}</h3>
        <span class="card-meta">${esc([p.koreanName, fmtDate(updated(p))].filter(Boolean).join(" · "))}</span>
      </div>
    </a>`;

  const vivCard = (v) => `
    <a class="card" href="vivarium.html?id=${encodeURIComponent(v.id)}">
      <div class="card-img">${v.sample ? '<span class="badge">SAMPLE</span>' : ""}${imgOrPh(v, v.name)}</div>
      <div class="card-body">
        <span class="card-kicker">${esc([v.type, v.size].filter(Boolean).join(" · ") || "Vivarium")}</span>
        <h3 class="plain">${esc(v.name)}</h3>
        <span class="card-meta">${esc([v.startedAt ? "세팅 " + fmtDate(v.startedAt) : "", updated(v) ? "업데이트 " + fmtDate(updated(v)) : ""].filter(Boolean).join(" · "))}</span>
      </div>
    </a>`;

  const empty = (msg) => `<div class="empty">${esc(msg)}</div>`;

  /* ---------- header / footer ---------- */
  function chrome(page) {
    const on = (keys) => (keys.includes(page) ? "on" : "");
    $("#header").innerHTML = `
      <header class="site-header"><div class="wrap">
        <a class="brand" href="index.html" aria-label="Time Archive 홈"><img src="assets/img/logo-trim.png" alt="Time Archive"></a>
        <nav class="nav">
          <a class="${on(["home"])}" href="index.html">Home</a>
          <a class="${on(["plants", "plant"])}" href="plants.html">식물 아카이브</a>
          <a class="${on(["vivariums", "vivarium"])}" href="vivariums.html">비바리움 아카이브</a>
        </nav>
      </div></header>`;
    $("#footer").innerHTML = `
      <footer class="site-footer"><div class="wrap">
        <b><span>Time</span> Archive</b>
        <small>식물과 비바리움의 시간을 기록하고, 보관합니다. © ${new Date().getFullYear()} Time Archive</small>
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
  function home() {
    const plants = [...PLANTS].sort(byUpdated);
    const vivs = [...VIVS].sort(byUpdated);
    $("#home-plants").innerHTML = plants.length ? plants.slice(0, 12).map(plantCard).join("") : empty("등록된 식물이 없습니다.");
    $("#home-vivs").innerHTML = vivs.length ? vivs.slice(0, 6).map(vivCard).join("") : empty("등록된 비바리움이 없습니다.");
    $("#home-plants-count").textContent = `${PLANTS.length} species`;
    $("#home-vivs-count").textContent = `${VIVS.length} vivariums`;
  }

  /* ---------- PLANTS (archive) ---------- */
  function plants() {
    const app = $("#app");
    const state = { tag: param("tag") || "", q: "" };

    // 전체 태그 집계
    const tally = {};
    PLANTS.forEach((p) => tagsOf(p).forEach((t) => {
      if (t.t === "cat") return;
      const k = t.t + "|" + t.label;
      tally[k] = tally[k] || { ...t, n: 0 };
      tally[k].n++;
    }));
    const tagList = (types) => Object.values(tally).filter((t) => types.includes(t.t)).sort((a, b) => cmp(a.label, b.label));
    const row = (title, types, open) => {
      const l = tagList(types);
      return l.length ? `<details ${open ? "open" : ""}><summary>${title} (${l.length})</summary><div class="tagrow">${l.map((t) => chip(t)).join("")}</div></details>` : "";
    };

    app.innerHTML = `
      <div class="page-head"><div class="wrap">
        <span class="eyebrow">Plant Archive</span>
        <h1>식물 아카이브</h1>
        <p>Orchids, Ferns, Jungle Plants, Aroids. 종마다 쌓여가는 시간을 분류군별로 보관합니다.</p>
      </div></div>
      <div class="toolbar"><div class="wrap">
        <div class="catnav">${CATS.map((c) => `<a class="chip dark" href="#${c.key}">${c.en}<span class="n">${PLANTS.filter((p) => p.category === c.key).length}</span></a>`).join("")}</div>
        <input class="search" type="search" placeholder="학명 · 국명 · 태그 검색" aria-label="검색">
      </div></div>
      <div class="wrap">
        <div class="tagpanel">
          ${row("분류군", ["group", "genus"], true)}
          ${row("원산지", ["origin"], false)}
          ${row("채집자 · 기타", ["collector", "tag"], false)}
        </div>
        <div id="active"></div>
        <div id="cats"></div>
      </div>`;

    const match = (p) => {
      const tags = tagsOf(p).map((t) => t.label);
      if (state.tag && !tags.includes(state.tag)) return false;
      if (!state.q) return true;
      const hay = [p.scientificName, p.koreanName, p.author, ...tags].join(" ").toLowerCase();
      return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
    };

    function draw() {
      const list = PLANTS.filter(match);
      $("#active").innerHTML = state.tag || state.q
        ? `<div class="tagrow" style="padding:18px 0 0">${state.tag ? `<a class="chip on" href="plants.html">${esc(state.tag)} ×</a>` : ""}<span class="count" style="align-self:center">${list.length}종</span></div>`
        : "";
      app.querySelectorAll(".tagpanel .chip").forEach((c) => c.classList.toggle("on", c.dataset.l === state.tag));

      $("#cats").innerHTML = CATS.map((c, i) => {
        // 중분류 → 소분류 → 학명 abc 순
        const items = list.filter((p) => p.category === c.key).sort((a, b) => cmp(a.group, b.group) || cmp(a.genus, b.genus) || cmp(a.scientificName, b.scientificName));
        if (!items.length && (state.tag || state.q)) return "";
        const groups = [];
        items.forEach((p) => {
          const g = p.group || "미분류";
          let o = groups.find((x) => x.g === g);
          if (!o) groups.push((o = { g, items: [] }));
          o.items.push(p);
        });
        return `<section class="cat" id="${c.key}">
          <div class="cat-head"><span class="no">0${i + 1}</span><h2>${c.en}</h2><span class="count">${items.length}종</span></div>
          ${items.length ? groups.map((g) => `<div class="group-head">${esc(g.g)} <span>${g.items.length}</span></div><div class="grid">${g.items.map(plantCard).join("")}</div>`).join("") : `<div style="margin-top:22px">${empty("아직 등록된 식물이 없습니다.")}</div>`}
        </section>`;
      }).join("") || `<div style="padding:48px 0">${empty("조건에 맞는 식물이 없습니다.")}</div>`;
    }

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

  function plant() {
    const app = $("#app");
    const p = PLANTS.find((x) => x.id === param("id"));
    if (!p) { app.innerHTML = `<div class="wrap" style="padding:80px 0">${empty("식물을 찾을 수 없습니다.")}<p style="text-align:center"><a class="more" href="plants.html">식물 아카이브로</a></p></div>`; return; }
    document.title = `${p.scientificName} — Time Archive`;
    const c = catOf(p.category);
    const photos = photosOf(p);
    const cv = photos[0];
    const inViv = VIVS.filter((v) => (v.plants || []).includes(p.id));
    // 꽃 사진 탭 (난초만) — 꽃 사진은 메인 사진·업데이트순에 영향을 주지 않음
    const hasFlowerTab = p.category === "orchid";
    const flowers = hasFlowerTab ? p.flowers || [] : [];
    const flowerGrid = flowers.length
      ? `<div class="tl-grid">${flowers.map((f, i) => `<figure data-lb="${photos.length + i}"><div class="card-img"><img src="${esc(f.src)}" alt="${esc(f.caption || p.scientificName + " 꽃")}" loading="lazy"></div>${f.caption || f.credit ? `<figcaption>${esc(f.caption || "")}${f.credit ? `<span class="credit">사진 출처: ${esc(f.credit)}</span>` : ""}</figcaption>` : ""}</figure>`).join("")}</div>`
      : empty("아직 등록된 꽃 사진이 없습니다.");
    const lbList = [...photos, ...flowers.map((f) => ({ src: f.src, date: f.date, caption: [f.caption, f.credit ? "사진 출처: " + f.credit : ""].filter(Boolean).join(" · ") }))];
    const powo = p.powo || `https://powo.science.kew.org/results?q=${encodeURIComponent(p.scientificName)}`;
    const dl = (k, v) => (v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : "");

    app.innerHTML = `
      <div class="wrap">
        <div class="crumbs"><a href="plants.html">식물 아카이브</a><i>/</i><a href="plants.html#${c.key}">${c.en}</a>${p.group ? `<i>/</i><a href="plants.html?tag=${encodeURIComponent(p.group)}">${esc(p.group)}</a>` : ""}</div>
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
              ${dl("분류", esc([c.en, p.family, p.group, p.genus].filter(Boolean).join(" › ")))}
              ${dl("원산지", esc(p.nativeRange || (p.origin || []).join(", ")))}
              ${dl("서식지 환경", esc(p.habitat))}
              ${dl("해발고도", esc(p.elevation))}
              ${dl("채집자", esc(p.collector))}
              ${dl("최근 기록", fmtDate(updated(p)))}
            </dl>
            <div class="tags">${tagsOf(p).map((t) => chip(t)).join("")}</div>
            ${p.notes ? `<div class="note">${esc(p.notes)}</div>` : ""}
            ${p.sample ? `<div class="note">샘플 데이터입니다. 실제 등록 시 POWO 기준으로 다시 확인합니다.</div>` : ""}
            <div class="sources">
              <h3>Sources · 출처</h3>
              <ul>${((p.sources || []).length ? p.sources : [{ title: "Plants of the World Online (POWO)", url: powo }])
                .map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)} ↗</a>` : esc(s.title)}${s.note ? `<span>${esc(s.note)}</span>` : ""}</li>`)
                .join("")}</ul>
            </div>
          </div>
        </div>
      </div>
      ${(p.tdwg || []).length ? `
      <section class="section"><div class="wrap">
        <div class="section-head"><div><span class="eyebrow">Native Range</span><h2>서식지 분포</h2></div></div>
        <div class="map-box"><div id="map"></div>
          <div class="map-foot"><span class="key">Native</span><span id="map-status">${esc(p.nativeRange || (p.origin || []).join(", "))}</span><span class="src">Source: POWO / WGSRPD Level 3</span></div>
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
        <div class="section-head"><div><span class="eyebrow">Planted in</span><h2>식재된 비바리움</h2></div></div>
        <div class="grid wide">${inViv.map(vivCard).join("")}</div>
      </div></section>` : ""}`;

    bindLightbox(app, lbList);
    const openTab = (name) => {
      app.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
      app.querySelectorAll("[data-pane]").forEach((el) => (el.hidden = el.dataset.pane !== name));
    };
    app.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => openTab(t.dataset.tab)));
    if (hasFlowerTab && location.hash === "#flower") openTab("flower");
    if ((p.tdwg || []).length) drawMap($("#map"), p.tdwg);
  }

  /* ---------- VIVARIUMS ---------- */
  function vivariums() {
    const list = [...VIVS].sort(byUpdated);
    $("#app").innerHTML = `
      <div class="page-head"><div class="wrap">
        <span class="eyebrow">Vivarium Archive</span>
        <h1>비바리움 아카이브</h1>
        <p>세팅한 날부터 지금까지. 작은 생태계가 자리 잡아가는 과정을 기록합니다.</p>
      </div></div>
      <section class="section"><div class="wrap">
        <div class="section-head"><span class="count">${list.length} vivariums · 업데이트순</span></div>
        ${list.length ? `<div class="grid wide">${list.map(vivCard).join("")}</div>` : empty("등록된 비바리움이 없습니다.")}
      </div></section>`;
  }

  function vivarium() {
    const app = $("#app");
    const v = VIVS.find((x) => x.id === param("id"));
    if (!v) { app.innerHTML = `<div class="wrap" style="padding:80px 0">${empty("비바리움을 찾을 수 없습니다.")}</div>`; return; }
    document.title = `${v.name} — Time Archive`;
    const photos = photosOf(v);
    const cv = photos[0];
    const planted = (v.plants || []).map((id) => PLANTS.find((p) => p.id === id)).filter(Boolean);
    const dl = (k, val) => (val ? `<div><dt>${k}</dt><dd>${val}</dd></div>` : "");
    app.innerHTML = `
      <div class="wrap">
        <div class="crumbs"><a href="vivariums.html">비바리움 아카이브</a><i>/</i>${esc(v.name)}</div>
        <div class="detail">
          <figure class="detail-photo" style="margin:0;aspect-ratio:4/3" ${cv ? 'data-lb="0"' : ""}>
            ${imgOrPh(v, v.name)}${cv && cv.date ? `<figcaption>${fmtDate(cv.date)}</figcaption>` : ""}
          </figure>
          <div>
            <span class="eyebrow">Vivarium</span>
            <h1 class="plain">${esc(v.name)}</h1>
            <dl class="info">
              ${dl("타입", esc(v.type))}
              ${dl("크기", esc(v.size))}
              ${dl("세팅일", fmtDate(v.startedAt))}
              ${dl("조명", esc(v.lighting))}
              ${dl("환경", esc(v.environment))}
              ${dl("생물", esc((v.inhabitants || []).join(", ")))}
              ${dl("최근 기록", fmtDate(updated(v)))}
            </dl>
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
      </div></section>` : ""}`;
    bindLightbox(app, photos);
  }

  /* ---------- boot ---------- */
  const page = document.body.dataset.page;
  chrome(page);
  ({ home, plants, plant, vivariums, vivarium }[page] || (() => {}))();
})();
