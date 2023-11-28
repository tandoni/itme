import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const sphereGeometry = new THREE.SphereGeometry(75, 64, 45);

const pointsMaterial = new THREE.PointsMaterial({ color: 0x00ff00, size: 1 });

const originalVertices = sphereGeometry.attributes.position;

const numRandomVertices = Math.floor(0.4 * sphereGeometry.attributes.position.count);

const randomVertices = Array.from({ length: numRandomVertices }, () => Math.floor(Math.random() * sphereGeometry.attributes.position.count));

const points = new THREE.Points(sphereGeometry, pointsMaterial);
scene.add(points);

camera.position.z = 300;

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    const pulseStrength = Math.sin(time) * 0.003;

    const positions = points.geometry.attributes.position;
    randomVertices.forEach((index) => {
        const originalVertex = new THREE.Vector3().fromBufferAttribute(originalVertices, index);
        positions.setXYZ(index, originalVertex.x * (1 + pulseStrength), originalVertex.y * (1 + pulseStrength), originalVertex.z * (1 + pulseStrength));
    });

    positions.needsUpdate = true;

    // points.rotation.x += 0.005;
    points.rotation.y += 0.001;

    renderer.render(scene, camera);
}

animate();
