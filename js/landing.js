/* ============================================================
   Samer Shawar — landing experience
   Lenis smooth scroll · GSAP choreography · Three.js signature
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 52rem)").matches;
  var hasGSAP = typeof gsap !== "undefined";
  var hasST = typeof ScrollTrigger !== "undefined";

  if (hasGSAP && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenisStarted = false;
  function initLenis() {
    if (lenisStarted || reduced || typeof Lenis === "undefined" || !hasGSAP || !hasST) return;
    lenisStarted = true;
    var lenis = new Lenis({ lerp: 0.105, wheelMultiplier: 1.0 });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis-on");

    // anchor links route through lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.querySelector(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -56, duration: 1.2 });
        }
      });
    });
  }
  initLenis();
  if (!lenisStarted) {
    window.addEventListener("load", initLenis);
    var lenisTries = 0;
    var lenisPoll = setInterval(function () {
      initLenis();
      if (lenisStarted || ++lenisTries > 20) clearInterval(lenisPoll);
    }, 250);
  }

  /* ---------------- hero load choreography ---------------- */
  if (hasGSAP && !reduced) {
    document.body.classList.add("fx-on");

    // split headline lines into words -> characters (words never break mid-wrap)
    var lines = document.querySelectorAll(".hero h1 .reveal-line > span");
    lines.forEach(function (line) {
      var tokens = [];
      function collect(node, em) {
        if (node.nodeType === 3) {
          node.textContent.split("").forEach(function (ch) {
            tokens.push(ch === " " ? { space: true } : { ch: ch, em: em });
          });
        } else if (node.nodeType === 1) {
          Array.prototype.forEach.call(node.childNodes, function (n) {
            collect(n, em || node.tagName === "EM");
          });
        }
      }
      var tmp = document.createElement("div");
      tmp.innerHTML = line.innerHTML;
      Array.prototype.forEach.call(tmp.childNodes, function (n) { collect(n, false); });

      var frag = document.createDocumentFragment();
      var word = null;
      tokens.forEach(function (t) {
        if (t.space) {
          frag.appendChild(document.createTextNode(" "));
          word = null;
        } else {
          if (!word) {
            word = document.createElement("span");
            word.className = "word";
            frag.appendChild(word);
          }
          var s = document.createElement("span");
          s.className = "ch" + (t.em ? " em-ch" : "");
          s.textContent = t.ch;
          word.appendChild(s);
        }
      });
      line.innerHTML = "";
      line.appendChild(frag);
    });

    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".site-nav", { yPercent: -120, duration: 0.9 }, 0.1)
      .from(".hero-meta > *", { y: 24, autoAlpha: 0, stagger: 0.12, duration: 0.8 }, 0.35)
      .from(".hero h1 .ch", {
        yPercent: 130,
        rotateZ: function () { return gsap.utils.random(-8, 8); },
        autoAlpha: 0,
        duration: 1.1,
        stagger: { each: 0.018, from: "start" }
      }, 0.5)
      .from(".hero-foot > *", { y: 26, autoAlpha: 0, stagger: 0.14, duration: 0.9 }, "-=0.55");

    /* hero parallax out on scroll */
    gsap.to(".hero h1", {
      yPercent: -12, autoAlpha: 0.25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "bottom 90%", end: "bottom 30%", scrub: true }
    });

    /* marquee: infinite drift + scroll-velocity skew */
    var track = document.querySelector(".marquee-track");
    if (track) {
      var drift = gsap.to(track, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
      ScrollTrigger.create({
        onUpdate: function (self) {
          var v = gsap.utils.clamp(-12, 12, self.getVelocity() / 220);
          gsap.to(track, { skewX: v, duration: 0.4, overwrite: "auto" });
          drift.timeScale(gsap.utils.clamp(0.4, 4, 1 + Math.abs(self.getVelocity()) / 1200));
          gsap.to(drift, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: "auto" });
        }
      });
    }

    /* portrait + work thumbs gentle parallax */
    gsap.utils.toArray(".about-aside img, .work-thumb").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: "none",
        scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* magnetic nav links + mail (desktop) */
    if (!isMobile) {
      document.querySelectorAll(".nav-links a, .big-mail").forEach(function (el) {
        var strength = el.classList.contains("big-mail") ? 14 : 7;
        el.addEventListener("mousemove", function (e) {
          var r = el.getBoundingClientRect();
          gsap.to(el, {
            x: ((e.clientX - r.left) / r.width - 0.5) * strength,
            y: ((e.clientY - r.top) / r.height - 0.5) * strength,
            duration: 0.4, ease: "power3.out"
          });
        });
        el.addEventListener("mouseleave", function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
        });
      });
    }
  }

  /* ---------------- Three.js — signature particle field ---------------- */
  var canvasHost = document.getElementById("hero-webgl");
  if (!canvasHost || reduced || typeof THREE === "undefined") return;

  var heroSigImg = document.querySelector(".hero-sig");
  if (heroSigImg) heroSigImg.style.display = "none"; // particles replace the static signature

  var heroEl = document.querySelector(".hero");
  var W = canvasHost.clientWidth || (heroEl && heroEl.offsetWidth) || window.innerWidth;
  var H = canvasHost.clientHeight || (heroEl && heroEl.offsetHeight) || window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  canvasHost.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.z = 30;

  var COUNT = isMobile ? 2600 : 6500;

  var img = new Image();
  img.src = "assets/img/signature.png";
  img.onload = function () {
    // sample dark (inked) pixels from the signature
    var sw = 300, sh = Math.round(300 * img.height / img.width);
    var cv = document.createElement("canvas");
    cv.width = sw; cv.height = sh;
    var cx = cv.getContext("2d");
    cx.drawImage(img, 0, 0, sw, sh);
    var data = cx.getImageData(0, 0, sw, sh).data;
    var inked = [];
    for (var y = 0; y < sh; y++) {
      for (var x = 0; x < sw; x++) {
        if (data[(y * sw + x) * 4 + 3] > 110) inked.push([x, y]);
      }
    }
    if (!inked.length) return;

    // size & place the signature from the camera frustum so it always fits
    var visH = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360);
    var visW = visH * camera.aspect;
    var spanX = Math.min(isMobile ? visW * 0.85 : visW * 0.46, 24);
    var spanY = spanX * sh / sw;
    // repulsion radius == the cursor ring (~20px), converted to world units
    var RREP = 20 * (visW / W);
    var R2 = RREP * RREP;
    var targets = new Float32Array(COUNT * 3);
    var positions = new Float32Array(COUNT * 3);
    var seeds = new Float32Array(COUNT * 3);
    var colors = new Float32Array(COUNT * 3);
    var cA = new THREE.Color(0x54a2ff), cB = new THREE.Color(0xeef2f8), cC = new THREE.Color(0x3b82f6);

    for (var i = 0; i < COUNT; i++) {
      var p = inked[Math.floor(Math.random() * inked.length)];
      // jitter inside the sampled pixel for organic density
      var tx = (p[0] / sw - 0.5) * spanX + (Math.random() - 0.5) * 0.08;
      var ty = -(p[1] / sh - 0.5) * spanY + (Math.random() - 0.5) * 0.08;
      var tz = (Math.random() - 0.5) * 0.9;
      targets.set([tx, ty, tz], i * 3);
      // start scattered in a wide shell
      var r = 26 + Math.random() * 14;
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      positions.set([
        r * Math.sin(ph) * Math.cos(th),
        r * Math.sin(ph) * Math.sin(th) * 0.6,
        (Math.random() - 0.5) * 18
      ], i * 3);
      seeds.set([Math.random() * Math.PI * 2, 0.5 + Math.random(), Math.random()], i * 3);
      var c = Math.random() < 0.72 ? cA : (Math.random() < 0.6 ? cB : cC);
      colors.set([c.r, c.g, c.b], i * 3);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // soft round sprite
    var dotCv = document.createElement("canvas");
    dotCv.width = dotCv.height = 64;
    var dctx = dotCv.getContext("2d");
    var grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 64, 64);
    var sprite = new THREE.CanvasTexture(dotCv);

    var mat = new THREE.PointsMaterial({
      size: isMobile ? 0.16 : 0.13,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    var points = new THREE.Points(geo, mat);
    // position signature: upper-right on desktop, centered-upper on mobile — clamped inside view
    var px0 = isMobile ? 0 : Math.min(visW * 0.24, visW / 2 - spanX / 2 - 0.5);
    var py0 = isMobile
      ? (visH / 2 - spanY / 2 - 1.2)
      : Math.min(visH * 0.20, visH / 2 - spanY / 2 - 0.5);
    points.position.set(Math.max(0, px0), Math.max(0, py0), 0);
    points.rotation.z = -0.12;
    scene.add(points);

    var mouse = { x: 0, y: 0, wx: 0, wy: 0 };
    document.addEventListener("mousemove", function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    var start = performance.now();
    var CONVERGE = 2600; // ms
    var scrollFade = 0;  // 0 = hero in view, 1 = fully scrolled away

    if (hasGSAP && hasST) {
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: "bottom 20%",
        onUpdate: function (self) { scrollFade = self.progress; }
      });
    }

    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        running = en[0].isIntersecting;
      }).observe(canvasHost);
    }

    function ease(t) { return 1 - Math.pow(1 - t, 4); }

    function tick(now) {
      requestAnimationFrame(tick);
      if (!running) return;
      var t = (now - start);
      var pos = geo.attributes.position.array;
      // smooth the mouse in world units (exact frustum mapping)
      mouse.wx += ((mouse.x * visW / 2) - mouse.wx) * 0.18;
      mouse.wy += ((mouse.y * visH / 2) - mouse.wy) * 0.18;

      for (var i = 0; i < COUNT; i++) {
        var i3 = i * 3;
        var delay = seeds[i3 + 2] * 700;
        var k = ease(Math.min(Math.max((t - delay) / CONVERGE, 0), 1));
        var fx = targets[i3]     + Math.sin(t * 0.00045 * seeds[i3 + 1] + seeds[i3]) * 0.10;
        var fy = targets[i3 + 1] + Math.cos(t * 0.00050 * seeds[i3 + 1] + seeds[i3]) * 0.10;
        var fz = targets[i3 + 2];

        var px = pos[i3] + (fx - pos[i3]) * (0.04 + 0.10 * k);
        var py = pos[i3 + 1] + (fy - pos[i3 + 1]) * (0.04 + 0.10 * k);
        var pz = pos[i3 + 2] + (fz - pos[i3 + 2]) * (0.04 + 0.10 * k);

        // cursor repulsion (in points-local space) — radius matched to the cursor ring
        var dx = px - (mouse.wx - points.position.x);
        var dy = py - (mouse.wy - points.position.y);
        var d2 = dx * dx + dy * dy;
        if (d2 < R2 && k > 0.8) {
          var d = Math.sqrt(d2) || 0.001;
          var f = (1 - d / RREP) * 0.30;
          px += (dx / d) * f; py += (dy / d) * f;
        }
        // scroll dispersal
        if (scrollFade > 0.01) {
          px += (px - 0) * scrollFade * 0.05;
          py += scrollFade * 0.6 * seeds[i3 + 1];
        }
        pos[i3] = px; pos[i3 + 1] = py; pos[i3 + 2] = pz;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 0.9 * (1 - scrollFade);
      points.rotation.y = Math.sin(t * 0.00012) * 0.05 + mouse.wx * 0.004;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  };

  window.addEventListener("resize", function () {
    var w = canvasHost.clientWidth || window.innerWidth, h = canvasHost.clientHeight || window.innerHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });
})();

