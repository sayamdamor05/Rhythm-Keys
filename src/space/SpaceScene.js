/**
 * SpaceScene.js // Realistic 3D Cosmic Exploration Simulation for Rhythm Keys
 * Spaceship Cruising Kinematics // Matte Realistic Planetary Textures // Natural Orbital & Parallax Physics
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
    this.starCount = 1600;
    
    // Controlled, majestic cruising velocity
    this.cruisingSpeed = 0.28;
    this.audioEnergy = 0;
    this.celestialBodies = [];
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // Subtle spaceship flight stabilization / cockpit drift
    this.shipSway = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      roll: 0
    };

    this.init();
  }

  setAudioEnergy(energy) {
    this.audioEnergy = Math.max(0, Math.min(1, energy));
  }

  init() {
    // 1. Scene & Camera (Inside Spaceship Observation Deck)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      1400
    );
    this.camera.position.set(0, 0, 24);

    // 2. High-Precision WebGL Renderer (Matte Physical Shading)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0.0); // Pure transparent for crisp gradient compositing
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // 3. Realistic Astrophysical Lighting (Dominant Solar Star + Luminous Backfill)
    const cosmicAmbient = new THREE.AmbientLight(0x6366f1, 1.8);
    this.scene.add(cosmicAmbient);

    // Primary Solar Star Key Light
    const stellarSun = new THREE.DirectionalLight(0xfffbeb, 4.5);
    stellarSun.position.set(60, 40, 30);
    this.scene.add(stellarSun);

    // Soft Rim Light for atmospheric scattering
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(-50, -20, -10);
    this.scene.add(rimLight);

    // 4. Build Environment Layers
    this.createVolumetricCosmicClouds();
    this.createStardustField();
    this.createRealisticCelestialSystem();
    this.createRealisticAsteroidBelt();

    // 5. Window & Mouse Events for Ship Drift
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);

    // 6. Start Physics Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  handleMouseMove(e) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.shipSway.targetX = x * 1.5;
    this.shipSway.targetY = y * 1.0;
  }

  /**
   * Volumetric Soft Deep-Space Cosmic Dust Clouds
   */
  createVolumetricCosmicClouds() {
    const nebulaGeo = new THREE.PlaneGeometry(240, 160);
    const nebulaConfigs = [
      { color1: 'rgba(168, 85, 247, 0.14)', color2: 'rgba(30, 27, 75, 0.25)', x: -35, y: 15, z: -220 },
      { color1: 'rgba(56, 189, 248, 0.12)', color2: 'rgba(15, 23, 42, 0.3)', x: 40, y: -20, z: -260 },
      { color1: 'rgba(244, 114, 182, 0.10)', color2: 'rgba(49, 10, 50, 0.2)', x: 0, y: 30, z: -300 }
    ];

    nebulaConfigs.forEach((cfg) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
      grad.addColorStop(0, cfg.color1);
      grad.addColorStop(0.65, cfg.color2);
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
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      this.scene.add(mesh);
    });
  }

  /**
   * 3D Particle Starfield with Realistic Astronomical Luminosity
   */
  createStardustField() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.8)');
    radGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.3)');
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

    // Realistic Stellar Classes (O, B, A, F, G, K, M)
    const stellarSpectrum = [
      new THREE.Color(0xffffff), // Class A (Pure White)
      new THREE.Color(0xfef08a), // Class G (Solar Yellow)
      new THREE.Color(0x38bdf8), // Class B (Sky Blue)
      new THREE.Color(0xfbcfe8), // Class M (Soft Pink/Red Dwarf)
      new THREE.Color(0xc084fc)  // Class F (Pale Lavender)
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 260;
      positions[i3 + 1] = (Math.random() - 0.5) * 160;
      positions[i3 + 2] = -Math.random() * 350;

      const col = stellarSpectrum[Math.floor(Math.random() * stellarSpectrum.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      velocities[i] = Math.random() * 0.4 + 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.5,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.starVelocities = velocities;
    this.scene.add(this.stars);
  }

  /**
   * Procedural Realistic Matte Planet Surface Textures
   */
  createRealisticPlanetaryTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'gas-giant-saturn') {
      // Realistic multi-layered atmospheric bands & subtle storm swirls
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#4a3b69');
      grad.addColorStop(0.15, '#7c5295');
      grad.addColorStop(0.3, '#c084fc');
      grad.addColorStop(0.45, '#e9d5ff');
      grad.addColorStop(0.55, '#f472b6');
      grad.addColorStop(0.7, '#a855f7');
      grad.addColorStop(0.85, '#6b21a8');
      grad.addColorStop(1.0, '#3b0764');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Fine atmospheric micro-bands
      for (let y = 10; y < 512; y += 8) {
        ctx.fillStyle = (y % 16 === 0) ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, y, 1024, 4);
      }

      // Atmospheric storm cyclones
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.ellipse(320, 220, 48, 18, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.beginPath();
      ctx.ellipse(750, 310, 36, 14, -0.1, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'cratered-lunar') {
      // Realistic lunar basalt & cratered terrain
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 1024, 512);

      // Basaltic maria plains
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(380, 260, 140, 90, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(720, 300, 120, 80, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Realistic impact craters with elevated rims and shadow interiors
      const craters = [
        { x: 220, y: 160, r: 42 },
        { x: 520, y: 190, r: 35 },
        { x: 440, y: 380, r: 50 },
        { x: 800, y: 220, r: 38 },
        { x: 880, y: 370, r: 45 },
        { x: 140, y: 340, r: 28 },
        { x: 640, y: 140, r: 24 }
      ];

      craters.forEach(c => {
        // Shadow base
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Sunlight illuminated rim (illuminated from upper-left)
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.2, c.y - c.r * 0.2, c.r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Crater floor
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.05, c.y - c.r * 0.05, c.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (type === 'oceanic-terrestrial') {
      // Deep blue oceanic planet with landmasses and swirling cloud belts
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, 0, 1024, 512);

      // Continents
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(260, 240, 120, 80, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(680, 270, 160, 95, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      // Photo-realistic Earth-like continental biomes and bathymetry
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 1024; x++) {
          const nx = x / 1024;
          const ny = y / 512;
          const elevation = SpaceScene.fbm(nx * 4.5, ny * 4.5, 6, 0.55, 2.0);
          const idx = (y * 1024 + x) * 4;

          if (elevation > 0.52) {
            // Continental landmass (forests, savannah, mountain peaks)
            const veg = (elevation - 0.52) / 0.48;
            data[idx] = Math.floor(34 + veg * 95);       // R
            data[idx + 1] = Math.floor(110 + veg * 80);  // G
            data[idx + 2] = Math.floor(45 + veg * 40);   // B
          } else {
            // Oceanic bathymetry (deep abyss to shallow turquoise coastal shelves)
            const depth = elevation / 0.52;
            data[idx] = Math.floor(6 + depth * 22);      // R
            data[idx + 1] = Math.floor(40 + depth * 90);  // G
            data[idx + 2] = Math.floor(100 + depth * 140); // B
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

    } else if (type === 'volcanic-magma') {
      // Photo-realistic tectonic magma rift plates
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 1024; x++) {
          const nx = x / 1024;
          const ny = y / 512;
          const crust = SpaceScene.fbm(nx * 6.0, ny * 6.0, 5, 0.5, 2.0);
          const rift = Math.abs(Math.sin(crust * 16.0));
          const idx = (y * 1024 + x) * 4;

          if (rift < 0.12) {
            // Incandescent magma channel
            const mag = (0.12 - rift) / 0.12;
            data[idx] = 255;                             // R
            data[idx + 1] = Math.floor(90 + mag * 165);  // G
            data[idx + 2] = Math.floor(10 + mag * 60);   // B
          } else {
            // Cooled basaltic volcanic crust
            const b = Math.floor(25 + crust * 30);
            data[idx] = b;
            data[idx + 1] = Math.floor(b * 0.9);
            data[idx + 2] = Math.floor(b * 0.85);
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

    } else if (type === 'ice-giant-aquamarine') {
      // Photo-realistic methane ice giant atmospheric haze
      for (let y = 0; y < 512; y++) {
        const ny = y / 512;
        const poleHaze = Math.cos((ny - 0.5) * Math.PI);
        for (let x = 0; x < 1024; x++) {
          const nx = x / 1024;
          const noise = SpaceScene.fbm(nx * 10.0, ny * 18.0, 4, 0.45, 2.1);
          const idx = (y * 1024 + x) * 4;

          data[idx] = Math.floor(20 + noise * 50 + poleHaze * 30);     // R
          data[idx + 1] = Math.floor(130 + noise * 60 + poleHaze * 50); // G
          data[idx + 2] = Math.floor(200 + noise * 45 + poleHaze * 35); // B
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

    } else {
      // Photorealistic Solar Corona Surface
      const grad = ctx.createRadialGradient(512, 256, 40, 512, 256, 512);
      grad.addColorStop(0.0, '#fef08a');
      grad.addColorStop(0.3, '#fde047');
      grad.addColorStop(0.65, '#f97316');
      grad.addColorStop(1.0, '#c2410c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Procedural Cloud Layer Texture for Terrestrial Worlds
   */
  createCloudLayerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const nx = x / 1024;
        const ny = y / 512;
        const clouds = SpaceScene.fbm(nx * 8.0, ny * 6.0, 5, 0.5, 2.2);
        const idx = (y * 1024 + x) * 4;

        if (clouds > 0.48) {
          const alpha = (clouds - 0.48) / 0.52;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = Math.floor(alpha * 220);
        } else {
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Photo-Realistic Multi-Tier Celestial Planetary System
   */
  createRealisticCelestialSystem() {
    // --- 1. Ringed Gas Giant (Saturn Archetype) with Rayleigh Atmosphere ---
    const saturnGeo = new THREE.SphereGeometry(7.2, 64, 64);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('gas-giant-saturn'),
      roughness: 0.92,
      metalness: 0.01
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);

    // Add Atmospheric Rayleigh Scattering Limb Halo
    const saturnAtmosphere = this.createAtmosphericGlowMesh(7.2, 0xc084fc, 3.2);
    saturnMesh.add(saturnAtmosphere);

    // Realistic Dust Ring with Inner Cassini Divisions & Encke Gap
    const ringGeo = new THREE.RingGeometry(9.0, 15.2, 128);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 512;
    const ringCtx = ringCanvas.getContext('2d');
    const ringGrad = ringCtx.createRadialGradient(256, 256, 70, 256, 256, 256);
    ringGrad.addColorStop(0.0, 'rgba(216, 180, 254, 0)');
    ringGrad.addColorStop(0.12, 'rgba(216, 180, 254, 0.6)');
    ringGrad.addColorStop(0.48, 'rgba(244, 114, 182, 0.85)');
    ringGrad.addColorStop(0.58, 'rgba(15, 23, 42, 0.05)'); // Cassini Division Gap
    ringGrad.addColorStop(0.68, 'rgba(192, 132, 252, 0.8)');
    ringGrad.addColorStop(0.85, 'rgba(192, 132, 252, 0.4)');
    ringGrad.addColorStop(1.0, 'rgba(192, 132, 252, 0)');
    ringCtx.fillStyle = ringGrad;
    ringCtx.fillRect(0, 0, 512, 512);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.95,
      metalness: 0.0
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.35;
    ringMesh.rotation.y = -Math.PI / 7;
    saturnMesh.add(ringMesh);

    saturnMesh.position.set(-36, 10, -75);
    saturnMesh.userData = {
      baseX: -36,
      baseY: 10,
      vz: 0.045,
      rotVelocity: new THREE.Vector3(0.0002, 0.0012, 0.0001),
      resetZ: -180,
      limitZ: 38
    };
    this.scene.add(saturnMesh);
    this.celestialBodies.push(saturnMesh);

    // --- 2. Cratered Terrestrial Moon with Regolith Bump Shading ---
    const moonGeo = new THREE.SphereGeometry(5.2, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('cratered-lunar'),
      roughness: 0.96,
      metalness: 0.01
    });
    const moonPlanet = new THREE.Mesh(moonGeo, moonMat);
    moonPlanet.position.set(-34, -13, -60);
    moonPlanet.userData = {
      baseX: -34,
      baseY: -13,
      vz: 0.055,
      rotVelocity: new THREE.Vector3(0.0003, 0.0008, -0.0002),
      resetZ: -170,
      limitZ: 38
    };
    this.scene.add(moonPlanet);
    this.celestialBodies.push(moonPlanet);

    // --- 3. Oceanic Exoplanet with Dual 3D Cloud Layer & Atmospheric Glow ---
    const oceanGroup = new THREE.Group();
    const oceanGeo = new THREE.SphereGeometry(6.2, 64, 64);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('oceanic-terrestrial'),
      roughness: 0.78,
      metalness: 0.02
    });
    const oceanPlanet = new THREE.Mesh(oceanGeo, oceanMat);
    oceanGroup.add(oceanPlanet);

    // Independent 3D Floating Cloud Sphere (Parallax Depth)
    const cloudGeo = new THREE.SphereGeometry(6.3, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: this.createCloudLayerTexture(),
      transparent: true,
      opacity: 0.85,
      roughness: 0.95,
      blending: THREE.NormalBlending
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    oceanGroup.add(cloudMesh);

    // Atmospheric Rayleigh Scattering
    const oceanAtmosphere = this.createAtmosphericGlowMesh(6.2, 0x38bdf8, 3.0);
    oceanGroup.add(oceanAtmosphere);

    // Orbiting Sub-Moon
    const subMoonGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const subMoonMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('cratered-lunar'),
      roughness: 0.95
    });
    const subMoon = new THREE.Mesh(subMoonGeo, subMoonMat);
    subMoon.position.set(9.0, 1.2, 0);
    oceanGroup.add(subMoon);

    oceanGroup.position.set(38, -6, -65);
    oceanGroup.userData = {
      baseX: 38,
      baseY: -6,
      vz: 0.06,
      orbitMesh: subMoon,
      cloudMesh: cloudMesh,
      orbitSpeed: 0.0015,
      rotVelocity: new THREE.Vector3(0.0002, 0.0016, 0.0003),
      resetZ: -175,
      limitZ: 38
    };
    this.scene.add(oceanGroup);
    this.celestialBodies.push(oceanGroup);

    // --- 4. The Vela Pulsar / Magnetar with Relativistic Synchrotron Plasma Jets ---
    const pulsarGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const pulsarCore = new THREE.Mesh(coreGeo, coreMat);
    pulsarGroup.add(pulsarCore);

    // Accretion Disk
    const diskGeo = new THREE.RingGeometry(3.2, 7.5, 64);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.rotation.x = Math.PI / 2;
    pulsarGroup.add(diskMesh);

    // Relativistic Particle Cones
    const jetGeo = new THREE.ConeGeometry(2.2, 28, 32, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const topJet = new THREE.Mesh(jetGeo, jetMat);
    topJet.position.y = 14.5;
    pulsarGroup.add(topJet);

    const bottomJet = new THREE.Mesh(jetGeo, jetMat);
    bottomJet.position.y = -14.5;
    bottomJet.rotation.x = Math.PI;
    pulsarGroup.add(bottomJet);

    pulsarGroup.position.set(-40, 16, -95);
    pulsarGroup.userData = {
      baseX: -40,
      baseY: 16,
      vz: 0.04,
      rotVelocity: new THREE.Vector3(0.004, 0.035, 0.002),
      resetZ: -200,
      limitZ: 38
    };
    this.scene.add(pulsarGroup);
    this.celestialBodies.push(pulsarGroup);

    // --- 5. Volcanic Magma Exoplanet with Atmosphere Glow ---
    const magmaGeo = new THREE.SphereGeometry(5.4, 48, 48);
    const magmaMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('volcanic-magma'),
      roughness: 0.92,
      metalness: 0.05
    });
    const magmaPlanet = new THREE.Mesh(magmaGeo, magmaMat);
    const magmaAtmosphere = this.createAtmosphericGlowMesh(5.4, 0xf97316, 3.6);
    magmaPlanet.add(magmaAtmosphere);

    magmaPlanet.position.set(39, 14, -80);
    magmaPlanet.userData = {
      baseX: 39,
      baseY: 14,
      vz: 0.05,
      rotVelocity: new THREE.Vector3(0.0003, 0.0014, -0.0002),
      resetZ: -185,
      limitZ: 38
    };
    this.scene.add(magmaPlanet);
    this.celestialBodies.push(magmaPlanet);

    // --- 6. Ice Giant with Vertical Polar Ring & Cyan Methane Halo ---
    const iceGeo = new THREE.SphereGeometry(4.8, 48, 48);
    const iceMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('ice-giant-aquamarine'),
      roughness: 0.88,
      metalness: 0.01
    });
    const icePlanet = new THREE.Mesh(iceGeo, iceMat);
    const iceAtmosphere = this.createAtmosphericGlowMesh(4.8, 0x38bdf8, 3.0);
    icePlanet.add(iceAtmosphere);

    const iceRingGeo = new THREE.RingGeometry(6.4, 9.4, 64);
    const iceRingMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const iceRing = new THREE.Mesh(iceRingGeo, iceRingMat);
    iceRing.rotation.y = Math.PI / 2.1;
    icePlanet.add(iceRing);

    icePlanet.position.set(-37, -2, -90);
    icePlanet.userData = {
      baseX: -37,
      baseY: -2,
      vz: 0.052,
      rotVelocity: new THREE.Vector3(0.0002, 0.0011, 0.0004),
      resetZ: -190,
      limitZ: 38
    };
    this.scene.add(icePlanet);
    this.celestialBodies.push(icePlanet);

    // --- 7. Deep-Space Orbital Relay Station ---
    const stationGroup = new THREE.Group();
    const hubGeo = new THREE.CylinderGeometry(0.9, 0.9, 4.2, 16);
    const stationMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      metalness: 0.8
    });
    const hubMesh = new THREE.Mesh(hubGeo, stationMat);
    stationGroup.add(hubMesh);

    const torusGeo = new THREE.TorusGeometry(3.6, 0.4, 12, 32);
    const torusMesh = new THREE.Mesh(torusGeo, stationMat);
    torusMesh.rotation.x = Math.PI / 2;
    stationGroup.add(torusMesh);

    const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, 2.3, 0);
    stationGroup.add(beaconMesh);

    stationGroup.position.set(34, 10, -50);
    stationGroup.userData = {
      baseX: 34,
      baseY: 10,
      vz: 0.07,
      rotVelocity: new THREE.Vector3(0.001, 0.008, 0.002),
      resetZ: -160,
      limitZ: 38
    };
    this.scene.add(stationGroup);
    this.celestialBodies.push(stationGroup);

    // --- 8. Long-Period Icy Comet with Trailing Ion & Dust Tail ---
    const cometGroup = new THREE.Group();
    const cometNucleusGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const cometMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.96
    });
    const cometNucleus = new THREE.Mesh(cometNucleusGeo, cometMat);
    cometGroup.add(cometNucleus);

    const tailGeo = new THREE.ConeGeometry(2.4, 32, 16, 1, true);
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const tailMesh = new THREE.Mesh(tailGeo, tailMat);
    tailMesh.rotation.x = -Math.PI / 2;
    tailMesh.position.z = -16;
    cometGroup.add(tailMesh);

    cometGroup.position.set(-30, 18, -45);
    cometGroup.userData = {
      baseX: -30,
      baseY: 18,
      vz: 0.09,
      rotVelocity: new THREE.Vector3(0.002, 0.003, 0.005),
      resetZ: -150,
      limitZ: 38
    };
    this.scene.add(cometGroup);
    this.celestialBodies.push(cometGroup);
  }

  /**
   * Realistic Matte Rocky Asteroids with Procedural Craggy Surface Deformations
   */
  createRealisticAsteroidBelt() {
    const asteroidGeometries = [
      new THREE.DodecahedronGeometry(1.4, 2),
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.DodecahedronGeometry(1.0, 1),
      new THREE.IcosahedronGeometry(1.5, 2),
      new THREE.DodecahedronGeometry(1.1, 1)
    ];

    // Deform asteroid vertices with fractal noise for realistic rocky boulders
    asteroidGeometries.forEach(geo => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const noise = 1.0 + (SpaceScene.fbm(vx * 3.0, vy * 3.0, 3, 0.5, 2.0) - 0.5) * 0.35;
        pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
      }
      geo.computeVertexNormals();
    });

    const asteroidConfigs = [
      { color: 0x78716c, x: 27, y: 6, z: -70, vz: 0.08, rot: new THREE.Vector3(0.003, 0.005, 0.002) },
      { color: 0x57534e, x: 29, y: -4, z: -110, vz: 0.075, rot: new THREE.Vector3(-0.003, 0.004, 0.003) },
      { color: 0xa8a29e, x: -28, y: 7, z: -85, vz: 0.085, rot: new THREE.Vector3(0.002, -0.004, 0.005) },
      { color: 0x64748b, x: -27, y: -7, z: -130, vz: 0.07, rot: new THREE.Vector3(0.004, 0.003, -0.002) },
      { color: 0x71717a, x: 26, y: 16, z: -160, vz: 0.065, rot: new THREE.Vector3(-0.003, 0.005, 0.003) }
    ];

    asteroidConfigs.forEach((cfg, idx) => {
      const geo = asteroidGeometries[idx % asteroidGeometries.length];
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.98,
        metalness: 0.02,
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
        limitZ: 38
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
   * Main Realistic Spaceship Flight Simulation Loop
   */
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Dynamic audio energy response
    const speedBoost = 1.0 + (this.audioEnergy * 0.5);
    const currentSpeed = this.cruisingSpeed * speedBoost;

    // 1. Realistic Spaceship Cockpit Sway / Flight Inertia
    this.shipSway.currentX += (this.shipSway.targetX - this.shipSway.currentX) * 0.03;
    this.shipSway.currentY += (this.shipSway.targetY - this.shipSway.currentY) * 0.03;
    this.shipSway.roll = -this.shipSway.currentX * 0.015;

    this.camera.position.x = this.shipSway.currentX * 0.6;
    this.camera.position.y = this.shipSway.currentY * 0.4;
    this.camera.rotation.z = this.shipSway.roll;

    // 2. Parallax Stardust Kinematics
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      const vels = this.starVelocities;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += currentSpeed * vels[i];

        // Reset past camera back to deep distance
        if (pos[i3 + 2] > 24) {
          pos[i3 + 2] = -420;
          pos[i3] = (Math.random() - 0.5) * 220;
          pos[i3 + 1] = (Math.random() - 0.5) * 150;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Realistic Celestial Bodies Translation & Axial Inertia
    for (const body of this.celestialBodies) {
      const u = body.userData;

      // 3-Axis Rotational Inertia (Axial Tilt Spin & Asteroid Tumbling)
      body.rotation.x += u.rotVelocity.x;
      body.rotation.y += u.rotVelocity.y;
      body.rotation.z += u.rotVelocity.z;

      // Realistic Satellite Moon Orbiting & Cloud Parallax
      if (u.orbitMesh) {
        const angle = Date.now() * u.orbitSpeed;
        u.orbitMesh.position.x = Math.cos(angle) * 5.4;
        u.orbitMesh.position.z = Math.sin(angle) * 5.4;
      }
      if (u.cloudMesh) {
        u.cloudMesh.rotation.y += 0.0006;
      }

      // Smooth, majestic cruising forward travel
      body.position.z += u.vz * speedBoost;

      // Margin preservation with gentle parallax drift
      body.position.x = u.baseX - (this.shipSway.currentX * 0.3);
      body.position.y = u.baseY - (this.shipSway.currentY * 0.2);

      // Smooth recycle to distant deep space
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
    window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

