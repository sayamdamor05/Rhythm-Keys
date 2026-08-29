/**
 * SpaceScene.js // Three.js 3D Physics-Driven Celestial Space Environment for Rhythm Keys
 * Whimsical 3D planets, stylized tumbling asteroids, and forward-motion starfield.
 * Clean, non-distracting celestial layout matching the reference artwork.
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
    this.celestialBodies = [];
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    this.init();
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

    // 2. WebGL Renderer with High Dynamic Quality
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x060314, 1.0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Volumetric 3D Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x3a2552, 2.2);
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
   * Creates volumetric nebula clouds in deep space
   */
  createCosmicNebulaLayers() {
    const nebulaGeo = new THREE.PlaneGeometry(140, 95);
    const nebulaColors = [
      { color1: 'rgba(142, 36, 170, 0.35)', color2: 'rgba(26, 35, 126, 0.2)' },
      { color1: 'rgba(0, 184, 212, 0.25)', color2: 'rgba(106, 27, 154, 0.2)' },
      { color1: 'rgba(245, 0, 87, 0.2)', color2: 'rgba(49, 27, 146, 0.15)' }
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
   * Creates 3D particle starfield with outward streaking forward velocity
   */
  create3DStarfield() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.3, 'rgba(128, 216, 255, 0.75)');
    radGrad.addColorStop(0.7, 'rgba(255, 128, 171, 0.35)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
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
      new THREE.Color(0x80d8ff),
      new THREE.Color(0xff80ab),
      new THREE.Color(0xffd54f),
      new THREE.Color(0xa7ffeb)
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

      velocities[i] = Math.random() * 0.6 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.9,
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

    if (type === 'yellow-saturn') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0.0, '#fff9c4');
      grad.addColorStop(0.2, '#ffd54f');
      grad.addColorStop(0.45, '#ffb300');
      grad.addColorStop(0.65, '#ffa000');
      grad.addColorStop(0.85, '#ff8f00');
      grad.addColorStop(1.0, '#f57c00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let y = 100; y < 1024; y += 90) {
        ctx.fillRect(0, y, 1024, 28);
      }

      ctx.fillStyle = '#ff6f00';
      for (let y = 140; y < 1024; y += 120) {
        ctx.fillRect(0, y, 1024, 18);
      }
    } else if (type === 'pink-craters') {
      const grad = ctx.createRadialGradient(400, 400, 50, 512, 512, 512);
      grad.addColorStop(0.0, '#ff80ab');
      grad.addColorStop(0.45, '#f50057');
      grad.addColorStop(0.85, '#c51162');
      grad.addColorStop(1.0, '#4a0025');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      const craters = [
        { x: 300, y: 350, r: 65, color1: '#880e4f', color2: '#c51162' },
        { x: 700, y: 400, r: 85, color1: '#880e4f', color2: '#c51162' },
        { x: 450, y: 750, r: 75, color1: '#880e4f', color2: '#c51162' },
        { x: 800, y: 800, r: 50, color1: '#880e4f', color2: '#c51162' },
        { x: 200, y: 700, r: 40, color1: '#880e4f', color2: '#c51162' }
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
    } else if (type === 'blue-swirl') {
      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0.0, '#80d8ff');
      grad.addColorStop(0.3, '#00b0ff');
      grad.addColorStop(0.65, '#00468c');
      grad.addColorStop(1.0, '#011b40');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let y = 80; y < 1024; y += 140) {
        ctx.beginPath();
        ctx.ellipse(512, y, 512, 45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'turquoise-mint') {
      const grad = ctx.createRadialGradient(350, 350, 40, 512, 512, 512);
      grad.addColorStop(0.0, '#a7ffeb');
      grad.addColorStop(0.4, '#1de9b6');
      grad.addColorStop(0.85, '#00695c');
      grad.addColorStop(1.0, '#00332c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);
    } else if (type === 'amethyst-bands') {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0.0, '#e9d5ff');
      grad.addColorStop(0.3, '#c084fc');
      grad.addColorStop(0.6, '#9333ea');
      grad.addColorStop(1.0, '#581c87');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let y = 120; y < 1024; y += 110) {
        ctx.fillRect(0, y, 1024, 22);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Creates 3D celestial bodies with physical mass, velocity, and orbital mechanics
   */
  create3DCelestialBodies() {
    // --- 1. Iconic 3D Yellow Saturn with Pink Ring (Upper-Left Drift) ---
    const saturnGeo = new THREE.SphereGeometry(3.6, 48, 48);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('yellow-saturn'),
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x3e2723,
      emissiveIntensity: 0.25
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);

    // 3D Double-Sided Pink Saturn Ring
    const ringGeo = new THREE.RingGeometry(4.8, 7.6, 64);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 256;
    const ringCtx = ringCanvas.getContext('2d');
    const ringGrad = ringCtx.createRadialGradient(128, 128, 30, 128, 128, 128);
    ringGrad.addColorStop(0, '#ff4081');
    ringGrad.addColorStop(0.5, '#f50057');
    ringGrad.addColorStop(0.9, '#c51162');
    ringGrad.addColorStop(1, 'rgba(197, 17, 98, 0)');
    ringCtx.fillStyle = ringGrad;
    ringCtx.fillRect(0, 0, 256, 256);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      color: 0xff4081,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      roughness: 0.3,
      emissive: 0x880e4f,
      emissiveIntensity: 0.3
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.6;
    ringMesh.rotation.y = -Math.PI / 8;
    saturnMesh.add(ringMesh);

    saturnMesh.position.set(-24, 11, -120);
    saturnMesh.userData = {
      mass: 80,
      baseX: -24,
      baseY: 11,
      vz: 0.08,
      orbitFreq: 0.0012,
      orbitRadiusX: 2.2,
      orbitRadiusY: 1.5,
      rotVelocity: new THREE.Vector3(0.002, 0.007, 0.001),
      resetZ: -160,
      limitZ: 32
    };
    this.scene.add(saturnMesh);
    this.celestialBodies.push(saturnMesh);

    // --- 2. 3D Pink Cratered Planet (Lower-Left Drift) ---
    const pinkGeo = new THREE.SphereGeometry(3.4, 48, 48);
    const pinkMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('pink-craters'),
      roughness: 0.5,
      metalness: 0.08,
      emissive: 0x4a0025,
      emissiveIntensity: 0.2
    });
    const pinkPlanet = new THREE.Mesh(pinkGeo, pinkMat);
    pinkPlanet.position.set(-25, -10, -85);
    pinkPlanet.userData = {
      mass: 65,
      baseX: -25,
      baseY: -10,
      vz: 0.075,
      orbitFreq: 0.0014,
      orbitRadiusX: 1.8,
      orbitRadiusY: 1.2,
      rotVelocity: new THREE.Vector3(-0.003, 0.005, 0.002),
      resetZ: -150,
      limitZ: 32
    };
    this.scene.add(pinkPlanet);
    this.celestialBodies.push(pinkPlanet);

    // --- 3. 3D Blue Swirl Oceanic Exoplanet (Lower-Right Drift) ---
    const blueGeo = new THREE.SphereGeometry(3.2, 48, 48);
    const blueMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('blue-swirl'),
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x011b40,
      emissiveIntensity: 0.25
    });
    const bluePlanet = new THREE.Mesh(blueGeo, blueMat);
    bluePlanet.position.set(25, -9, -95);
    bluePlanet.userData = {
      mass: 70,
      baseX: 25,
      baseY: -9,
      vz: 0.085,
      orbitFreq: 0.0011,
      orbitRadiusX: 2.0,
      orbitRadiusY: 1.6,
      rotVelocity: new THREE.Vector3(0.004, 0.006, -0.002),
      resetZ: -155,
      limitZ: 32
    };
    this.scene.add(bluePlanet);
    this.celestialBodies.push(bluePlanet);

    // --- 4. 3D Turquoise Planet with Orbiting Coral Moon (Mid-Left Drift) ---
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

    turqPlanet.position.set(-26, 0.5, -135);
    turqPlanet.userData = {
      mass: 50,
      baseX: -26,
      baseY: 0.5,
      vz: 0.07,
      orbitFreq: 0.0016,
      orbitRadiusX: 1.5,
      orbitRadiusY: 1.2,
      moonOrbitMesh: coralMoon,
      moonOrbitSpeed: 0.003,
      rotVelocity: new THREE.Vector3(0.002, 0.005, 0.001),
      resetZ: -165,
      limitZ: 32
    };
    this.scene.add(turqPlanet);
    this.celestialBodies.push(turqPlanet);

    // --- 5. 3D Amethyst Striped Exoplanet (Upper-Right Drift) ---
    const amethystGeo = new THREE.SphereGeometry(3.0, 48, 48);
    const amethystMat = new THREE.MeshStandardMaterial({
      map: this.createWhimsicalTexture('amethyst-bands'),
      roughness: 0.4,
      metalness: 0.12,
      emissive: 0x3b0764,
      emissiveIntensity: 0.25
    });
    const amethystPlanet = new THREE.Mesh(amethystGeo, amethystMat);
    amethystPlanet.position.set(24, 10.5, -110);
    amethystPlanet.userData = {
      mass: 60,
      baseX: 24,
      baseY: 10.5,
      vz: 0.08,
      orbitFreq: 0.0013,
      orbitRadiusX: 2.0,
      orbitRadiusY: 1.4,
      rotVelocity: new THREE.Vector3(0.003, 0.006, 0.002),
      resetZ: -160,
      limitZ: 32
    };
    this.scene.add(amethystPlanet);
    this.celestialBodies.push(amethystPlanet);
  }

  /**
   * Creates stylized whimsical tumbling 3D asteroids with gemstone & cosmic pastel colors
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
        x: 27, y: 6, z: -70,
        vz: 0.09,
        rot: new THREE.Vector3(0.015, 0.02, 0.01)
      },
      // Mid-Right Violet Asteroid
      {
        color: 0xba68c8,
        emissive: 0x6a1b9a,
        x: 28, y: -2, z: -115,
        vz: 0.085,
        rot: new THREE.Vector3(-0.01, 0.018, 0.015)
      },
      // Top-Left Turquoise Jade Asteroid
      {
        color: 0x4dd0e1,
        emissive: 0x00838f,
        x: -28, y: 7, z: -95,
        vz: 0.092,
        rot: new THREE.Vector3(0.012, -0.016, 0.02)
      },
      // Lower-Left Rose Quartz Asteroid
      {
        color: 0xf48fb1,
        emissive: 0xad1457,
        x: -27, y: -5, z: -130,
        vz: 0.078,
        rot: new THREE.Vector3(0.018, 0.014, -0.01)
      },
      // Distant Top Center-Right Amber Asteroid
      {
        color: 0xffd54f,
        emissive: 0xff8f00,
        x: 26, y: 16, z: -145,
        vz: 0.088,
        rot: new THREE.Vector3(-0.014, 0.022, 0.012)
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
        mass: 15,
        baseX: cfg.x,
        baseY: cfg.y,
        vz: cfg.vz,
        orbitFreq: 0.002 + (idx * 0.0004),
        orbitRadiusX: 1.6,
        orbitRadiusY: 1.2,
        rotVelocity: cfg.rot,
        resetZ: -160,
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
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Particle Starfield Forward Kinematics
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      const vels = this.starVelocities;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += this.forwardSpeed * vels[i];

        // Recycle star to distance when it flies past camera
        if (pos[i3 + 2] > 26) {
          pos[i3 + 2] = -400;
          pos[i3] = (Math.random() - 0.5) * 180;
          pos[i3 + 1] = (Math.random() - 0.5) * 120;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 2. 3D Celestial Bodies & Asteroids Kinematic Physics & Orbital Drift
    for (const body of this.celestialBodies) {
      const u = body.userData;

      // Axial Rotational Spin & Tumbling
      body.rotation.x += u.rotVelocity.x;
      body.rotation.y += u.rotVelocity.y;
      body.rotation.z += u.rotVelocity.z;

      // Moon Gravitational Orbit
      if (u.moonOrbitMesh) {
        const angle = Date.now() * u.moonOrbitSpeed;
        u.moonOrbitMesh.position.x = Math.cos(angle) * 4.4;
        u.moonOrbitMesh.position.z = Math.sin(angle) * 4.4;
      }

      // Forward Velocity
      body.position.z += u.vz;

      // Subtle Gravitational Orbital Drift Curve
      body.position.x = u.baseX + Math.sin(Date.now() * u.orbitFreq) * u.orbitRadiusX;
      body.position.y = u.baseY + Math.cos(Date.now() * u.orbitFreq) * u.orbitRadiusY;

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
