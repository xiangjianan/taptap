const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 主标题逐字弹入 ---------- */

const heroTitle = document.querySelector("#hero-title");

if (heroTitle && !prefersReducedMotion) {
  const text = heroTitle.textContent.trim();
  heroTitle.setAttribute("aria-label", text);
  heroTitle.textContent = "";

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "char";
    span.style.setProperty("--i", index);
    span.textContent = char;
    span.setAttribute("aria-hidden", "true");
    heroTitle.appendChild(span);
  });
}

/* ---------- 截图切换（淡入淡出 + 预加载） ---------- */

const activeShot = document.querySelector("#active-shot");
const shotStage = document.querySelector(".screenshot-stage");
const shotButtons = document.querySelectorAll(".shot-button");

shotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("is-active")) return;

    shotButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    const nextSrc = button.dataset.shot;
    const nextAlt = button.dataset.alt;

    if (prefersReducedMotion || !shotStage) {
      activeShot.src = nextSrc;
      activeShot.alt = nextAlt;
      return;
    }

    const preloader = new Image();
    preloader.onload = () => {
      shotStage.classList.add("is-switching");
      window.setTimeout(() => {
        activeShot.src = nextSrc;
        activeShot.alt = nextAlt;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => shotStage.classList.remove("is-switching"));
        });
      }, 240);
    };
    preloader.src = nextSrc;
  });
});

/* ---------- 区块入场揭示 + settled 标记 ---------- */

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        window.setTimeout(() => entry.target.classList.add("settled"), 1300);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

/* ---------- 头部状态 + 滚动进度条 ---------- */

const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress");

const updateScrollState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);

  if (progressBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  }
};

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

/* ---------- 亮点数字滚动计数 ---------- */

const statNumbers = document.querySelectorAll(".hero-stats dt");

const animateCount = (el) => {
  const target = Number(el.dataset.count || "0");
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = 1100;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

if (statNumbers.length) {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          statNumbers.forEach((el) => {
            if (prefersReducedMotion) {
              el.textContent = `${el.dataset.prefix || ""}${el.dataset.count}${el.dataset.suffix || ""}`;
            } else {
              animateCount(el);
            }
          });
          statsObserver.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );

  statsObserver.observe(document.querySelector(".hero-stats"));
}

/* ---------- Hero 鼠标视差 ---------- */

const hero = document.querySelector(".hero");
const heroBoard = document.querySelector(".hero-board");
const polys = document.querySelectorAll(".poly");

if (hero && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  const renderParallax = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    polys.forEach((poly, index) => {
      const depth = ((index % 3) + 1) * 7;
      poly.style.translate = `${(-currentX * depth).toFixed(2)}px ${(-currentY * depth).toFixed(2)}px`;
    });

    if (heroBoard) {
      heroBoard.style.transform = `translate3d(${(currentX * 10).toFixed(2)}px, ${(currentY * 10).toFixed(2)}px, 0)`;
    }

    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      rafId = requestAnimationFrame(renderParallax);
    } else {
      rafId = null;
    }
  };

  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width - 0.5;
    targetY = (event.clientY - rect.top) / rect.height - 0.5;
    if (rafId === null) rafId = requestAnimationFrame(renderParallax);
  });

  hero.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
    if (rafId === null) rafId = requestAnimationFrame(renderParallax);
  });
}
