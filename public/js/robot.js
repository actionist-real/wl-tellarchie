// Optional enhancement: the complete static robot stays visible until WebGL is ready.
(() => {
  const container = document.querySelector('.framer-16ap2ei');
  const section = document.querySelector('#diagram-section');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!container || !section || motion.matches || container.getBoundingClientRect().width === 0) return;
  const fallback = container.querySelector('img');
  const staticSource = fallback.src;
  const canvas = document.createElement('canvas');
  canvas.id = 'robot-head-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', top: '-90px', left: '-40px', width: 'calc(100% + 80px)', height: 'calc(100% + 110px)', pointerEvents: 'none', zIndex: '10' });
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, .5, 3.25);
  camera.lookAt(0, .5, 0);
  scene.add(new THREE.AmbientLight(0xffffff, .95));
  for (const [color, intensity, position] of [[0xffffff, 1.8, [2,3,3]], [0xffffff,.9,[-2.5,1.8,2]], [0xffffff,1,[0,3.5,-2]]]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position); scene.add(light);
  }
  const accent = new THREE.PointLight(getComputedStyle(document.documentElement).getPropertyValue("--palette-emphasis").trim(), 3, 6);
  new MutationObserver(() => accent.color.set(getComputedStyle(document.documentElement).getPropertyValue("--palette-emphasis").trim())).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  accent.position.set(0,-.2,1.2); scene.add(accent);
  let model, frame = 0, visible = false, failed = false;
  const target = { x: 0, y: 0 };
  function resize() {
    const box = container.getBoundingClientRect();
    const width = Math.max(box.width,139) + 80;
    const height = Math.max(box.height,160) + 110;
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
    sync();
  }
  function animate(time) {
    frame = requestAnimationFrame(animate);
    model.rotation.x += (target.x + .12 + Math.cos(time*.0015)*.008 - model.rotation.x)*.085;
    model.rotation.y += (target.y - model.rotation.y)*.085;
    model.rotation.z = -model.rotation.y*.08;
    model.position.y = .45 + Math.sin(time*.0015)*.0036;
    renderer.render(scene,camera);
  }
  function sync() {
    const active = model && !failed && !motion.matches && container.getBoundingClientRect().width > 0;
    canvas.hidden = !active;
    fallback.src = active ? '/images/5vXVfiaaTAeEtBIYInZAq2Do7Y_47ae62.png' : staticSource;
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (active && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }).observe(section);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  window.addEventListener('resize', resize, { passive: true });
  section.addEventListener('pointermove', (event) => {
    if (motion.matches) return;
    const box = container.getBoundingClientRect();
    target.y = Math.max(-.45,Math.min(.45,(event.clientX-box.left-box.width/2)/innerWidth));
    target.x = Math.max(-.24,Math.min(.18,(event.clientY-box.top-box.height*.25)/innerHeight*.6));
  }, { passive: true });
  section.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
  canvas.addEventListener('webglcontextlost', () => { failed = true; sync(); });
  resize();
  new THREE.GLTFLoader().load('/images/robot-head.glb', (gltf) => {
    model = gltf.scene;
    model.position.set(-.02,.45,0); model.scale.setScalar(.59);
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        // Neutral albedo preserves surface detail while letting the accent light supply color.
        child.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
            #include <map_fragment>
            float neutralLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            diffuseColor.rgb = vec3(neutralLuminance);
          `);
        };
        child.material.customProgramCacheKey = () => 'neutral-robot-albedo-v1';
        child.material.needsUpdate = true;
        child.material.envMapIntensity = 1.2;
        if (child.material.roughness !== undefined) child.material.roughness = Math.min(child.material.roughness,.28);
      }
    });
    scene.add(model);
    container.append(canvas);
    sync();
  }, undefined, () => { failed = true; renderer.dispose(); sync(); });
})();
