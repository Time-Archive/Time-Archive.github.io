/* Time Archive — 스크롤 애니메이션. 화면에 들어오는 요소에 .in 을 붙이면 motion.css 가 움직임을 처리합니다. */
(() => {
  "use strict";
  const root = document.documentElement;
  // "동작 줄이기"를 켠 기기나 오래된 브라우저에서는 애니메이션 없이 그대로 보여줌
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    root.classList.remove("motion");
    return;
  }
  window.__taMotion = true;
  root.classList.add("motion");

  // motion.css 의 목록과 같아야 합니다
  const SEL = [
    ".hero .eyebrow", ".hero h1", ".hero p", ".hero .btns", ".hero-logo",
    ".concept > div", ".section-head", ".card", ".page-head .wrap > *",
    ".tagpanel", ".cat-head", ".group-head", ".crumbs", ".detail > *",
    ".map-box", ".tabs", ".tl-date", ".tl-grid figure", ".empty",
    ".site-footer .wrap > *",
  ].join(",");

  const STAGGER = 80; // 같이 등장하는 요소 사이의 시간차(ms)
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.style.transitionDelay = Math.min(i++, 8) * STAGGER + "ms";
        el.classList.add("in");
        io.unobserve(el);
        setTimeout(() => (el.style.transitionDelay = ""), 1600);
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
  );

  const seen = new WeakSet();
  const scan = () =>
    document.querySelectorAll(SEL).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
  scan();

  // 갤러리·상세 페이지는 app.js 가 나중에 그리므로, 새로 생긴 요소도 계속 찾아서 등록
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });

  // 스크롤 진행 막대 + 상단 메뉴 그림자
  const bar = document.createElement("div");
  bar.className = "ta-progress";
  document.body.appendChild(bar);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      const h = document.querySelector(".site-header");
      if (h) h.classList.toggle("scrolled", scrollY > 8);
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
})();
