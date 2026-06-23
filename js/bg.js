/* ============================================================
   Persistent WebGL background field — on every page.
   Dark flowing fbm noise with a faint blue aurora, reactive to
   pointer and scroll. Cheap fragment shader, reduced resolution.
   ============================================================ */
(function () {
  "use strict";
  if (typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var isMobile = window.matchMedia("(max-width: 52rem)").matches;

  var canvas = document.createElement("canvas");
  canvas.className = "bg-webgl";
  document.body.appendChild(canvas);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  // render below native resolution — this is atmosphere, not detail
  var RES = isMobile ? 0.5 : 0.66;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * RES);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var uniforms = {
    u_time: { value: 0 },
    u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_scroll: { value: 0 },
    u_base: { value: new THREE.Color(0x0a0f1c) },
    u_accent: { value: new THREE.Color(0x2b62c4) }
  };

  var frag = [
    "precision highp float;",
    "uniform float u_time; uniform vec2 u_res; uniform vec2 u_mouse;",
    "uniform float u_scroll; uniform vec3 u_base; uniform vec3 u_accent;",
    "",
    "vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }",
    "float noise(vec2 p){",
    "  vec2 i=floor(p), f=fract(p);",
    "  vec2 u=f*f*(3.0-2.0*f);",
    "  return mix(mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)), dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),",
    "             mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)), dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);",
    "}",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=1.92; a*=0.5; } return v; }",
    "",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res.xy;",
    "  vec2 p = uv; p.x *= u_res.x/u_res.y;",
    "  float t = u_time*0.02;",
    "  // domain-warped fbm for slow drifting clouds",
    "  vec2 q = vec2(fbm(p+vec2(0.0,t)), fbm(p+vec2(5.2,-t)));",
    "  vec2 r = vec2(fbm(p+1.6*q+vec2(1.7,9.2)+0.15*t), fbm(p+1.6*q+vec2(8.3,2.8)-0.12*t));",
    "  float f = fbm(p+2.0*r);",
    "  float clouds = smoothstep(-0.6, 0.8, f);",
    "  // pointer light + scroll drift",
    "  vec2 m = u_mouse; m.x *= u_res.x/u_res.y;",
    "  float d = distance(p, m);",
    "  float glow = 0.10/(d*d+0.12);",
    "  float band = smoothstep(0.9, -0.2, uv.y + u_scroll*0.25);",
    "  vec3 col = u_base;",
    "  col += u_accent * clouds * 0.16 * (0.4+band);",
    "  col += u_accent * glow * 0.05;",
    "  col += u_accent * pow(clouds,3.0) * 0.06;",
    "  // subtle vignette keeps text legible toward edges",
    "  float vig = smoothstep(1.25, 0.25, distance(uv, vec2(0.5)));",
    "  col *= 0.82 + 0.18*vig;",
    "  // dither to kill banding",
    "  float dith = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);",
    "  col += (dith-0.5)/255.0;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: frag,
    depthTest: false, depthWrite: false
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  var tmx = 0.5, tmy = 0.5;
  document.addEventListener("mousemove", function (e) {
    tmx = e.clientX / window.innerWidth;
    tmy = 1.0 - e.clientY / window.innerHeight;
  }, { passive: true });

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    uniforms.u_scroll.value = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
  }, { passive: true });

  var visible = true;
  document.addEventListener("visibilitychange", function () { visible = !document.hidden; });

  var t0 = null, raf;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    if (t0 === null) t0 = now;
    uniforms.u_time.value = (now - t0) / 1000;
    uniforms.u_mouse.value.x += (tmx - uniforms.u_mouse.value.x) * 0.04;
    uniforms.u_mouse.value.y += (tmy - uniforms.u_mouse.value.y) * 0.04;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();
