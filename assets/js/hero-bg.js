document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".cosmic-hero");
  const starsCanvas = document.getElementById("hero-stars");
  const trailsCanvas = document.getElementById("hero-trails");
  if (!hero || !starsCanvas || !trailsCanvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Utility to size a canvas to the hero bounds */
  function resizeCanvas(canvas) {
    const rect = hero.getBoundingClientRect();
    canvas.width = Math.max(rect.width, window.innerWidth);
    canvas.height = Math.max(rect.height, window.innerHeight * 0.9);
  }

  resizeCanvas(starsCanvas);
  resizeCanvas(trailsCanvas);

  window.addEventListener("resize", () => {
    resizeCanvas(starsCanvas);
    resizeCanvas(trailsCanvas);
    initStars();
    initTrails();
  });

  // --- Enhanced Starfield ---
  const starsCtx = starsCanvas.getContext("2d");
  let stars = [];
  function initStars() {
    const count = Math.floor((starsCanvas.width * starsCanvas.height) / 8000); // More stars
    stars = new Array(count).fill(0).map(() => {
      const isBright = Math.random() > 0.85;
      const isColored = Math.random() > 0.9;
      return {
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        r: isBright ? Math.random() * 2 + 1 : Math.random() * 1.2 + 0.3,
        a: isBright ? 0.6 + Math.random() * 0.4 : 0.15 + Math.random() * 0.25,
        tw: (Math.random() * 0.5 + 0.3) * (Math.random() < 0.5 ? -1 : 1),
        color: isColored ? (Math.random() > 0.5 ? '#00D4FF' : '#A855F7') : '#FFFFFF',
        twinkleSpeed: Math.random() * 0.002 + 0.001,
      };
    });
  }
  initStars();

  function drawStars(time) {
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    for (const s of stars) {
      const alpha = Math.max(0.08, Math.min(0.95, s.a + Math.sin(time * s.twinkleSpeed) * 0.15 * s.tw));
      starsCtx.globalAlpha = alpha;
      starsCtx.fillStyle = s.color;
      starsCtx.beginPath();
      starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      starsCtx.fill();
      
      // Add glow for bright stars
      if (s.r > 1.2) {
        starsCtx.globalAlpha = alpha * 0.3;
        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        starsCtx.fill();
      }
    }
    starsCtx.globalAlpha = 1;
  }

  // --- Enhanced Light trails ---
  const trailsCtx = trailsCanvas.getContext("2d");
  let trails = [];
  function initTrails() {
    const base = Math.max(25, Math.floor(trailsCanvas.width / 60));
    trails = new Array(base).fill(0).map(() => {
      const len = Math.random() * 180 + 80;
      const speed = Math.random() * 0.35 + 0.25;
      const isAccent = Math.random() > 0.7;
      return {
        x: Math.random() * trailsCanvas.width,
        y: Math.random() * trailsCanvas.height * 0.85,
        len,
        w: Math.random() * 1.5 + 0.3,
        speed,
        opacity: 0.06 + Math.random() * 0.12,
        color: isAccent ? (Math.random() > 0.5 ? '0, 212, 255' : '168, 85, 247') : '255, 255, 255',
      };
    });
  }
  initTrails();

  const angle = -0.28; // slight tilt to the right
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  function drawTrails(delta) {
    trailsCtx.clearRect(0, 0, trailsCanvas.width, trailsCanvas.height);
    trailsCtx.save();
    trailsCtx.translate(trailsCanvas.width * 0.05, trailsCanvas.height * 0.1);
    trailsCtx.rotate(angle);

    for (const t of trails) {
      // Create gradient for each trail
      const gradient = trailsCtx.createLinearGradient(t.x, t.y, t.x + t.len, t.y);
      gradient.addColorStop(0, `rgba(${t.color}, 0)`);
      gradient.addColorStop(0.3, `rgba(${t.color}, ${t.opacity})`);
      gradient.addColorStop(0.7, `rgba(${t.color}, ${t.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(${t.color}, 0)`);
      
      trailsCtx.strokeStyle = gradient;
      trailsCtx.lineWidth = t.w;
      trailsCtx.lineCap = 'round';
      trailsCtx.beginPath();
      trailsCtx.moveTo(t.x, t.y);
      trailsCtx.lineTo(t.x + t.len, t.y);
      trailsCtx.stroke();

      t.x += t.speed * delta * 0.08;
      if (t.x - t.len > trailsCanvas.width * 1.2) {
        t.x = -Math.random() * 300;
        t.y = Math.random() * trailsCanvas.height * 0.9;
        t.len = Math.random() * 180 + 80;
        t.w = Math.random() * 1.5 + 0.3;
        t.opacity = 0.06 + Math.random() * 0.12;
        t.speed = Math.random() * 0.35 + 0.25;
        const isAccent = Math.random() > 0.7;
        t.color = isAccent ? (Math.random() > 0.5 ? '0, 212, 255' : '168, 85, 247') : '255, 255, 255';
      }
    }

    trailsCtx.restore();
  }

  // --- Animation control ---
  let last = performance.now();
  let running = false;
  let rafId;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        start();
      } else {
        stop();
      }
    });
  }, { threshold: 0.1 });

  observer.observe(hero);

  function start() {
    if (running || prefersReduced) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function tick(now) {
    if (!running) return;
    const delta = now - last;
    last = now;
    drawStars(now);
    drawTrails(delta);
    rafId = requestAnimationFrame(tick);
  }

  // For reduced motion: draw once without animation
  if (prefersReduced) {
    drawStars(performance.now());
    drawTrails(16);
  } else {
    start();
  }
});
