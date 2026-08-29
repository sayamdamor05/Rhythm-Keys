/**
 * SpaceScene.js // Three.js Matte 3D Space Background for Rhythm Keys
 * Ultra-smooth slow background drift with rich variety of planets, moons, asteroids and celestial bodies.
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
    this.starCount = 450;
    this.starSpeed = 0.15; // Decreased speed for calm, majestic background glide
    this.planets = [];
    this.celestialBodies = [];
    this.galaxyMesh = null;
    this.animationFrameId = null;

    this.init();
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 25;

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x050b18, 1.0);

    // 3. Matte Soft Lighting
    const ambientLight = new THREE.AmbientLight(0x506080, 2.4);
    this.scene.add(ambientLight);

    const softLightLeft = new THREE.DirectionalLight(0x70d6ff, 1.6);
    softLightLeft.position.set(-35, 25, 30);
    this.scene.add(softLightLeft);

    const softLightRight = new THREE.DirectionalLight(0xff9ebb, 1.4);
    softLightRight.position.set(35, -25, 30);
    this.scene.add(softLightRight);

    // 4. Build Environment
    this.createSoftNebula();
    this.createDistantGalaxy();
    this.createCleanStarfield();
    this.createAllCelestialBodies();

    // 5. Window Resize Handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 6. Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  createSoftNebula() {
    const nebulaGeo = new THREE.PlaneGeometry(120, 85);

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, i === 0 ? 'rgba(76, 29, 149, 0.22)' : 'rgba(29, 78, 216, 0.18)');
      grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(nebulaGeo, material);
      mesh.position.set(
        (i - 1) * 40,
        (i % 2 === 0 ? 8 : -8),
        -90 - (i * 25)
      );
      this.scene.add(mesh);
    }
  }

  createDistantGalaxy() {
    // Distant spiral galaxy disc in the deep void
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 5, 128, 128, 120);
    grad.addColorStop(0, 'rgba(233, 213, 255, 0.4)');
    grad.addColorStop(0.3, 'rgba(168, 85, 247, 0.25)');
    grad.addColorStop(0.7, 'rgba(59, 130, 246, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const galaxyTex = new THREE.CanvasTexture(canvas);
    const galaxyGeo = new THREE.PlaneGeometry(35, 35);
    const galaxyMat = new THREE.MeshBasicMaterial({
      map: galaxyTex,
      transparent: true,
      depthWrite: false
    });

    this.galaxyMesh = new THREE.Mesh(galaxyGeo, galaxyMat);
    this.galaxyMesh.position.set(22, 16, -140);
    this.galaxyMesh.rotation.x = Math.PI / 4;
    this.scene.add(this.galaxyMesh);
  }

  createCleanStarfield() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    radGrad.addColorStop(0.4, 'rgba(200, 225, 255, 0.5)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const starTexture = new THREE.CanvasTexture(canvas);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    const softPalette = [
      new THREE.Color(0xf1f5f9),
      new THREE.Color(0xbae6fd),
      new THREE.Color(0xfbcfe8),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xe9d5ff)
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 160;
      positions[i3 + 1] = (Math.random() - 0.5) * 110;
      positions[i3 + 2] = -Math.random() * 300;

      const col = softPalette[Math.floor(Math.random() * softPalette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.scene.add(this.stars);
  }

  createMatteTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'gas-giant') {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#f4a261');
      grad.addColorStop(0.25, '#e76f51');
      grad.addColorStop(0.5, '#f4a261');
      grad.addColorStop(0.75, '#e9c46a');
      grad.addColorStop(1.0, '#f4a261');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let y = 40; y < 512; y += 60) {
        ctx.fillRect(0, y, 512, 16);
      }
    } else if (type === 'matte-pink') {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#ff9ebb');
      grad.addColorStop(0.5, '#f472b6');
      grad.addColorStop(1.0, '#db2777');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(200, 180, 70, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'oceanic-blue') {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#70d6ff');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1.0, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    } else if (type === 'emerald-planet') {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#a7f3d0');
      grad.addColorStop(0.4, '#10b981');
      grad.addColorStop(0.8, '#047857');
      grad.addColorStop(1.0, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(280, 220, 60, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'purple-saturn') {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#c084fc');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(1.0, '#581c87');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    } else if (type === 'ruby-planet') {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#fda4af');
      grad.addColorStop(0.5, '#e11d48');
      grad.addColorStop(1.0, '#881337');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    return new THREE.CanvasTexture(canvas);
  }

  createAllCelestialBodies() {
    // --- 1. TOP-LEFT: Oceanic Blue Planet + Moon ---
    const p1Geo = new THREE.SphereGeometry(2.8, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('oceanic-blue'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet1 = new THREE.Mesh(p1Geo, p1Mat);
    planet1.position.set(-27, 11, -12);

    const moonGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      metalness: 0.0
    });
    const moon1 = new THREE.Mesh(moonGeo, moonMat);
    moon1.position.set(4.2, 0.6, 0);
    planet1.add(moon1);

    planet1.userData = {
      baseX: -27,
      baseY: 11,
      speedZ: 0.008,
      rotY: 0.002,
      moonOrbit: moon1,
      resetZ: -90,
      limitZ: 25
    };
    this.scene.add(planet1);
    this.planets.push(planet1);

    // --- 2. MID-LEFT: Emerald Green Terrestrial Exoplanet ---
    const p2Geo = new THREE.SphereGeometry(1.8, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('emerald-planet'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet2 = new THREE.Mesh(p2Geo, p2Mat);
    planet2.position.set(-29, 0.5, -35);
    planet2.userData = {
      baseX: -29,
      baseY: 0.5,
      speedZ: 0.009,
      rotY: 0.0025,
      resetZ: -110,
      limitZ: 25
    };
    this.scene.add(planet2);
    this.planets.push(planet2);

    // --- 3. BOTTOM-LEFT: Warm Striped Gas Giant ---
    const p3Geo = new THREE.SphereGeometry(4.2, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('gas-giant'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet3 = new THREE.Mesh(p3Geo, p3Mat);
    planet3.position.set(-26, -9.5, -8);
    planet3.userData = {
      baseX: -26,
      baseY: -9.5,
      speedZ: 0.01,
      rotY: 0.0018,
      resetZ: -100,
      limitZ: 25
    };
    this.scene.add(planet3);
    this.planets.push(planet3);

    // --- 4. TOP-RIGHT: Soft Matte Pink Planet + Faint Dust Ring ---
    const p4Geo = new THREE.SphereGeometry(3.3, 32, 32);
    const p4Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('matte-pink'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet4 = new THREE.Mesh(p4Geo, p4Mat);
    planet4.position.set(27, 10.5, -10);

    const faintRingGeo = new THREE.RingGeometry(3.8, 4.6, 32);
    const faintRingMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.4
    });
    const faintRing = new THREE.Mesh(faintRingGeo, faintRingMat);
    faintRing.rotation.x = Math.PI / 2.8;
    planet4.add(faintRing);

    planet4.userData = {
      baseX: 27,
      baseY: 10.5,
      speedZ: 0.009,
      rotY: 0.002,
      resetZ: -95,
      limitZ: 25
    };
    this.scene.add(planet4);
    this.planets.push(planet4);

    // --- 5. MID-RIGHT: Ruby Dwarf Planet ---
    const p5Geo = new THREE.SphereGeometry(1.6, 32, 32);
    const p5Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('ruby-planet'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet5 = new THREE.Mesh(p5Geo, p5Mat);
    planet5.position.set(29, 0, -40);
    planet5.userData = {
      baseX: 29,
      baseY: 0,
      speedZ: 0.0085,
      rotY: 0.003,
      resetZ: -120,
      limitZ: 25
    };
    this.scene.add(planet5);
    this.planets.push(planet5);

    // --- 6. BOTTOM-RIGHT: Purple Saturn Planet with Ring ---
    const p6Geo = new THREE.SphereGeometry(3.0, 32, 32);
    const p6Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('purple-saturn'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet6 = new THREE.Mesh(p6Geo, p6Mat);
    planet6.position.set(26, -9.0, -9);

    const ringGeo = new THREE.RingGeometry(3.8, 6.0, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85
    });
    const ring6 = new THREE.Mesh(ringGeo, ringMat);
    ring6.rotation.x = Math.PI / 2.5;
    ring6.rotation.y = Math.PI / 6;
    planet6.add(ring6);

    planet6.userData = {
      baseX: 26,
      baseY: -9.0,
      speedZ: 0.01,
      rotY: 0.0018,
      resetZ: -85,
      limitZ: 25
    };
    this.scene.add(planet6);
    this.planets.push(planet6);

    // --- 7. PERIPHERAL ASTEROID FIELD (3 Gentle Drifting Asteroids) ---
    const asteroidGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.95,
      metalness: 0.0
    });

    const asteroidOffsets = [
      { x: -30, y: -4, z: -25 },
      { x: 30, y: -4, z: -30 },
      { x: -28, y: 16, z: -45 }
    ];

    asteroidOffsets.forEach((pos, idx) => {
      const ast = new THREE.Mesh(asteroidGeo, asteroidMat);
      ast.position.set(pos.x, pos.y, pos.z);
      ast.userData = {
        speedZ: 0.012,
        rotX: 0.003,
        rotY: 0.004,
        resetZ: -100,
        limitZ: 25
      };
      this.scene.add(ast);
      this.planets.push(ast);
    });
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // 1. Gentle Star Drift
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += this.starSpeed;

        if (pos[i3 + 2] > 25) {
          pos[i3 + 2] = -300;
          pos[i3] = (Math.random() - 0.5) * 160;
          pos[i3 + 1] = (Math.random() - 0.5) * 110;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Slow Majestic Planet Drift & Moon Orbit
    for (const body of this.planets) {
      const data = body.userData;
      if (data.rotY) body.rotation.y += data.rotY;
      if (data.rotX) body.rotation.x += data.rotX;

      if (data.moonOrbit) {
        data.moonOrbit.position.x = Math.cos(Date.now() * 0.0008) * 4.2;
        data.moonOrbit.position.z = Math.sin(Date.now() * 0.0008) * 4.2;
      }

      body.position.z += data.speedZ;
      if (body.position.z > data.limitZ) {
        body.position.z = data.resetZ;
      }
    }

    // 3. Gentle Distant Galaxy Rotation
    if (this.galaxyMesh) {
      this.galaxyMesh.rotation.z += 0.0002;
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
