(() => {
  const APP_LINKS = {
    appStore: "",
    googlePlay: "",
    support: ""
  };

  const chapters = window.LousaChapters || [];

  const experience = document.getElementById("experience");
  const stage = document.getElementById("stage");
  const video = document.getElementById("masterVideo");
  const finalScene = document.getElementById("finalScene");
  const progressFill = document.getElementById("progressFill");
  const progressButtons = [...document.querySelectorAll("#progressNumbers button")];
  const chapterEls = [...document.querySelectorAll(".chapter")];
  const header = document.querySelector(".site-header");
  const loading = document.getElementById("loading");
  const scrollHint = document.getElementById("scrollHint");
  const storyMeta = document.getElementById("storyMeta");
  const storyMetaIndex = document.getElementById("storyMetaIndex");
  const storyMetaWord = document.getElementById("storyMetaWord");
  const availabilityModal = document.getElementById("availabilityModal");
  const startButton = document.getElementById("startButton");
  const modalClose = document.getElementById("modalClose");
  const modalDone = document.getElementById("modalDone");
  const supportButton = document.getElementById("supportButton");

  let targetTime = 0;
  let easedTime = 0;
  let currentProgress = 0;
  let activeId = "hero";
  let videoReady = false;
  let rafId = 0;
  let lastFrame = performance.now();
  let seeking = false;
  let activeStoryId = "";

  const storyBeats = {
    hero: { index: "I / VII", word: "DISCOVER" },
    cycle: { index: "II / VII", word: "FOLLOW" },
    insight: { index: "III / VII", word: "NOTICE" },
    wellness: { index: "IV / VII", word: "UNDERSTAND" },
    box: { index: "V / VII", word: "CARE" },
    delivery: { index: "VI / VII", word: "RECEIVE" },
    final: { index: "VII / VII", word: "BEGIN AGAIN" }
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, n) => a + (b - a) * n;

  function chapterForProgress(p) {
    return chapters.find(c => p >= c.start && p <= c.end) || chapters[chapters.length - 1];
  }

  function videoTimeForProgress(p) {
    const c = chapterForProgress(p);
    const local = c.end === c.start ? 0 : clamp((p - c.start) / (c.end - c.start), 0, 1);
    return lerp(c.t0, c.t1, local);
  }

  function updateChapterUI(p) {
    const c = chapterForProgress(p);
    if (c.id !== activeId) activeId = c.id;

    chapterEls.forEach(el => el.classList.toggle("is-active", el.dataset.chapter === c.id));
    progressButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.jump === c.id));
    progressFill.style.height = `${p * 100}%`;
    stage.style.setProperty("--scroll-progress", p.toFixed(4));
    stage.dataset.chapter = c.id;

    if (c.id !== activeStoryId) {
      activeStoryId = c.id;
      const beat = storyBeats[c.id];
      if (beat && storyMeta) {
        storyMeta.classList.remove("is-changing");
        storyMetaIndex.textContent = beat.index;
        storyMetaWord.textContent = beat.word;
        void storyMeta.offsetWidth;
        storyMeta.classList.add("is-changing");
      }
    }

    const focus = window.matchMedia("(max-width: 900px)").matches ? c.mobilePosition : c.desktopPosition;
    video.style.objectPosition = focus;
    finalScene.style.objectPosition = focus;

    const finalFade = clamp((p - 0.948) / 0.020, 0, 1);
    finalScene.style.opacity = finalFade.toFixed(3);

    if (p > 0.03) scrollHint.style.opacity = "0";
    else scrollHint.style.opacity = "1";

    header.classList.toggle("compact", p > 0.025 || window.scrollY > 24);

    const veil = document.querySelector(".video-veil");
    if (c.id === "box") {
      veil.style.opacity = "0.36";
    } else if (c.id === "delivery") {
      veil.style.opacity = "0.72";
    } else if (c.id === "final") {
      veil.style.opacity = "0.88";
    } else {
      veil.style.opacity = "0.92";
    }
  }

  function measureProgress() {
    const rect = experience.getBoundingClientRect();
    const scrollable = experience.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-rect.top / scrollable, 0, 1);
  }

  function onScroll() {
    currentProgress = measureProgress();
    targetTime = videoTimeForProgress(currentProgress);
    updateChapterUI(currentProgress);
  }

  function scrubLoop(now) {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA && Number.isFinite(video.duration)) {
      // Time-based damping keeps the feeling identical at 60Hz and 120Hz.
      // It also lets the film gently settle when the user stops scrolling.
      const frameSeconds = Math.min((now - lastFrame) / 1000, 0.05);
      const follow = 1 - Math.exp(-frameSeconds * 5.8);
      easedTime += (targetTime - easedTime) * follow;

      // Do not queue a second expensive media seek before the browser completes
      // the first one. This avoids flashes and dropped frames on mobile Safari.
      if (!seeking && Math.abs(video.currentTime - easedTime) > (1 / 48)) {
        try { video.currentTime = easedTime; } catch (_) {}
      }
    }
    lastFrame = now;
    rafId = requestAnimationFrame(scrubLoop);
  }

  function jumpToChapter(id) {
    const c = chapters.find(ch => ch.id === id);
    if (!c) return;
    const scrollable = experience.offsetHeight - window.innerHeight;
    const mid = c.start + (c.end - c.start) * 0.34;
    const top = experience.offsetTop + scrollable * mid;
    window.scrollTo({ top, behavior: "smooth" });
  }

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-jump]");
    if (target) jumpToChapter(target.dataset.jump);
  });

  function openAvailability() {
    const realLink = APP_LINKS.appStore || APP_LINKS.googlePlay;
    if (realLink) {
      window.location.href = realLink;
      return;
    }
    if (typeof availabilityModal.showModal === "function") availabilityModal.showModal();
  }

  startButton?.addEventListener("click", openAvailability);
  modalClose?.addEventListener("click", () => availabilityModal.close());
  modalDone?.addEventListener("click", () => availabilityModal.close());
  supportButton?.addEventListener("click", () => {
    if (APP_LINKS.support) window.location.href = APP_LINKS.support;
    else openAvailability();
  });

  function primeVideo() {
    if (videoReady || video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    videoReady = true;
    easedTime = Math.min(0.01, video.duration || 0.01);
    targetTime = easedTime;
    // A muted play/pause unlock prevents Chromium and mobile Safari from ignoring
    // programmatic seeks on a never-started media element.
    const unlock = video.play();
    if (unlock && typeof unlock.then === "function") {
      unlock.then(() => {
        video.pause();
        try { video.currentTime = easedTime; } catch (_) {}
      }).catch(() => {
        try { video.currentTime = easedTime; } catch (_) {}
      });
    } else {
      try { video.currentTime = easedTime; } catch (_) {}
    }
  }

  video.addEventListener("loadedmetadata", primeVideo);
  video.addEventListener("canplay", primeVideo, { once: true });
  video.addEventListener("seeking", () => { seeking = true; });
  video.addEventListener("seeked", () => { seeking = false; });
  primeVideo();

  video.addEventListener("canplay", () => loading.classList.add("ready"), { once: true });
  setTimeout(() => loading.classList.add("ready"), 3500);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else {
      lastFrame = performance.now();
      scrubLoop(lastFrame);
    }
  });

  updateChapterUI(0);
  onScroll();
  scrubLoop();
})();
