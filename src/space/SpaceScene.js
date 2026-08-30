/**
 * SpaceScene.js // Three.js 3D Celestial Space Environment for Rhythm Keys
 * Smooth forward-translating 3D planets & asteroids matching the starfield particle kinematics.
 * Eliminates artificial wobble/jiggle for steady, majestic cosmic motion.
 */

import * as THREE from 'three';

export class SpaceScene {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = null;
    this.starPositions = null;
    this.starVelocities = null;
    this.starCount = 1800;
    this.forwardSpeed = 0.8;
    this.audioEnergy = 0;
    this.celestialBodies = [];
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  setAudioEnergy(energy) {
    this.audioEnergy = Math.max(0, Math.min(1, energy));
  }

  init() {
    // 1. Scene & Perspective Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 0, 26);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x181734, 0.7);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Volumetric 3D Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x5b427d, 2.6);
    this.scene.add(ambientLight);

    // Key Light (Warm Sun Glow)
    const sunLight = new THREE.DirectionalLight(0xfff59d, 3.5);
    sunLight.position.set(30, 40, 50);
    this.scene.add(sunLight);

    // Cyan Rim Light (Left)
    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    cyanRimLight.position.set(-50, 20, 20);
    this.scene.add(cyanRimLight);

    // Pink Rim Light (Right)
    const pinkRimLight = new THREE.DirectionalLight(0xff4081, 2.8);
    pinkRimLight.position.set(50, -30, 20);
    this.scene.add(pinkRimLight);

    // Center Cockpit Glow
    const cockpitGlow = new THREE.PointLight(0x80d8ff, 1.2, 120);
    cockpitGlow.position.set(0, 0, 20);
    this.scene.add(cockpitGlow);

    // 4. Build Environment Layers
    this.createCosmicNebulaLayers();
    this.create3DStarfield();
    this.create3DCelestialBodies();
    this.createWhimsicalAsteroidField();

    // 5. Window Resize Event
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 6. Start Physics & Render Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  /**
   * Creates volumetric nebula clouds in pastel cosmic dreamscape
   */
  createCosmicNebulaLayers() {
    const nebulaGeo = new THREE.PlaneGeometry(160, 110);
    const nebulaColors = [
      { color1: 'rgba(244, 114, 182, 0.22)', color2: 'rgba(192, 132, 252, 0.35)' }, // Bubblegum & Lavender
      { color1: 'rgba(56, 189, 248, 0.20)', color2: 'rgba(30, 27, 75, 0.45)' },    // Sky Cyan & Deep Indigo
      { color1: 'rgba(253, 224, 71, 0.16)', color2: 'rgba(74, 222, 128, 0.25)' }   // Sunshine & Mint
    ];

    nebulaColors.forEach((cfg, idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
      grad.addColorStop(0, cfg.color1);
      grad.addColorStop(0.6, cfg.color2);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(nebulaGeo, material);
      mesh.position.set(
        (idx - 1) * 35,
        (idx % 2 === 0 ? 10 : -10),
        -140 - (idx * 30)
      );
      this.scene.add(mesh);
    });
  }

  /**
   * Creates 3D particle starfield with cute pastel candy stardust
   */
  create3DStarfield() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.9)');
    radGrad.addColorStop(0.7, 'rgba(244, 114, 182, 0.4)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const starTexture = new THREE.CanvasTexture(canvas);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const velocities = new Float32Array(this.starCount);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xfde047), // Buttercup Gold
      new THREE.Color(0xf472b6), // Bubblegum Pink
      new THREE.Color(0x38bdf8), // Sky Cyan
      new THREE.Color(0xc084fc), // Lavender Purple
      new THREE.Color(0x4ade80)  // Mint Lime
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 180;
      positions[i3 + 1] = (Math.random() - 0.5) * 120;
      positions[i3 + 2] = -Math.random() * 400;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      velocities[i] = Math.random() * 0.5 + 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.8,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.starVelocities = velocities;
    this.scene.add(this.stars);
  }

