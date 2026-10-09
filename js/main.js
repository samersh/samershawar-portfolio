/* Samer Shawar — portfolio interactions */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero video: honor reduced-motion (poster stays as the still) ---- */
  if (reduced) {
    document.querySelectorAll("video.hero-bg, .hv-bg video, .hv-visual video").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }

  /* ---- scroll reveals ---- */
  var revealables = document.querySelectorAll(".reveal, .reveal-line");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- custom cursor: blend-mode disc + contextual label ---- */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduced) {
    var dot = document.createElement("div");
    var disc = document.createElement("div");
    var text = document.createElement("div");
    dot.className = "cursor-dot";
    disc.className = "cursor-disc is-hidden";
    text.className = "cursor-text";
    document.body.appendChild(dot);
    document.body.appendChild(disc);
    document.body.appendChild(text);
    document.body.classList.add("cursor-on");

    var mx = -100, my = -100, dx = -100, dy = -100, seen = false;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      if (!seen) { seen = true; dx = mx; dy = my; disc.classList.remove("is-hidden"); }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { disc.classList.add("is-hidden"); });
    document.addEventListener("mouseenter", function () { disc.classList.remove("is-hidden"); });

    (function follow() {
      dx += (mx - dx) * 0.2;
      dy += (my - dy) * 0.2;
      disc.style.transform = "translate3d(" + dx + "px," + dy + "px,0)";
      text.style.transform = "translate3d(" + dx + "px," + dy + "px,0)";
      requestAnimationFrame(follow);
    })();

    function labelFor(el) {
      if (el.closest(".work-row a, .case-figure, .case-grid-2 figure, .work-preview, [data-cursor='view']")) return "View";
      if (el.closest("a[href^='mailto'], .big-mail")) return "Write";
      if (el.closest("a[target='_blank']")) return "Open";
      if (el.closest("a, button")) return "";
      return null;
    }

    document.addEventListener("mouseover", function (e) {
      var l = labelFor(e.target);
      if (l === null) {
        disc.classList.remove("is-active");
        text.classList.remove("is-active");
        text.textContent = "";
        return;
      }
      disc.classList.add("is-active");
      if (l) { text.textContent = l; text.classList.add("is-active"); }
      else { text.classList.remove("is-active"); text.textContent = ""; }
    });
  }

  /* ---- reading progress on case pages ---- */
  if (document.querySelector(".case-hero")) {
    var bar = document.createElement("div");
    bar.className = "progress-bar";
    document.body.appendChild(bar);
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
          ticking = false;
        });
      }
    }, { passive: true });
  }

  /* ---- active nav section highlight (homepage) ---- */
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navAnchors.length && "IntersectionObserver" in window) {
    var sections = [];
    navAnchors.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) sections.push({ a: a, sec: sec });
    });
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          sections.forEach(function (s) {
            s.a.classList.toggle("active", s.sec === e.target);
          });
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(function (s) { secIO.observe(s.sec); });
  }

  /* ---- footer year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
