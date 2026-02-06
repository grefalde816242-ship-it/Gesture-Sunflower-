// ===== SCENE =====
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 4, 12);

const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.z = 7;

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ===== LIGHTING =====
scene.add(new THREE.AmbientLight(0xffcc66, 0.5));

const sunLight = new THREE.PointLight(0xffaa33, 1.5, 20);
sunLight.position.set(6, 6, 6);
scene.add(sunLight);

// ===== SUNFLOWER GROUP =====
const sunflower = new THREE.Group();
scene.add(sunflower);

// ===== GOLDEN RATIO SUNFLOWER =====
const PETALS = 1200;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const petals = [];

for (let i = 0; i < PETALS; i++) {
  const r = Math.sqrt(i / PETALS);
  const theta = i * GOLDEN_ANGLE;

  const geo = new THREE.SphereGeometry(0.03, 10, 10);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(`hsl(${42 + r * 25}, 95%, 55%)`),
    roughness: 0.25,
    metalness: 0.1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3
  });

  const petal = new THREE.Mesh(geo, mat);
  petal.userData = { r, theta };
  sunflower.add(petal);
  petals.push(petal);
}

// ===== HAND TRACKING =====
const video = document.getElementById("video");

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.75,
  minTrackingConfidence: 0.75
});

let targetRotate = 0;
let targetBloom = 1;
let targetTilt = 0;

hands.onResults(results => {
  if (results.multiHandLandmarks) {
    const finger = results.multiHandLandmarks[0][8];

    targetRotate = finger.x * Math.PI * 2;
    targetBloom = 0.3 + (1 - finger.y) * 1.5;
    targetTilt = (finger.y - 0.5) * Math.PI;
  }
});

// ===== CAMERA INPUT =====
const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});
cam.start();

// ===== ANIMATION LOOP =====
function animate(time) {
  requestAnimationFrame(animate);

  // Smooth motion
  sunflower.rotation.y += (targetRotate - sunflower.rotation.y) * 0.04;
  sunflower.rotation.x += (targetTilt - sunflower.rotation.x) * 0.04;

  // Sunlight breathing
  sunLight.intensity = 1.2 + Math.sin(time * 0.001) * 0.3;

  // Bloom shutter effect
  petals.forEach(p => {
    const r = p.userData.r * targetBloom * 3;
    const t = p.userData.theta;

    p.position.set(
      r * Math.cos(t),
      r * Math.sin(t),
      r * 0.45
    );
  });

  renderer.render(scene, camera);
}
animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
