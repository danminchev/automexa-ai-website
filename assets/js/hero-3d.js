document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("hero-3d-container");
  if (!container) return;

    if (typeof THREE === "undefined") return;

    // Configuration
    const STAR_COUNT = 260;
    const STAR_COUNT_2 = 180;
    const CYAN = 0x7db6cf;
    const VIOLET = 0xbb77e7;
    const BLUE = 0x597da8;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (REDUCED_MOTION) return;

    // Scene Setup
    const scene = new THREE.Scene();
  
    // Camera
  const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
  );
  camera.position.z = 20;
  camera.position.y = 2; // Slight angle look down/up

    // Renderer
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
        return;
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

  // --- OBJECTS ---

    // 1) Digital Platform (Grid)
    const gridHelper = new THREE.PolarGridHelper(8.2, 20, 9, 96, BLUE, BLUE);
    gridHelper.position.y = -4.25;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.12;
    gridHelper.material.blending = THREE.AdditiveBlending;
    scene.add(gridHelper);

    // Platform rings (soft neon)
    const platformGroup = new THREE.Group();
    platformGroup.position.y = -4.25;
    scene.add(platformGroup);

    function makeRing(inner, outer, color, opacity) {
        const geo = new THREE.RingGeometry(inner, outer, 128);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
    }

    platformGroup.add(makeRing(2.2, 2.33, CYAN, 0.16));
    platformGroup.add(makeRing(3.3, 3.43, BLUE, 0.11));
    platformGroup.add(makeRing(4.9, 5.05, VIOLET, 0.09));

    // 2) HUD Rings
    const hudGroup = new THREE.Group();
    scene.add(hudGroup);

    function makeHudTorus(radius, tube, color, opacity) {
        const geo = new THREE.TorusGeometry(radius, tube, 12, 160);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        return new THREE.Mesh(geo, mat);
    }

    const ring1 = makeHudTorus(5.6, 0.03, CYAN, 0.38);
    ring1.rotation.x = Math.PI / 2.25;
    hudGroup.add(ring1);

    const ring2 = makeHudTorus(6.85, 0.02, VIOLET, 0.26);
    ring2.rotation.x = Math.PI / 2.05;
    ring2.rotation.y = 0.22;
    hudGroup.add(ring2);

    const ring3 = makeHudTorus(4.35, 0.018, BLUE, 0.18);
    ring3.rotation.x = Math.PI / 2.35;
    ring3.rotation.y = -0.15;
    hudGroup.add(ring3);

    // Subtle tick ring (cheap): line loop circle
    function makeTickRing(radius, color, opacity, segments) {
        const geo = new THREE.BufferGeometry();
        const pts = [];
        const seg = Math.max(24, segments || 96);
        for (let i = 0; i <= seg; i++) {
            const a = (i / seg) * Math.PI * 2;
            const r = radius + ((i % 8 === 0) ? 0.08 : 0.0);
            pts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
        }
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const line = new THREE.Line(geo, mat);
        line.rotation.x = Math.PI / 2.18;
        return line;
    }

    const tickRing = makeTickRing(6.15, CYAN, 0.12, 120);
    tickRing.rotation.y = 0.35;
    hudGroup.add(tickRing);

    // 3) Particles
  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  
  for(let i = 0; i < STAR_COUNT * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25; // Spread
  }
  
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particlesMat = new THREE.PointsMaterial({
      color: CYAN,
      size: 0.085,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
  });
  
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

    // Secondary (violet) dust
    const particlesGeo2 = new THREE.BufferGeometry();
    const positions2 = new Float32Array(STAR_COUNT_2 * 3);
    for (let i = 0; i < STAR_COUNT_2; i++) {
        const idx = i * 3;
        positions2[idx] = (Math.random() - 0.5) * 22;
        positions2[idx + 1] = (Math.random() - 0.5) * 16;
        positions2[idx + 2] = (Math.random() - 0.5) * 22;
    }
    particlesGeo2.setAttribute("position", new THREE.BufferAttribute(positions2, 3));
    const particlesMat2 = new THREE.PointsMaterial({
        color: VIOLET,
        size: 0.065,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const particles2 = new THREE.Points(particlesGeo2, particlesMat2);
    scene.add(particles2);

    // 4) Light rays (platform hologram look) — very light geometry
    const raysGroup = new THREE.Group();
    raysGroup.position.y = -4.25;
    scene.add(raysGroup);

    const rayGeo = new THREE.PlaneGeometry(0.06, 3.2);
    const rayMat = new THREE.MeshBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const RAY_COUNT = 18;
    for (let i = 0; i < RAY_COUNT; i++) {
        const m = new THREE.Mesh(rayGeo, rayMat.clone());
        const a = (i / RAY_COUNT) * Math.PI * 2;
        const r = 5.05 + (i % 3) * 0.06;
        m.position.set(Math.cos(a) * r, 1.0, Math.sin(a) * r);
        m.rotation.y = a;
        m.material.opacity = 0.06 + (i % 5) * 0.006;
        raysGroup.add(m);
    }

  // --- ANIMATION LOOP ---
  
    let animationId;
  const clock = new THREE.Clock();
    let running = false;
  
  // FPS Cap
  let lastTime = 0;
  const fpsInterval = 1000 / 30; // 30 FPS cap

  function animate(time) {
      animationId = requestAnimationFrame(animate);

      const delta = time - lastTime;
      if (delta < fpsInterval) return; // Skip frame

      lastTime = time - (delta % fpsInterval);

      const elapsedTime = clock.getElapsedTime();

      // Rotate / drift
      ring1.rotation.z = elapsedTime * 0.055;
      ring2.rotation.z = -elapsedTime * 0.035;
      ring3.rotation.z = elapsedTime * 0.025;

    tickRing.rotation.z = elapsedTime * 0.018;

      gridHelper.rotation.y = elapsedTime * 0.02;
      const pulse = 0.11 + Math.sin(elapsedTime * 0.9) * 0.01;
      gridHelper.material.opacity = pulse;

      platformGroup.rotation.y = -elapsedTime * 0.015;

    // Very subtle hologram ray wobble
    raysGroup.rotation.y = elapsedTime * 0.01;

      particles.rotation.y = elapsedTime * 0.04;
      particles2.rotation.y = -elapsedTime * 0.03;
      
      renderer.render(scene, camera);
  }

  // --- RESIZE HANDLER ---
  window.addEventListener('resize', () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // --- INTERSECTION OBSERVER (Performance) ---
  const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              if (running) return;
              running = true;
              lastTime = performance.now();
              animate(lastTime);
          } else {
              running = false;
              if (animationId) cancelAnimationFrame(animationId);
          }
      });
  }, { threshold: 0.1 });

  observer.observe(container);
});
