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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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

      gridHelper.rotation.y = elapsedTime * 0.02;
      const pulse = 0.11 + Math.sin(elapsedTime * 0.9) * 0.01;
      gridHelper.material.opacity = pulse;

      platformGroup.rotation.y = -elapsedTime * 0.015;

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
