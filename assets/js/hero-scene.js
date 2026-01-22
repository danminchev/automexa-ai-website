
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("hero-3d-bg");
    if (!container) return;

    // --- 1. SETUP SCENE ---
    const scene = new THREE.Scene();
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // Renderer with alpha (transparency) so CSS background shows through if WebGL background fails/is absent
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- 2. BACKGROUND PLANE (Only added if texture loads successfully) ---
    const textureLoader = new THREE.TextureLoader();
    
    // Attempt to load texture. If CORS fails (local file), we handle it gracefully.
    try {
        textureLoader.load(
            'assets/images/hero-bg-main.jpg',
            (bgTexture) => {
                // Success: Create Shader Material for Distortion Effects
                const bgMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        uTexture: { value: bgTexture },
                        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                        uImageRes: { value: new THREE.Vector2(bgTexture.image.width, bgTexture.image.height) },
                        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                        uTime: { value: 0 }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D uTexture;
                        uniform vec2 uResolution;
                        uniform vec2 uImageRes;
                        uniform vec2 uMouse;
                        uniform float uTime;
                        varying vec2 vUv;

                        void main() {
                            // Aspect Ratios
                            float imageAspect = uImageRes.x / uImageRes.y;
                            float screenAspect = uResolution.x / uResolution.y;

                            // "Cover" fit Logic (to fill screen without empty space)
                            vec2 scale = vec2(1.0);
                            
                            // If we want to FILL the width, we must ensure scale.x covers screen
                            // Logic: scale = image / screen (in simplified terms)
                            // We need logic that CROPS the image rather than letterboxing (empty space)

                            if (screenAspect > imageAspect) {
                                // Screen is wider than image: 
                                // To cover width, we must scale up width to match, which means height gets cropped.
                                // In UV logic: we map 0..1 screen to a smaller portion of texture height.
                                // scale.y = ratio
                                scale.y = screenAspect / imageAspect;
                            } else {
                                // Screen is taller than image:
                                // To cover height, we must scale up height to match, which means width gets cropped.
                                // In UV logic: we map 0..1 screen to a smaller portion of texture width.
                                // scale.x = ratio
                                scale.x = imageAspect / screenAspect;
                            }
                            
                            // Zoom out slightly to show more context but keep coverage
                            // User wants NO empty space, so we must be strictly >= 1.0 coverage
                            // To show "more" of the robot, we rely on the crop being centered.
                            
                            // Let's add slight "Breathing Room" only if safe? No, user said NO empty space.
                            // User said "снимката да се разхити" (widen/stretch?) i.e. fill width
                            // AND "да стане по ниска" (crop top/bottom?)
                            
                            // So let's stick to strict COVER.

                            // Convert Screen UV to Texture UV
                            
                            // UV Calculation with TOP Alignment Bias
                            // Horizontal: Center alignment
                            float uvX = (vUv.x - 0.5) / scale.x + 0.5;
                            
                            // Vertical: Top alignment (Pivot at 1.0)
                            // This ensures the robot's head (which is at the top) stays visible.
                            float pivotY = 0.9; 
                            float uvY = (vUv.y - pivotY) / scale.y + pivotY;
                            
                            vec2 uv = vec2(uvX, uvY);

                            // Parallax Effect
                            vec2 parallax = (uMouse - 0.5) * 0.015; 
                            uv -= parallax;
                            
                            // Check bounds
                            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                                gl_FragColor = vec4(0.0);
                            } else {
                                vec4 color = texture2D(uTexture, uv);
                                
                                // Darken & Tint
                                color.rgb *= 0.90; 
                                color.rgb += vec3(0.0, 0.02, 0.05);
                                
                                gl_FragColor = color;
                            }
                        }
                    `,
                    depthWrite: false,
                    depthTest: false
                });

                const bgGeometry = new THREE.PlaneGeometry(2, 2);
                const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
                bgMesh.renderOrder = -1; // Ensure background is behid points
                scene.add(bgMesh);
                
                // Re-bind resize for shader
                window.addEventListener('resize', () => {
                    if(bgMaterial.uniforms.uResolution.value) {
                        bgMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
                    }
                });
            },
            undefined, // onProgress
            (err) => {
                console.log("Hero BG Texture failed to load (local file check). Showing CSS fallback.");
            }
        );
    } catch (e) {
        // Fallback catch
        console.log("Texture loader error", e);
    }


    // --- 3. PARTICLES (Refined: Circles instead of Squares) ---
    // Generate a simple circle texture on a canvas to avoid loading another image file
    function createCircleTexture() {
        const matCanvas = document.createElement('canvas');
        matCanvas.width = 32;
        matCanvas.height = 32;
        const ctx = matCanvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(matCanvas);
        return texture;
    }

    const particlesCount = 350;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        // Spread particles wider
        posArray[i] = (Math.random() - 0.5) * 20; 
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.12, // Larger because of texture alpha
        map: createCircleTexture(),
        color: 0x00D4FF,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    const particleGroup = new THREE.Group();
    particleGroup.add(particlesMesh);
    scene.add(particleGroup);


    // --- 4. ANIMATION LOOP ---
    const mouse = new THREE.Vector2(0.5, 0.5);
    const targetMouse = new THREE.Vector2(0.5, 0.5);

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX / window.innerWidth;
        targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Ease mouse
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        // If background shader loaded, update it
        scene.traverse((obj) => {
            if (obj.isMesh && obj.material.uniforms && obj.material.uniforms.uTime) {
                obj.material.uniforms.uTime.value = elapsedTime;
                obj.material.uniforms.uMouse.value = mouse;
            }
        });

        // Rotate particles
        particleGroup.rotation.y = elapsedTime * 0.04;
        particleGroup.rotation.x = (mouse.y - 0.5) * 0.2; 
        
        // Gentle float for particles
        particlesMesh.position.y = Math.sin(elapsedTime * 0.5) * 0.5;

        renderer.render(scene, camera);
    }
    animate();

    // --- 5. RESIZE ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