  /**
   * Procedural canvas texture generator mimicking whimsical celestial art
   */
  createWhimsicalTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    if (type === 'yellow-saturn' || type === 'lunar-slate' || type === 'crystal-mako') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0.0, '#f472b6');
      grad.addColorStop(0.35, '#c084fc');
      grad.addColorStop(0.7, '#38bdf8');
      grad.addColorStop(1.0, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let y = 80; y < 1024; y += 90) {
        ctx.fillRect(0, y, 1024, 25);
      }
    } else if (type === 'pink-craters' || type === 'cratered-moon' || type === 'materia-emerald') {
      const grad = ctx.createRadialGradient(400, 400, 50, 512, 512, 512);
      grad.addColorStop(0.0, '#4ade80');
      grad.addColorStop(0.5, '#22c55e');
      grad.addColorStop(0.85, '#15803d');
      grad.addColorStop(1.0, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      const craters = [
        { x: 300, y: 350, r: 65, color1: '#166534', color2: '#86efac' },
        { x: 700, y: 400, r: 85, color1: '#166534', color2: '#86efac' },
        { x: 450, y: 750, r: 75, color1: '#166534', color2: '#86efac' }
      ];

      craters.forEach(c => {
        ctx.fillStyle = c.color1;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = c.color2;
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.15, c.y - c.r * 0.15, c.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const grad = ctx.createRadialGradient(350, 350, 40, 512, 512, 512);
      grad.addColorStop(0.0, '#fde047');
      grad.addColorStop(0.4, '#fb923c');
      grad.addColorStop(0.85, '#f43f5e');
      grad.addColorStop(1.0, '#881337');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Creates 3D celestial bodies with smooth forward travel kinematics matching particles
   */
  create3DCelestialBodies() {
    // --- 1. Iconic 3D Yellow Saturn with Pink Ring (Upper-Left Periphery) ---
    const saturnGeo = new THREE.SphereGeometry(3.6, 48, 48);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('yellow-saturn'),
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x3e2723,
      emissiveIntensity: 0.25
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);

    // 3D Double-Sided Lunar Saturn Ring
    const ringGeo = new THREE.RingGeometry(4.8, 7.6, 64);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 256;
    const ringCtx = ringCanvas.getContext('2d');
    const ringGrad = ringCtx.createRadialGradient(128, 128, 30, 128, 128, 128);
    ringGrad.addColorStop(0, '#ffffff');
    ringGrad.addColorStop(0.5, '#cbd5e1');
    ringGrad.addColorStop(0.9, '#475569');
    ringGrad.addColorStop(1, 'rgba(71, 85, 105, 0)');
    ringCtx.fillStyle = ringGrad;
    ringCtx.fillRect(0, 0, 256, 256);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      color: 0xe2e8f0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      roughness: 0.4
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.6;
    ringMesh.rotation.y = -Math.PI / 8;
    saturnMesh.add(ringMesh);

    saturnMesh.position.set(-25, 11, -120);
    saturnMesh.userData = {
      baseX: -25,
      baseY: 11,
      vz: 0.12, // Smooth steady forward velocity matching particles
      rotVelocity: new THREE.Vector3(0.001, 0.004, 0.0005), // Gentle axial spin
      resetZ: -220,
      limitZ: 32
    };
    this.scene.add(saturnMesh);
    this.celestialBodies.push(saturnMesh);

    // --- 2. 3D Pink Cratered Planet (Lower-Left Periphery) ---
    const pinkGeo = new THREE.SphereGeometry(3.4, 48, 48);
    const pinkMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('pink-craters'),
      roughness: 0.5,
      metalness: 0.08,
      emissive: 0x4a0025,
      emissiveIntensity: 0.2
    });
    const pinkPlanet = new THREE.Mesh(pinkGeo, pinkMat);
    pinkPlanet.position.set(-26, -10, -170);
    pinkPlanet.userData = {
      baseX: -26,
      baseY: -10,
      vz: 0.11,
      rotVelocity: new THREE.Vector3(0.0008, 0.0035, -0.001),
      resetZ: -230,
      limitZ: 32
    };
    this.scene.add(pinkPlanet);
    this.celestialBodies.push(pinkPlanet);

    // --- 3. 3D Blue Swirl Oceanic Exoplanet (Lower-Right Periphery) ---
    const blueGeo = new THREE.SphereGeometry(3.2, 48, 48);
    const blueMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('blue-swirl'),
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x011b40,
      emissiveIntensity: 0.25
    });
    const bluePlanet = new THREE.Mesh(blueGeo, blueMat);
    bluePlanet.position.set(26, -9, -90);
    bluePlanet.userData = {
      baseX: 26,
      baseY: -9,
      vz: 0.13,
      rotVelocity: new THREE.Vector3(0.001, 0.0045, 0.0008),
      resetZ: -210,
      limitZ: 32
    };
    this.scene.add(bluePlanet);
    this.celestialBodies.push(bluePlanet);

    // --- 4. 3D Turquoise Planet with Orbiting Coral Moon (Mid-Left Periphery) ---
    const turqGeo = new THREE.SphereGeometry(2.6, 48, 48);
    const turqMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('turquoise-mint'),
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x00332c,
      emissiveIntensity: 0.2
    });
    const turqPlanet = new THREE.Mesh(turqGeo, turqMat);

    // Orbiting Coral Moon
    const moonGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xff6e40,
      roughness: 0.5,
      emissive: 0xbf360c,
      emissiveIntensity: 0.3
    });
    const coralMoon = new THREE.Mesh(moonGeo, moonMat);
    coralMoon.position.set(4.4, 0.8, 0);
    turqPlanet.add(coralMoon);

    turqPlanet.position.set(-27, 0.5, -145);
    turqPlanet.userData = {
      baseX: -27,
      baseY: 0.5,
      vz: 0.115,
      moonOrbitMesh: coralMoon,
      moonOrbitSpeed: 0.002,
      rotVelocity: new THREE.Vector3(0.0005, 0.003, 0.0005),
      resetZ: -225,
      limitZ: 32
    };
    this.scene.add(turqPlanet);
    this.celestialBodies.push(turqPlanet);

    // --- 5. 3D Amethyst Striped Exoplanet (Upper-Right Periphery) ---
    const amethystGeo = new THREE.SphereGeometry(3.0, 48, 48);
    const amethystMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('amethyst-bands'),
      roughness: 0.4,
      metalness: 0.12,
      emissive: 0x3b0764,
      emissiveIntensity: 0.25
    });
    const amethystPlanet = new THREE.Mesh(amethystGeo, amethystMat);
    amethystPlanet.position.set(25, 10.5, -135);
    amethystPlanet.userData = {
      baseX: 25,
      baseY: 10.5,
      vz: 0.125,
      rotVelocity: new THREE.Vector3(0.0008, 0.004, 0.0006),
      resetZ: -215,
      limitZ: 32
    };
    this.scene.add(amethystPlanet);
    this.celestialBodies.push(amethystPlanet);
  }

  /**
   * Creates stylized whimsical 3D asteroids with smooth forward travel
   */
  createWhimsicalAsteroidField() {
    const asteroidGeometries = [
      new THREE.DodecahedronGeometry(1.3, 1),
      new THREE.IcosahedronGeometry(1.1, 0),
      new THREE.DodecahedronGeometry(0.9, 0),
      new THREE.IcosahedronGeometry(1.4, 1),
      new THREE.DodecahedronGeometry(1.0, 1)
    ];

    const asteroidConfigs = [
      // Top-Right Orange-Gold Asteroid
      {
        color: 0xffa726,
        emissive: 0xe65100,
        x: 28, y: 5, z: -80,
        vz: 0.14,
        rot: new THREE.Vector3(0.005, 0.008, 0.004)
      },
      // Mid-Right Violet Asteroid
      {
        color: 0xba68c8,
        emissive: 0x6a1b9a,
        x: 29, y: -3, z: -150,
        vz: 0.13,
        rot: new THREE.Vector3(-0.004, 0.007, 0.005)
      },
      // Top-Left Turquoise Jade Asteroid
      {
        color: 0x4dd0e1,
        emissive: 0x00838f,
        x: -29, y: 6, z: -110,
        vz: 0.145,
        rot: new THREE.Vector3(0.004, -0.006, 0.007)
      },
      // Lower-Left Rose Quartz Asteroid
      {
        color: 0xf48fb1,
        emissive: 0xad1457,
        x: -28, y: -6, z: -160,
        vz: 0.12,
        rot: new THREE.Vector3(0.006, 0.005, -0.004)
      },
      // Distant Top Center-Right Amber Asteroid
      {
        color: 0xffd54f,
        emissive: 0xff8f00,
        x: 27, y: 15, z: -190,
        vz: 0.135,
        rot: new THREE.Vector3(-0.005, 0.008, 0.004)
      }
    ];

    asteroidConfigs.forEach((cfg, idx) => {
      const geo = asteroidGeometries[idx % asteroidGeometries.length];
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.45,
        metalness: 0.15,
        emissive: cfg.emissive,
        emissiveIntensity: 0.35,
        flatShading: true
      });

      const asteroid = new THREE.Mesh(geo, mat);
      asteroid.position.set(cfg.x, cfg.y, cfg.z);
      asteroid.userData = {
        baseX: cfg.x,
        baseY: cfg.y,
        vz: cfg.vz,
        rotVelocity: cfg.rot,
        resetZ: -230,
        limitZ: 32
      };

      this.scene.add(asteroid);
      this.celestialBodies.push(asteroid);
    });
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Main Physics Simulation & Render Loop
   * Uses smooth forward-moving kinematics matching the starfield particles (no jiggling)
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Audio-reactive dynamic speed multiplier
    const speedBoost = 1.0 + (this.audioEnergy * 0.8);
    const effectiveSpeed = this.forwardSpeed * speedBoost;

    // 1. Particle Starfield Forward Kinematics
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      const vels = this.starVelocities;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += effectiveSpeed * vels[i];

        // Recycle star to distance when it flies past camera
        if (pos[i3 + 2] > 26) {
          pos[i3 + 2] = -400;
          pos[i3] = (Math.random() - 0.5) * 180;
          pos[i3 + 1] = (Math.random() - 0.5) * 120;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 2. 3D Celestial Bodies & Asteroids Forward Kinematics (Steady Smooth Translation, No Wobble)
    for (const body of this.celestialBodies) {
      const u = body.userData;

      // Pure Axial Spin Only
      body.rotation.x += u.rotVelocity.x;
      body.rotation.y += u.rotVelocity.y;
      body.rotation.z += u.rotVelocity.z;

      // Smooth Moon Gravitational Orbit
      if (u.moonOrbitMesh) {
        const angle = Date.now() * u.moonOrbitSpeed;
        u.moonOrbitMesh.position.x = Math.cos(angle) * 4.4;
        u.moonOrbitMesh.position.z = Math.sin(angle) * 4.4;
      }

      // Smooth Forward Translation Along Z-Axis (identical to star particles)
      body.position.z += u.vz;

      // Fixed Lateral Stability (Keeps them strictly on the screen margins without wobbling)
      body.position.x = u.baseX;
      body.position.y = u.baseY;

      // Recycle to distance when passing camera
      if (body.position.z > u.limitZ) {
        body.position.z = u.resetZ;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
