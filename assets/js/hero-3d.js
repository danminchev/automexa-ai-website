document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("hero-3d-container");
  if (!container) return;

  // Configuration
  const STAR_COUNT = 180;
  const RING_COLOR_1 = 0x7DB6CF; // Cyan glow
  const RING_COLOR_2 = 0xBB77E7; // Violet glow
  const PARTICLE_COLOR = 0x7DB6CF;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (REDUCED_MOTION) {
      console.log("Reduced motion enabled: 3D effects disabled.");
      return;
  }

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
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
  container.appendChild(renderer.domElement);

  // --- OBJECTS ---

  // 1. Digital Platform (Grid)
  // Create a polar grid helper
  const gridHelper = new THREE.PolarGridHelper(8, 16, 8, 64, 0x597DA8, 0x597DA8);
  gridHelper.position.y = -4;
  gridHelper.rotation.x = 0; // Flat
  // Make lines transparent
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.15;
  scene.add(gridHelper);

  // 2. HUD Rings (Torus Geometry)
  // Ring 1 (Cyan)
  const ring1Geo = new THREE.TorusGeometry(5.5, 0.03, 16, 100);
  const ring1Mat = new THREE.MeshBasicMaterial({ 
      color: RING_COLOR_1, 
      transparent: true, 
      opacity: 0.4 
  });
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  ring1.rotation.x = Math.PI / 2.3; // Tilted
  scene.add(ring1);

  // Ring 2 (Violet)
  const ring2Geo = new THREE.TorusGeometry(6.8, 0.02, 16, 100);
  const ring2Mat = new THREE.MeshBasicMaterial({ 
      color: RING_COLOR_2, 
      transparent: true, 
      opacity: 0.3 
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI / 2.1;
  ring2.rotation.y = 0.2;
  scene.add(ring2);

  // 3. Particles
  const particlesGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  
  for(let i = 0; i < STAR_COUNT * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25; // Spread
  }
  
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particlesMat = new THREE.PointsMaterial({
      color: PARTICLE_COLOR,
      size: 0.08,
      transparent: true,
      opacity: 0.6
  });
  
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // --- ANIMATION LOOP ---
  
  let animationId;
  const clock = new THREE.Clock();
  
  // FPS Cap
  let lastTime = 0;
  const fpsInterval = 1000 / 30; // 30 FPS cap

  function animate(time) {
      animationId = requestAnimationFrame(animate);

      const delta = time - lastTime;
      if (delta < fpsInterval) return; // Skip frame

      lastTime = time - (delta % fpsInterval);

      const elapsedTime = clock.getElapsedTime();

      // Rotate Rings
      ring1.rotation.z = elapsedTime * 0.05;
      ring2.rotation.z = -elapsedTime * 0.03;

      // Pulse Grid
      gridHelper.rotation.y = elapsedTime * 0.02;

      // Float Particles
      particles.rotation.y = elapsedTime * 0.04;
      
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
              lastTime = performance.now();
              animate(lastTime);
          } else {
              cancelAnimationFrame(animationId);
          }
      });
  }, { threshold: 0.1 });

  observer.observe(container);
});
