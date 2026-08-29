/**
 * SpaceScene.js // Three.js 3D Space Background for Rhythm Keys
 * Renders high-visibility cosmic nebula, forward-flying starfield, and 4 stylized 3D planets in screen margins.
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
    this.starCount = 3500;
    this.starSpeed = 1.8;
    this.planets = [];
    this.comets = [];
    this.nebulaClouds = [];
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
    this.renderer.setClearColor(0x040816, 1.0);

    // 3. Lights
    const ambientLight = new THREE.AmbientLight(0x403060, 2.5);
    this.scene.add(ambientLight);

    const cyanLight = new THREE.DirectionalLight(0x00e5ff, 3.5);
    cyanLight.position.set(-40, 30, 40);
    this.scene.add(cyanLight);

    const pinkLight = new THREE.DirectionalLight(0xff66cc, 3.0);
    pinkLight.position.set(40, -30, 40);
    this.scene.add(pinkLight);

    const centerPointLight = new THREE.PointLight(0xffffff, 2.0, 150);
    centerPointLight.position.set(0, 0, 30);
    this.scene.add(centerPointLight);

    // 4. Build Environment
    this.createCosmicNebula();
    this.createStarfield();
    this.createPlanets();
    this.createComets();

    // 5. Resize Listener
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 6. Start Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  /**
   * Creates cosmic nebula clouds in the deep background
   */
  createCosmicNebula() {
    const nebulaGeo = new THREE.PlaneGeometry(120, 90);
    const colors = [0x240046, 0x03045e, 0x5a189a, 0x0077b6];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grad.addColorStop(0, i % 2 === 0 ? 'rgba(114, 9, 183, 0.45)' : 'rgba(0, 180, 216, 0.4)');
      grad.addColorStop(0.5, i % 2 === 0 ? 'rgba(72, 12, 168, 0.25)' : 'rgba(3, 4, 94, 0.2)');
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
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60,
        -150 - (i * 20)
      );
      mesh.rotation.z = Math.random() * Math.PI;
      this.scene.add(mesh);
      this.nebulaClouds.push(mesh);
    }
  }

  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x70d6ff),
      new THREE.Color(0xff9ebb),
      new THREE.Color(0xffd670),
      new THREE.Color(0xd0bfff)
    ];

    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 220;
      positions[i3 + 1] = (Math.random() - 0.5) * 160;
      positions[i3 + 2] = -Math.random() * 600;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.starPositions = positions;
    this.scene.add(this.stars);
  }

  createProceduralPlanetTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'gas-giant') {
      // Warm yellow/orange/pink bands matching bottom-left planet
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#ff9ebb');
      grad.addColorStop(0.2, '#ffd670');
      grad.addColorStop(0.45, '#ff7b00');
      grad.addColorStop(0.7, '#ffd670');
      grad.addColorStop(0.9, '#ff70a6');
      grad.addColorStop(1.0, '#e85d04');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Subtle atmospheric swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let y = 30; y < 512; y += 45) {
        ctx.fillRect(0, y, 512, 14);
      }
    } else if (type === 'grid-sphere') {
      // Soft pink with geometric holographic grid matching top-right planet
      ctx.fillStyle = '#ff70a6';
      ctx.fillRect(0, 0, 512, 512);

      // Radial sheen
      const radGrad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
      radGrad.addColorStop(0, '#ffd1df');
      radGrad.addColorStop(0.8, '#ff5c8d');
      radGrad.addColorStop(1, '#c9184a');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Clean grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 6;
      for (let x = 0; x <= 512; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    } else if (type === 'blue-moon') {
      // Gradient blue/purple exoplanet matching top-left
      const grad = ctx.createRadialGradient(180, 180, 20, 256, 256, 256);
      grad.addColorStop(0.0, '#70d6ff');
      grad.addColorStop(0.4, '#4361ee');
      grad.addColorStop(0.8, '#7209b7');
      grad.addColorStop(1.0, '#10002b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(140, 140, 45, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'purple-saturn') {
      // Purple / Indigo gradient for bottom-right planet
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#d0bfff');
      grad.addColorStop(0.3, '#9d4edd');
      grad.addColorStop(0.7, '#5a189a');
      grad.addColorStop(1.0, '#240046');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    return new THREE.CanvasTexture(canvas);
  }

  createPlanets() {
    // 1. TOP-LEFT: Blue/Purple Planet with Small Orbiting Moon
    const p1Geo = new THREE.SphereGeometry(3.0, 32, 32);
    const p1Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralPlanetTexture('blue-moon'),
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x101a40,
      emissiveIntensity: 0.4
    });
    const planet1 = new THREE.Mesh(p1Geo, p1Mat);
    planet1.position.set(-27, 10.5, -12);

    // Orbiting tiny white moon
    const moonGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(4.5, 0.8, 0);
    planet1.add(moon);

    planet1.userData = {
      baseX: -27,
      baseY: 10.5,
      speedZ: 0.04,
      rotX: 0.003,
      rotY: 0.008,
      moonOrbit: moon,
      resetZ: -120,
      limitZ: 30
    };
    this.scene.add(planet1);
    this.planets.push(planet1);

    // 2. BOTTOM-LEFT: Yellow/Orange Striped Gas Giant
    const p2Geo = new THREE.SphereGeometry(4.6, 32, 32);
    const p2Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralPlanetTexture('gas-giant'),
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x331a00,
      emissiveIntensity: 0.35
    });
    const planet2 = new THREE.Mesh(p2Geo, p2Mat);
    planet2.position.set(-26, -9.5, -8);
    planet2.userData = {
      baseX: -26,
      baseY: -9.5,
      speedZ: 0.05,
      rotX: 0.002,
      rotY: 0.006,
      resetZ: -140,
      limitZ: 30
    };
    this.scene.add(planet2);
    this.planets.push(planet2);

    // 3. TOP-RIGHT: Pink Holographic Grid Planet
    const p3Geo = new THREE.SphereGeometry(3.6, 32, 32);
    const p3Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralPlanetTexture('grid-sphere'),
      roughness: 0.25,
      metalness: 0.3,
      emissive: 0x550022,
      emissiveIntensity: 0.5
    });
    const planet3 = new THREE.Mesh(p3Geo, p3Mat);
    planet3.position.set(27, 10.5, -10);
    planet3.userData = {
      baseX: 27,
      baseY: 10.5,
      speedZ: 0.045,
      rotX: 0.004,
      rotY: 0.007,
      resetZ: -130,
      limitZ: 30
    };
    this.scene.add(planet3);
    this.planets.push(planet3);

    // 4. BOTTOM-RIGHT: Purple Saturn Planet with Glowing Ring
    const p4Geo = new THREE.SphereGeometry(3.2, 32, 32);
    const p4Mat = new THREE.MeshStandardMaterial({
      map: this.createProceduralPlanetTexture('purple-saturn'),
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x220044,
      emissiveIntensity: 0.4
    });
    const planet4 = new THREE.Mesh(p4Geo, p4Mat);
    planet4.position.set(26, -9.0, -9);

    // Planet Ring
    const ringGeo = new THREE.RingGeometry(4.2, 6.8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc499f3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    ring.rotation.y = Math.PI / 6;
    planet4.add(ring);

    planet4.userData = {
      baseX: 26,
      baseY: -9.0,
      speedZ: 0.05,
      rotX: 0.003,
      rotY: 0.005,
      resetZ: -110,
      limitZ: 30
    };
    this.scene.add(planet4);
    this.planets.push(planet4);
  }

  createComets() {
    for (let i = 0; i < 2; i++) {
      const geometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-18, 8, -25)
      ];
      geometry.setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: 0x70d6ff,
        transparent: true,
        opacity: 0.85,
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
      (Math.random() - 0.5) * 80 + 10,
      Math.random() * 30 + 10,
      -Math.random() * 200 - 50
    );
    comet.userData = {
      vx: -(Math.random() * 1.5 + 1.0),
      vy: -(Math.random() * 0.7 + 0.5),
      vz: Math.random() * 3.0 + 1.5
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

    // 1. Starfield Forward Motion
    if (this.stars && this.starPositions) {
      const pos = this.starPositions;
      for (let i = 0; i < this.starCount; i++) {
        const i3 = i * 3;
        pos[i3 + 2] += this.starSpeed;

        if (pos[i3 + 2] > 30) {
          pos[i3 + 2] = -600;
          pos[i3] = (Math.random() - 0.5) * 220;
          pos[i3 + 1] = (Math.random() - 0.5) * 160;
        }
      }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Planets Margins Animation & Moon Orbit
    for (const planet of this.planets) {
      const data = planet.userData;
      planet.rotation.y += data.rotY;
      planet.rotation.x += data.rotX;

      if (data.moonOrbit) {
        data.moonOrbit.position.x = Math.cos(Date.now() * 0.0025) * 4.5;
        data.moonOrbit.position.z = Math.sin(Date.now() * 0.0025) * 4.5;
      }

      planet.position.z += data.speedZ;
      if (planet.position.z > data.limitZ) {
        planet.position.z = data.resetZ;
      }
    }

    // 3. Comets Shooting Across Sky
    for (const comet of this.comets) {
      const u = comet.userData;
      comet.position.x += u.vx;
      comet.position.y += u.vy;
      comet.position.z += u.vz;

      if (comet.position.z > 30 || comet.position.y < -40) {
        this.resetComet(comet);
      }
    }

    // 4. Subtle Nebula Rotation
    for (let i = 0; i < this.nebulaClouds.length; i++) {
      this.nebulaClouds[i].rotation.z += (i % 2 === 0 ? 0.0004 : -0.0004);
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
