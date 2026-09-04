import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

const POINT_COUNT = 5000;
const BASE_RADIUS = 26.9;
const POINT_SIZE = 0.69;
const CAMERA_Z = 100;
const COLOR = '#bfe9ff';
const RIPPLE_AMOUNT = 0.1;
const NOISE_SCALE = 1.8;
const NOISE_SPEED = 0.2;

function sphereDirections(count) {
  const dirs = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const p = i * 3;
    const y = 1 - (2 * i) / (count - 1);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * i;

    dirs[p] = Math.cos(angle) * ring;
    dirs[p + 1] = y;
    dirs[p + 2] = Math.sin(angle) * ring;
  }

  return dirs;
}

function glowSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext('2d');
  const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  fade.addColorStop(0, 'rgba(255,255,255,1)');
  fade.addColorStop(0.25, 'rgba(255,255,255,0.71)');
  fade.addColorStop(0.4, 'rgba(255,255,255,0.42)');
  fade.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  fade.addColorStop(0.75, 'rgba(255,255,255,0.02)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

export function start(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
  camera.position.z = CAMERA_Z;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const noise = createNoise3D();
  const arrows = sphereDirections(POINT_COUNT);
  const positions = new Float32Array(POINT_COUNT * 3);
  const colors = new Float32Array(POINT_COUNT * 3);
  const offsets = new Float32Array(POINT_COUNT);

  for (let i = 0; i < POINT_COUNT; i++) {
    const p = i * 3;
    positions[p] = arrows[p] * BASE_RADIUS;
    positions[p + 1] = arrows[p + 1] * BASE_RADIUS;
    positions[p + 2] = arrows[p + 2] * BASE_RADIUS;
    offsets[i] = Math.random() * 10;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: new THREE.Color(COLOR),
    map: glowSprite(),
    size: POINT_SIZE,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(points);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  window.addEventListener('resize', resize);
  resize();

  const t0 = performance.now();

  function frame(now) {
    const t = (now - t0) / 1000;

    for (let i = 0; i < POINT_COUNT; i++) {
      const p = i * 3;
      const x = arrows[p];
      const y = arrows[p + 1];
      const z = arrows[p + 2];

      const o = offsets[i] + t * NOISE_SPEED;
      const n = noise(x * NOISE_SCALE + o, y * NOISE_SCALE + o, z * NOISE_SCALE + o);

      const r = BASE_RADIUS * (1 + n * RIPPLE_AMOUNT);
      positions[p] = x * r;
      positions[p + 1] = y * r;
      positions[p + 2] = z * r;

      const glow = 0.6 + 0.4 * n;
      colors[p] = colors[p + 1] = colors[p + 2] = glow;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    points.rotation.y += 0.0009;
    points.rotation.x = Math.sin(t * 0.13) * 0.08;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
