/**
 * SpaceScene.js // Three.js 3D Space & Planet Environment for Rhythm Keys
 * Renders high-velocity starfield particles, comets, and stylized pastel sci-fi planets on screen margins.
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
    this.starCount = 4500;
    this.starSpeed = 2.4;
    this.planets = [];
    this.comets = [];
    this.animationFrameId = null;

    this.init();
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.z = 40;

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x2a1a4a, 1.8);
    this.scene.add(ambientLight);

    const cyanLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    cyanLight.position.set(-60, 40, 50);
    this.scene.add(cyanLight);

    const pinkLight = new THREE.DirectionalLight(0xff66cc, 2.2);
    pinkLight.position.set(60, -40, 50);
    this.scene.add(pinkLight);

    const frontLight = new THREE.PointLight(0xffffff, 0.8, 200);
    frontLight.position.set(0, 0, 30);
    this.scene.add(frontLight);

    // 4. Create Scene Objects
    this.createStarfield();
    this.createPlanets();
    this.createComets();

    // 5. Window Resize Handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 6. Start Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    const palette = [
      new THREE.Color(0xffffff), // Crisp white
      new THREE.Color(0x70d6ff), // Cyan
      new THREE.Color(0xff9ebb), // Pastel pink
      new THREE.Color(0xffd670), // Pastel yellow
      new THREE.Color(0xd0bfff)  // Lavender
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      // Spread stars wide across X and Y, deep into Z
      positions[i3] = (Math.random() - 0.5) * 380;
      positions[i3 + 1] = (Math.random() - 0.5) * 260;
      positions[i3 + 2] = -Math.random() * 1200;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.scene.add(this.stars);
  }

  /**
   * Generates procedural canvas texture for planets
   */
  createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'gas-giant') {
      // Yellow/Orange/Pink stripes
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#ff9ebb');
      grad.addColorStop(0.2, '#ffd670');
      grad.addColorStop(0.4, '#ff9966');
      grad.addColorStop(0.6, '#ffd670');
      grad.addColorStop(0.8, '#ff70a6');
      grad.addColorStop(1.0, '#fca311');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Horizontal bands
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 512; i += 32) {
        ctx.fillRect(0, i, 512, 12);
      }
    } else if (type === 'grid-sphere') {
      // Soft pink with geometric holographic grid
      ctx.fillStyle = '#ff70a6';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 4;
      for (let x = 0; x <= 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    } else if (type === 'oceanic-blue') {
      // Blue/cyan pastel gradient with crater swirls
      const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
      grad.addColorStop(0.0, '#70d6ff');
      grad.addColorStop(0.5, '#4361ee');
      grad.addColorStop(0.9, '#3a0ca3');
      grad.addColorStop(1.0, '#10002b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(160, 160, 45, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'purple-ring') {
      // Deep violet & lavender planet
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#b5179e');
      grad.addColorStop(0.4, '#7209b7');
      grad.addColorStop(0.7, '#480ca8');
      grad.addColorStop(1.0, '#3f37c9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createPlanets() {
    // 1. Top-Left Planet (Blue/Violet with Tiny Orbiting Moon)
    const p1Geo = new THREE.SphereGeometry(3.5, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralTexture('oceanic-blue'),
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(0x101a40),
      emissiveIntensity: 0.3
    });
    const planet1 = new THREE.Mesh(p1Geo, p1Mat);
    planet1.position.set(-33, 14, -220);

    // Orbiting tiny moon
    const moonGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x70d6ff,
      emissiveIntensity: 0.6
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(5.5, 1.2, 0);
    planet1.add(moon);
    planet1.userData = {
      baseX: -33,
      baseY: 14,
      speedZ: 0.32,
      rotX: 0.003,
      rotY: 0.008,
      moonOrbit: moon,
      resetZ: -600,
      limitZ: 50
    };
    this.scene.add(planet1);
    this.planets.push(planet1);

    // 2. Bottom-Left Planet (Yellow/Orange Striped Gas Giant)
    const p2Geo = new THREE.SphereGeometry(5.2, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralTexture('gas-giant'),
      roughness: 0.5,
      metalness: 0.1,
      emissive: new THREE.Color(0x331a00),
      emissiveIntensity: 0.2
    });
    const planet2 = new THREE.Mesh(p2Geo, p2Mat);
    planet2.position.set(-34, -13, -380);
    planet2.userData = {
      baseX: -34,
      baseY: -13,
      speedZ: 0.38,
      rotX: 0.002,
      rotY: 0.006,
      resetZ: -700,
      limitZ: 50
    };
    this.scene.add(planet2);
    this.planets.push(planet2);

    // 3. Top-Right Planet (Pink/Coral Glowing Grid Planet)
    const p3Geo = new THREE.SphereGeometry(4.2, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralTexture('grid-sphere'),
      roughness: 0.3,
      metalness: 0.3,
      emissive: new THREE.Color(0x400020),
      emissiveIntensity: 0.4
    });
    const planet3 = new THREE.Mesh(p3Geo, p3Mat);
    planet3.position.set(34, 13, -280);
    planet3.userData = {
      baseX: 34,
      baseY: 13,
      speedZ: 0.35,
      rotX: 0.005,
      rotY: 0.007,
      resetZ: -650,
      limitZ: 50
    };
    this.scene.add(planet3);
    this.planets.push(planet3);

    // 4. Bottom-Right Planet (Purple/Indigo Planet with Saturn Rings)
    const p4Geo = new THREE.SphereGeometry(3.6, 32, 32);
    const p4Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralTexture('purple-ring'),
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(0x200040),
      emissiveIntensity: 0.3
    });
    const planet4 = new THREE.Mesh(p4Geo, p4Mat);
    planet4.position.set(33, -12, -180);

    // Tilted Planet Ring
    const ringGeo = new THREE.RingGeometry(4.6, 7.2, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd0bfff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      emissive: 0x7209b7,
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.6;
    ring.rotation.y = Math.PI / 6;
    planet4.add(ring);

    planet4.userData = {
      baseX: 33,
      baseY: -12,
      speedZ: 0.4,
      rotX: 0.004,
      rotY: 0.005,
      resetZ: -550,
      limitZ: 50
    };
    this.scene.add(planet4);
    this.planets.push(planet4);
  }

  createComets() {
    // 2 diagonal shooting star trails
    for (let i = 0; i < 2; i++) {
      const geometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-14, 7, -25)
      ];
      geometry.setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });

      const comet = new THREE.Line(geometry, material);
      this.resetComet(comet);
      this.scene.add(comet);
      this.comets.push(comet);
    }
  }

  resetComet(comet) {
    comet.position.set(
      (Math.random() - 0.5) * 120 + 20,
      Math.random() * 40 + 10,
      -Math.random() * 400 - 150
    );
    comet.userData = {
      vx: -(Math.random() * 1.8 + 1.2),
      vy: -(Math.random() * 0.9 + 0.6),
      vz: Math.random() * 3.5 + 2.0
    };
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

    // 1. Starfield Continuous Forward Travel
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += this.starSpeed;

        // Wrap around when star passes camera
        if (pos[i3 + 2] > 40) {
          pos[i3 + 2] = -1200;
          pos[i3] = (Math.random() - 0.5) * 380;
          pos[i3 + 1] = (Math.random() - 0.5) * 260;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Planets Continuous Forward Margins Drift & Rotation
    for (const planet of this.planets) {
      const data = planet.userData;
      planet.rotation.y += data.rotY;
      planet.rotation.x += data.rotX;

      if (data.moonOrbit) {
        data.moonOrbit.position.x = Math.cos(Date.now() * 0.002) * 5.5;
        data.moonOrbit.position.z = Math.sin(Date.now() * 0.002) * 5.5;
      }

      planet.position.z += data.speedZ;

      // Recycle planet to distant Z when it passes camera
      if (planet.position.z > data.limitZ) {
        planet.position.z = data.resetZ;
      }
    }

    // 3. Comets / Shooting Stars
    for (const comet of this.comets) {
      const u = comet.userData;
      comet.position.x += u.vx;
      comet.position.y += u.vy;
      comet.position.z += u.vz;

      if (comet.position.z > 40 || comet.position.y < -50) {
        this.resetComet(comet);
      }
    }

    // Render Scene
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
