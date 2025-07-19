let scene, camera, renderer, model;

function initSTLViewer(stlUrl) {
  const container = document.getElementById('stl-viewer');
  if (!container) return;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // White background
  camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
  camera.position.set(0, 0, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0xffffff, 1);
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 0, 100).normalize();
  scene.add(light);

  const loader = new THREE.STLLoader();
  loader.load(stlUrl, function (geometry) {
    const material = new THREE.MeshPhongMaterial({ color: 0x222222, specular: 0x111111, shininess: 200 });
    model = new THREE.Mesh(geometry, material);
    // Center the model
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    // Auto-scale to fit view
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 60 / maxDim;
      model.scale.set(scale, scale, scale);
    }
    scene.add(model);
    animate();
  },
  // onProgress
  undefined,
  // onError
  function (err) {
    console.error('Failed to load STL:', err);
    container.innerHTML = '<div style="color:#900;font-size:1.1rem;padding:2rem;">Failed to load 3D model.</div>';
  });
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

window.setModelRotation = function(azimuth, elevation, roll) {
  if (model) {
    // Convert degrees to radians
    model.rotation.y = THREE.MathUtils.degToRad(azimuth);
    model.rotation.x = THREE.MathUtils.degToRad(elevation);
    model.rotation.z = THREE.MathUtils.degToRad(roll);
  }
};

// Initialize the viewer on DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
  initSTLViewer('17_7_2025.stl');
}); 