/* ============================================================
   WebGL displacement preview for the work index (desktop).
   A floating plane that shows each project image, distorting
   with cursor velocity (UV ripple + RGB shift) on hover.
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var isMobile = window.matchMedia("(max-width: 52rem)").matches;
  var list = document.querySelector(".work-list");
  if (!list || reduced || !fine || isMobile || typeof THREE === "undefined") return;

  var rows = Array.prototype.slice.call(list.querySelectorAll(".work-row a[data-preview]"));
  if (!rows.length) return;

  var host = document.createElement("div");
  host.className = "work-gl";
  document.body.appendChild(host);

  var W = 384, H = 270;
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var loader = new THREE.TextureLoader();
  var texCache = {};
  function getTex(src, cb) {
    if (texCache[src]) { cb(texCache[src]); return; }
    loader.load(src, function (tx) {
      tx.minFilter = THREE.LinearFilter;
      texCache[src] = tx;
      cb(tx);
    });
  }

  var uniforms = {
    u_tex: { value: null },
    u_imgAspect: { value: 1.5 },
    u_planeAspect: { value: W / H },
    u_vel: { value: new THREE.Vector2(0, 0) },
    u_time: { value: 0 },
    u_fade: { value: 0 }
  };

  var frag = [
    "precision highp float;",
    "varying vec2 vUv; uniform sampler2D u_tex;",
    "uniform float u_imgAspect; uniform float u_planeAspect;",
    "uniform vec2 u_vel; uniform float u_time; uniform float u_fade;",
    "void main(){",
    "  // cover-fit the image to the plane",
    "  vec2 uv = vUv; float r = u_planeAspect / u_imgAspect;",
    "  if (r < 1.0) { uv.x = (uv.x-0.5)*r + 0.5; } else { uv.y = (uv.y-0.5)/r + 0.5; }",
    "  // velocity-driven ripple + push",
    "  float amp = clamp(length(u_vel)*0.0016, 0.0, 0.06);",
    "  uv.x += sin(uv.y*10.0 + u_time*3.0) * amp;",
    "  uv.y += cos(uv.x*10.0 + u_time*2.0) * amp * 0.6;",
    "  vec2 shift = u_vel * 0.00018;",
    "  float rC = texture2D(u_tex, uv + shift).r;",
    "  float gC = texture2D(u_tex, uv).g;",
    "  float bC = texture2D(u_tex, uv - shift).b;",
    "  vec3 col = vec3(rC, gC, bC);",
    "  // edge vignette",
    "  float v = smoothstep(0.0,0.12,uv.x)*smoothstep(1.0,0.88,uv.x)*smoothstep(0.0,0.12,uv.y)*smoothstep(1.0,0.88,uv.y);",
    "  gl_FragColor = vec4(col, u_fade) ;",
    "}"
  ].join("\n");

  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms, transparent: true,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }",
    fragmentShader: frag
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  var px = 0, py = 0, cx = 0, cy = 0, lastX = 0, lastY = 0, vx = 0, vy = 0;
  var active = false, fadeTarget = 0;

  list.addEventListener("mousemove", function (e) {
    px = e.clientX; py = e.clientY;
  }, { passive: true });

  rows.forEach(function (a) {
    a.addEventListener("mouseenter", function () {
      var src = a.getAttribute("data-preview");
      getTex(src, function (tx) {
        uniforms.u_tex.value = tx;
        var img = tx.image;
        if (img && img.width) uniforms.u_imgAspect.value = img.width / img.height;
      });
      active = true; fadeTarget = 1;
      host.classList.add("is-on");
    });
    a.addEventListener("mouseleave", function () {
      active = false; fadeTarget = 0;
      host.classList.remove("is-on");
    });
  });

  var t0 = null;
  function tick(now) {
    requestAnimationFrame(tick);
    if (t0 === null) t0 = now;
    uniforms.u_time.value = (now - t0) / 1000;

    // velocity from raw pointer
    vx = px - lastX; vy = py - lastY; lastX = px; lastY = py;
    uniforms.u_vel.value.x += (vx * 14 - uniforms.u_vel.value.x) * 0.1;
    uniforms.u_vel.value.y += (vy * 14 - uniforms.u_vel.value.y) * 0.1;
    uniforms.u_fade.value += (fadeTarget - uniforms.u_fade.value) * 0.12;
    window.__workgl = { fade: +uniforms.u_fade.value.toFixed(2), tex: !!uniforms.u_tex.value, on: active };

    // follow cursor with lag, clamped to viewport
    var tx = Math.min(px + 28, window.innerWidth - W - 24);
    var ty = Math.min(Math.max(py - H / 2, 70), window.innerHeight - H - 24);
    cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
    host.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";

    if (uniforms.u_fade.value > 0.01) renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
