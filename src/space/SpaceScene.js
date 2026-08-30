/**
 * SpaceScene.js // Rock-Solid Ultra-High Performance 3D Space Cosmos
 * Instantaneous Procedural Textures // Realistic Atmospheric Planets // Spaceship Cruising Flight
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
    this.starCount = 2000;
    
    // Controlled, majestic cruising velocity
    this.cruisingSpeed = 0.28;
    this.audioEnergy = 0;
    this.celestialBodies = [];
    this.animationFrameId = null;

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
    try {
      // 1. Scene & Perspective Camera (Observation Deck View)
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        54,
        window.innerWidth / window.innerHeight,
        0.1,
        1500
      );
      this.camera.position.set(0, 0, 24);

      // 2. High-Performance WebGL Renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x000000, 0.0);

      // 3. Astrophysical Sunlight & Ambient
      const cosmicAmbient = new THREE.AmbientLight(0x6366f1, 2.0);
      this.scene.add(cosmicAmbient);

      const stellarSun = new THREE.DirectionalLight(0xfffbeb, 4.5);
      stellarSun.position.set(60, 40, 30);
      this.scene.add(stellarSun);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
      rimLight.position.set(-50, -20, -10);
      this.scene.add(rimLight);

      // 4. Build Environment Layers
      this.createVolumetricCosmicClouds();
      this.createStardustField();
      this.createRealisticCelestialSystem();
      this.createRealisticAsteroidBelt();

      // 5. Window & Mouse Events
      this.handleResize = this.handleResize.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('mousemove', this.handleMouseMove);

      // 6. Start Render Loop
      this.animate = this.animate.bind(this);
      this.animate();
    } catch (err) {
      console.error("SpaceScene init error:", err);
    }
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
      { color1: 'rgba(168, 85, 247, 0.18)', color2: 'rgba(30, 27, 75, 0.35)', x: -35, y: 15, z: -140 },
      { color1: 'rgba(56, 189, 248, 0.16)', color2: 'rgba(15, 23, 42, 0.35)', x: 40, y: -20, z: -160 },
      { color1: 'rgba(244, 114, 182, 0.14)', color2: 'rgba(49, 10, 50, 0.25)', x: 0, y: 25, z: -180 }
    ];

    nebulaConfigs.forEach((cfg) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      grad.addColorStop(0, cfg.color1);
      grad.addColorStop(0.65, cfg.color2);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

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
    radGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.9)');
    radGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
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

    const stellarSpectrum = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xfef08a),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfbcfe8),
      new THREE.Color(0xc084fc)
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 240;
      positions[i3 + 1] = (Math.random() - 0.5) * 150;
      positions[i3 + 2] = -Math.random() * 300;

      const col = stellarSpectrum[Math.floor(Math.random() * stellarSpectrum.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      velocities[i] = Math.random() * 0.45 + 0.35;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.8,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.starVelocities = velocities;
    this.scene.add(this.stars);
  }

  /**
   * Fast, High-Quality Procedural Planetary Texture Generator
   */
  createRealisticPlanetaryTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'gas-giant-saturn') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, '#3b0764');
      grad.addColorStop(0.2, '#6b21a8');
      grad.addColorStop(0.4, '#c084fc');
      grad.addColorStop(0.55, '#f472b6');
      grad.addColorStop(0.7, '#e9d5ff');
      grad.addColorStop(0.85, '#a855f7');
      grad.addColorStop(1.0, '#4a3b69');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      for (let y = 6; y < 256; y += 8) {
        ctx.fillStyle = (y % 16 === 0) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, y, 512, 4);
      }

      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.beginPath();
      ctx.ellipse(180, 120, 36, 14, 0.08, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'cratered-lunar') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(160, 120, 70, 45, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(360, 150, 60, 40, -0.2, 0, Math.PI * 2);
      ctx.fill();

      const craters = [
        { x: 110, y: 80, r: 22 }, { x: 260, y: 95, r: 25 }, { x: 210, y: 190, r: 28 },
        { x: 410, y: 100, r: 20 }, { x: 440, y: 180, r: 24 }, { x: 70, y: 170, r: 16 }
      ];
      craters.forEach(c => {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.22, c.y - c.r * 0.22, c.r * 0.88, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(c.x - c.r * 0.08, c.y - c.r * 0.08, c.r * 0.72, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (type === 'oceanic-terrestrial') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(140, 120, 65, 45, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(340, 135, 80, 50, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(60 + i * 80, 90 + (i % 3) * 35, 24, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'volcanic-magma') {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(60, 40);
      ctx.lineTo(120, 90);
      ctx.lineTo(190, 70);
      ctx.lineTo(260, 145);
      ctx.lineTo(340, 110);
      ctx.lineTo(430, 180);
      ctx.stroke();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.stroke();

      const calderas = [{ x: 150, y: 160, r: 24 }, { x: 370, y: 80, r: 18 }];
      calderas.forEach(c => {
        const rad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.r);
        rad.addColorStop(0, '#fef08a');
        rad.addColorStop(0.4, '#f97316');
        rad.addColorStop(0.8, '#dc2626');
        rad.addColorStop(1, '#1c1917');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (type === 'ice-giant-aquamarine') {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, '#0c4a6e');
      grad.addColorStop(0.3, '#0284c7');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(0.7, '#7dd3fc');
      grad.addColorStop(1.0, '#0369a1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      for (let y = 8; y < 256; y += 10) {
        ctx.fillStyle = (y % 20 === 0) ? 'rgba(255, 255, 255, 0.18)' : 'rgba(12, 74, 110, 0.15)';
        ctx.fillRect(0, y, 512, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Atmospheric Glow Halo Sprite
   */
  createAtmosphericGlowMesh(radius, glowColor = '#38bdf8') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 30, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.65, glowColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(radius * 2.8, radius * 2.8, 1);
    return sprite;
  }

  /**
   * Photo-Realistic Multi-Tier Celestial Planetary System
   */
  createRealisticCelestialSystem() {
    // --- 1. Ringed Gas Giant (Saturn Archetype) ---
    const saturnGeo = new THREE.SphereGeometry(7.5, 48, 48);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('gas-giant-saturn'),
      roughness: 0.9,
      metalness: 0.01
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);

    // Atmospheric Glow
    const saturnGlow = this.createAtmosphericGlowMesh(7.5, 'rgba(192, 132, 252, 0.5)');
    saturnMesh.add(saturnGlow);

    // Dust Ring with Cassini Division
    const ringGeo = new THREE.RingGeometry(9.2, 15.6, 64);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 256;
    const ringCtx = ringCanvas.getContext('2d');
    const ringGrad = ringCtx.createRadialGradient(128, 128, 35, 128, 128, 128);
    ringGrad.addColorStop(0.0, 'rgba(216, 180, 254, 0)');
    ringGrad.addColorStop(0.15, 'rgba(216, 180, 254, 0.7)');
    ringGrad.addColorStop(0.48, 'rgba(244, 114, 182, 0.85)');
    ringGrad.addColorStop(0.58, 'rgba(15, 23, 42, 0.05)');
    ringGrad.addColorStop(0.68, 'rgba(192, 132, 252, 0.8)');
    ringGrad.addColorStop(1.0, 'rgba(192, 132, 252, 0)');
    ringCtx.fillStyle = ringGrad;
    ringCtx.fillRect(0, 0, 256, 256);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      roughness: 0.95
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

    // --- 2. Cratered Lunar Moon ---
    const moonGeo = new THREE.SphereGeometry(5.2, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('cratered-lunar'),
      roughness: 0.95,
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

    // --- 3. Oceanic Exoplanet with Orbital Sub-Moon ---
    const oceanGroup = new THREE.Group();
    const oceanGeo = new THREE.SphereGeometry(6.2, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('oceanic-terrestrial'),
      roughness: 0.8,
      metalness: 0.02
    });
    const oceanPlanet = new THREE.Mesh(oceanGeo, oceanMat);
    oceanGroup.add(oceanPlanet);

    const oceanGlow = this.createAtmosphericGlowMesh(6.2, 'rgba(56, 189, 248, 0.55)');
    oceanGroup.add(oceanGlow);

    // Sub-Moon
    const subMoonGeo = new THREE.SphereGeometry(1.2, 24, 24);
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
      orbitSpeed: 0.0015,
      rotVelocity: new THREE.Vector3(0.0002, 0.0016, 0.0003),
      resetZ: -175,
      limitZ: 38
    };
    this.scene.add(oceanGroup);
    this.celestialBodies.push(oceanGroup);

    // --- 4. Volcanic Magma Exoplanet ---
    const magmaGeo = new THREE.SphereGeometry(5.4, 48, 48);
    const magmaMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('volcanic-magma'),
      roughness: 0.92,
      metalness: 0.05
    });
    const magmaPlanet = new THREE.Mesh(magmaGeo, magmaMat);
    const magmaGlow = this.createAtmosphericGlowMesh(5.4, 'rgba(249, 115, 22, 0.5)');
    magmaPlanet.add(magmaGlow);

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

    // --- 6. Ice Giant with Vertical Polar Ring ---
    const iceGeo = new THREE.SphereGeometry(4.8, 48, 48);
    const iceMat = new THREE.MeshStandardMaterial({
      map: this.createRealisticPlanetaryTexture('ice-giant-aquamarine'),
      roughness: 0.88,
      metalness: 0.01
    });
    const icePlanet = new THREE.Mesh(iceGeo, iceMat);
    const iceGlow = this.createAtmosphericGlowMesh(4.8, 'rgba(56, 189, 248, 0.5)');
    icePlanet.add(iceGlow);

    const iceRingGeo = new THREE.RingGeometry(6.4, 9.4, 48);
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

    // --- 8. Long-Period Icy Comet with Trailing Tail ---
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
   * Realistic Matte Rocky Asteroids
   */
  createRealisticAsteroidBelt() {
    const asteroidGeometries = [
      new THREE.DodecahedronGeometry(1.6, 0),
      new THREE.IcosahedronGeometry(1.4, 0),
      new THREE.DodecahedronGeometry(1.2, 0),
      new THREE.IcosahedronGeometry(1.8, 0),
      new THREE.DodecahedronGeometry(1.3, 0)
    ];

    const asteroidConfigs = [
      { color: 0x78716c, x: 27, y: 6, z: -40, vz: 0.08, rot: new THREE.Vector3(0.003, 0.005, 0.002) },
      { color: 0x57534e, x: 29, y: -4, z: -60, vz: 0.075, rot: new THREE.Vector3(-0.003, 0.004, 0.003) },
      { color: 0xa8a29e, x: -28, y: 7, z: -50, vz: 0.085, rot: new THREE.Vector3(0.002, -0.004, 0.005) },
      { color: 0x64748b, x: -27, y: -7, z: -70, vz: 0.07, rot: new THREE.Vector3(0.004, 0.003, -0.002) },
      { color: 0x71717a, x: 26, y: 16, z: -80, vz: 0.065, rot: new THREE.Vector3(-0.003, 0.005, 0.003) }
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
        resetZ: -160,
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

    const speedBoost = 1.0 + (this.audioEnergy * 0.5);
    const currentSpeed = this.cruisingSpeed * speedBoost;

    // 1. Spaceship Cockpit Sway / Flight Inertia
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

        if (pos[i3 + 2] > 24) {
          pos[i3 + 2] = -300;
          pos[i3] = (Math.random() - 0.5) * 240;
          pos[i3 + 1] = (Math.random() - 0.5) * 150;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Realistic Celestial Bodies Translation & Axial Inertia
    for (const body of this.celestialBodies) {
      const u = body.userData;

      body.rotation.x += u.rotVelocity.x;
      body.rotation.y += u.rotVelocity.y;
      body.rotation.z += u.rotVelocity.z;

      if (u.orbitMesh) {
        const angle = Date.now() * u.orbitSpeed;
        u.orbitMesh.position.x = Math.cos(angle) * 9.0;
        u.orbitMesh.position.z = Math.sin(angle) * 9.0;
      }

      body.position.z += u.vz * speedBoost;

      body.position.x = u.baseX - (this.shipSway.currentX * 0.3);
      body.position.y = u.baseY - (this.shipSway.currentY * 0.2);

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

