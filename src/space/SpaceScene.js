/**
 * SpaceScene.js // Three.js Matte 3D Space Background for Rhythm Keys
 * Clean, non-distracting matte finish with gentle drifting stars and stylized planets.
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
    this.starCount = 450; // Drastically reduced for clean, non-cluttered space
    this.starSpeed = 0.6; // Gentle, smooth drift
    this.planets = [];
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

    // 2. WebGL Renderer with clean matte background
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x060c1c, 1.0); // Matte deep space navy

    // 3. Soft Ambient & Diffuse Lighting (Matte non-glossy appearance)
    const ambientLight = new THREE.AmbientLight(0x5a6a8a, 2.2);
    this.scene.add(ambientLight);

    const softLightLeft = new THREE.DirectionalLight(0x70d6ff, 1.8);
    softLightLeft.position.set(-35, 25, 30);
    this.scene.add(softLightLeft);

    const softLightRight = new THREE.DirectionalLight(0xff9ebb, 1.5);
    softLightRight.position.set(35, -25, 30);
    this.scene.add(softLightRight);

    // 4. Build Objects
    this.createSoftNebula();
    this.createCleanStarfield();
    this.createMattePlanets();

    // 5. Window Resize Handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 6. Animation Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  createSoftNebula() {
    const nebulaGeo = new THREE.PlaneGeometry(100, 75);

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, i === 0 ? 'rgba(88, 28, 135, 0.22)' : 'rgba(30, 58, 138, 0.2)');
      grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.1)');
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
        (i - 1) * 35,
        (i % 2 === 0 ? 10 : -10),
        -80 - (i * 20)
      );
      this.scene.add(mesh);
    }
  }

  createCleanStarfield() {
    // Generate soft circular star sprite to avoid harsh square particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const radGrad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    radGrad.addColorStop(0.4, 'rgba(200, 225, 255, 0.6)');
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
      new THREE.Color(0xf0f4f8), // Soft white
      new THREE.Color(0xbae6fd), // Pastel sky blue
      new THREE.Color(0xfbcfe8), // Pastel pink
      new THREE.Color(0xfef08a), // Pastel yellow
      new THREE.Color(0xe9d5ff)  // Lavender
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
      size: 1.6,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
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
      // Smooth matte banded gradient
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
        ctx.fillRect(0, y, 512, 18);
      }
    } else if (type === 'matte-pink') {
      // Smooth clean matte blush pink without harsh grid
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#ff9ebb');
      grad.addColorStop(0.5, '#f472b6');
      grad.addColorStop(1.0, '#db2777');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(200, 180, 70, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'oceanic-blue') {
      // Smooth matte ocean planet
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#70d6ff');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1.0, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    } else if (type === 'purple-saturn') {
      // Smooth matte violet
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#c084fc');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(1.0, '#581c87');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    return new THREE.CanvasTexture(canvas);
  }

  createMattePlanets() {
    // 1. TOP-LEFT: Oceanic Blue/Violet Planet with Moon (Matte finish)
    const p1Geo = new THREE.SphereGeometry(2.8, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('oceanic-blue'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet1 = new THREE.Mesh(p1Geo, p1Mat);
    planet1.position.set(-27, 10.5, -12);

    const moonGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      metalness: 0.0
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(4.2, 0.6, 0);
    planet1.add(moon);

    planet1.userData = {
      baseX: -27,
      baseY: 10.5,
      speedZ: 0.025,
      rotY: 0.004,
      moonOrbit: moon,
      resetZ: -100,
      limitZ: 25
    };
    this.scene.add(planet1);
    this.planets.push(planet1);

    // 2. BOTTOM-LEFT: Matte Warm Gas Giant
    const p2Geo = new THREE.SphereGeometry(4.2, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('gas-giant'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet2 = new THREE.Mesh(p2Geo, p2Mat);
    planet2.position.set(-26, -9.5, -8);
    planet2.userData = {
      baseX: -26,
      baseY: -9.5,
      speedZ: 0.03,
      rotY: 0.003,
      resetZ: -120,
      limitZ: 25
    };
    this.scene.add(planet2);
    this.planets.push(planet2);

    // 3. TOP-RIGHT: Matte Soft Pink Planet
    const p3Geo = new THREE.SphereGeometry(3.3, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('matte-pink'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet3 = new THREE.Mesh(p3Geo, p3Mat);
    planet3.position.set(27, 10.5, -10);
    planet3.userData = {
      baseX: 27,
      baseY: 10.5,
      speedZ: 0.028,
      rotY: 0.004,
      resetZ: -110,
      limitZ: 25
    };
    this.scene.add(planet3);
    this.planets.push(planet3);

    // 4. BOTTOM-RIGHT: Matte Purple Saturn Planet with Ring
    const p4Geo = new THREE.SphereGeometry(3.0, 32, 32);
    const p4Mat = new THREE.MeshStandardMaterial({
      map: this.createMatteTexture('purple-saturn'),
      roughness: 0.9,
      metalness: 0.0
    });
    const planet4 = new THREE.Mesh(p4Geo, p4Mat);
    planet4.position.set(26, -9.0, -9);

    const ringGeo = new THREE.RingGeometry(3.8, 6.0, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    ring.rotation.y = Math.PI / 6;
    planet4.add(ring);

    planet4.userData = {
      baseX: 26,
      baseY: -9.0,
      speedZ: 0.03,
      rotY: 0.003,
      resetZ: -100,
      limitZ: 25
    };
    this.scene.add(planet4);
    this.planets.push(planet4);
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

    // 1. Subtle, gentle star drift
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

    // 2. Slow planet rotation and drift
    for (const planet of this.planets) {
      const data = planet.userData;
      planet.rotation.y += data.rotY;

      if (data.moonOrbit) {
        data.moonOrbit.position.x = Math.cos(Date.now() * 0.0015) * 4.2;
        data.moonOrbit.position.z = Math.sin(Date.now() * 0.0015) * 4.2;
      }

      planet.position.z += data.speedZ;
      if (planet.position.z > data.limitZ) {
        planet.position.z = data.resetZ;
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
