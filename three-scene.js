// Import Three.js modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

// --- Global Variables ---
let scene, camera, renderer, controls, composer;
let raycaster, mouse;
let model;
let bloomPass, outlinePass;
let selectedPart = null;
let initialCameraPosition = new THREE.Vector3();
let initialControlsTarget = new THREE.Vector3();
let arLabels = {};
let tracker = document.getElementById('body-tracker');
let audioEnabled = true;
let logo;
let logoMixer;

// DOM elements
const canvasContainer = document.getElementById('canvas-container');
const infoContent = document.getElementById('info-content');
const loadingOverlay = document.getElementById('loading-overlay');
const progressBar = document.getElementById('progress-bar');
const loadingText = document.getElementById('loading-text');
const panelToggle = document.getElementById('panel-toggle');
const infoPanel = document.getElementById('info-panel');
const systemStatus = document.getElementById('system-status');

// Audio elements
const soundClick = document.getElementById('sound-click');
const soundHover = document.getElementById('sound-hover');
const soundScan = document.getElementById('sound-scan');

// Detailed information for each body part with improved zone coordinates
const bodyPartsData = {
  head: {
    name: "Cognitive Assessment",  // Renamed from "Head"
    system: "Neural Function",  // Renamed from "Nervous System"
    description: "Analysis of memory function and cognitive processing abilities.",
    zone: new THREE.Box3(
      new THREE.Vector3(-0.5, 2.6, -0.5),
      new THREE.Vector3(0.5, 3.5, 0.5)
    )
  },
  chest: {
    name: "Cardiovascular Test",  // Renamed from "Chest/Torso"
    system: "Circulatory Function",  // Renamed from "Respiratory & Cardiovascular Systems"
    description: "Evaluation of heart rate patterns and cardiovascular health indicators.",
    zone: new THREE.Box3(
      new THREE.Vector3(-0.8, 1.5, -0.5),
      new THREE.Vector3(0.8, 2.6, 0.5)
    )
  },
  abdomen: {
    name: "Body Composition",  // Renamed from "Abdomen"
    system: "Metabolic Status",  // Renamed from "Digestive & Urinary Systems"
    description: "Assessment of body mass index and tissue composition metrics.",
    zone: new THREE.Box3(
      new THREE.Vector3(-0.4, 1.0, -0.3),
      new THREE.Vector3(0.4, 1.8, 0.3)
    )
  },
  leftArm: {
    name: "Reaction Assessment",  // Renamed from "Left Arm"
    system: "Neural Responsiveness",  // Renamed from "Musculoskeletal System"
    description: "Measurement of neural pathway efficiency and response time.",
    zone: new THREE.Box3(
      new THREE.Vector3(-1.5, 1.2, -0.6),
      new THREE.Vector3(-0.5, 2.6, 0.6)
    )
  },
  rightArm: {
    name: "Reaction Assessment",  // Renamed from "Right Arm"
    system: "Neural Responsiveness",  // Renamed from "Musculoskeletal System"
    description: "Measurement of neural pathway efficiency and response time.",
    zone: new THREE.Box3(
      new THREE.Vector3(0.5, 1.2, -0.6),
      new THREE.Vector3(1.5, 2.6, 0.6)
    )
  },
  leftLeg: {
    name: "Stability Assessment",  // Renamed from "Left Leg"
    system: "Vestibular Function",  // Renamed from "Musculoskeletal System"
    description: "Evaluation of balance, proprioception, and vestibular system performance.",
    zone: new THREE.Box3(
      new THREE.Vector3(-0.6, -0.2, -0.5),
      new THREE.Vector3(-0.1, 1.0, 0.5)
    )
  },
  rightLeg: {
    name: "Stability Assessment",  // Renamed from "Right Leg"
    system: "Vestibular Function",  // Renamed from "Musculoskeletal System"
    description: "Evaluation of balance, proprioception, and vestibular system performance.",
    zone: new THREE.Box3(
      new THREE.Vector3(0.1, -0.2, -0.5),
      new THREE.Vector3(0.6, 1.0, 0.5)
    )
  }
};

// --- Initialization ---
function init() {
  initSceneAndCamera();
  setupRenderer();
  setupLighting();
  setupPostProcessing();
  setupControls();
  setupRaycaster();
  setupARElements();
  loadEnvironmentMap();
  loadModel();
  addLogo(); // Add the rotating logo
  setupEventListeners();
  animate();
}

// --- Setup Scene and Camera ---
function initSceneAndCamera() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.FogExp2(0x0f172a, 0.005);
  camera = new THREE.PerspectiveCamera(60, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.2, 5);
}

// --- Setup Renderer ---
function setupRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasContainer.appendChild(renderer.domElement);
}

// --- Setup Lighting ---
function setupLighting() {
  const ambientLight = new THREE.AmbientLight(0x303060, 0.5);
  scene.add(ambientLight);
  const mainLight = new THREE.DirectionalLight(0x6080ff, 1.0);
  mainLight.position.set(5, 10, 7.5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  scene.add(mainLight);
  const fillLight = new THREE.DirectionalLight(0x3040c0, 0.5);
  fillLight.position.set(-5, 0, -7.5);
  scene.add(fillLight);
  const pointLight1 = new THREE.PointLight(0x3060ff, 1, 10);
  pointLight1.position.set(3, 1, 3);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0x60ffff, 1, 10);
  pointLight2.position.set(-3, 1, -3);
  scene.add(pointLight2);
}

// --- Setup Post-Processing Effects ---
function setupPostProcessing() {
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.2, 0.9);
  composer.addPass(bloomPass);
  outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = 3.0;
  outlinePass.edgeGlow = 1.0;
  outlinePass.edgeThickness = 1.5;
  outlinePass.pulsePeriod = 2;
  outlinePass.visibleEdgeColor.set(0x3b82f6);
  outlinePass.hiddenEdgeColor.set(0x3b82f6);
  composer.addPass(outlinePass);
}

// --- Setup Controls ---
function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = true;
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.5;
  controls.update();
}

// --- Setup Raycaster ---
function setupRaycaster() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

// --- Setup AR Elements ---
function setupARElements() {
  arLabels = {
    head: document.getElementById('head-label'),
    torso: document.getElementById('torso-label'),
    arm: document.getElementById('arm-label'),
    leg: document.getElementById('leg-label'),
    abdomen: document.getElementById('abdomen-label')
  };
}

// --- Load Environment Map for Reflections ---
function loadEnvironmentMap() {
  new RGBELoader()
    .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/')
    .load('royal_esplanade_1k.hdr', function(texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });
}

// --- Add Rotating Logo ---
function addLogo() {
  // Create a simple geometric shape for the logo (we'll use a torus knot)
  const geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 8, 2, 3);
  
  // Create a shiny material with blue glow similar to the body model
  const material = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x2050c0,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1.5
  });
  
  // Create the mesh
  logo = new THREE.Mesh(geometry, material);
  
  // Position in top right corner of the screen - but in 3D space
  positionLogoInCorner();
  
  // Add to the scene
  scene.add(logo);
  
  // Add a point light near the logo for extra glow
  const logoLight = new THREE.PointLight(0x3b82f6, 2, 3);
  logoLight.position.copy(logo.position);
  logoLight.position.z -= 1; // Move light in front of logo
  scene.add(logoLight);
  
  console.log('Logo added at position:', logo.position);
}

// Function to position the logo in the top right corner 
function positionLogoInCorner() {
  if (!logo || !camera) return;
  
  // First place it in front of the camera
  const distance = 5;
  logo.position.set(0, 0, -distance);
  
  // Calculate the visible width and height at this distance
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * camera.aspect;
  
  // Position at top right with some margin
  logo.position.x = width / 2 - 1; // Right side with margin
  logo.position.y = height / 2 - 1; // Top with margin
  
  // Make logo face the camera
  logo.lookAt(camera.position);
}

// Function to animate the logo
function animateLogo() {
  if (logo) {
    // Rotate the logo continuously
    logo.rotation.x += 0.01;
    logo.rotation.y += 0.02;
    
    // Ensure logo stays in corner when camera/window changes
    positionLogoInCorner();
  }
}

// --- Load 3D Model ---
function loadModel() {
  const loader = new GLTFLoader();
  const modelUrl = './human_body.glb';
  progressBar.style.width = '5%';
  loadingText.textContent = 'Initializing biometric scanner...';
  
  // Simulate a more extensive scanning process
  let scanPhase = 0;
  const scanMessages = [
    'Calibrating sensors...',
    'Initializing body composition scan...',
    'Mapping skeletal structure...',
    'Analyzing muscle tissue density...',
    'Evaluating cardiovascular metrics...',
    'Measuring neural response patterns...',
    'Assessing cognitive parameters...',
    'Compiling biometric profile...',
    'Identifying assessment requirements...',
    'Finalizing diagnostic recommendations...'
  ];
  
  const scanInterval = setInterval(() => {
    scanPhase++;
    const progress = 5 + (scanPhase * 8);
    progressBar.style.width = `${Math.min(progress, 95)}%`;
    
    if (scanPhase < scanMessages.length) {
      loadingText.textContent = scanMessages[scanPhase];
    } else {
      clearInterval(scanInterval);
    }
  }, 800);
  
  loader.load(
    modelUrl,
    function (gltf) {
      clearInterval(scanInterval);
      progressBar.style.width = '100%';
      loadingText.textContent = 'Biometric scan complete. Preparing results...';
      
      model = gltf.scene;
      optimizeAndCenterModel(model);
      applyBioScanMaterial(model);
      scene.add(model);
      updateControlsForModel();
      
      // Delay completion slightly to enhance the "scanning" experience
      setTimeout(completeLoading, 1500);
    },
    function (xhr) {
      // Progress is handled by our custom scan animation above
    },
    function (error) {
      clearInterval(scanInterval);
      loadingOverlay.innerHTML = `
        <div class="text-center p-6">
          <h2 class="text-2xl font-bold text-red-500 mb-4">Scan Error Detected</h2>
          <p class="text-gray-300 mb-4">We encountered a problem while processing your biometric data.</p>
          <p class="text-sm text-gray-400 mb-6">${error.message || 'Diagnostic system failure'}</p>
          <button onclick="location.reload()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Restart Assessment
          </button>
        </div>
      `;
    }
  );
}

// --- Optimize and Center Model with improved zone handling ---
function optimizeAndCenterModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const desiredHeight = 3.0;
  const scale = desiredHeight / maxDim;
  
  model.scale.set(scale, scale, scale);
  box.setFromObject(model);
  box.getCenter(center);
  model.position.sub(center);
  model.position.y += box.max.y - center.y;
  
  // Store the model's final position and scale
  model.userData.finalScale = scale;
  model.userData.finalPosition = model.position.clone();
  
  console.log('Model scaled and centered. Scale:', scale, 'Position:', model.position);
  console.log('Model bounding box:', box.min, box.max);
  
  // No need to update zones - we've manually defined them to match the model
  // Just apply the model position offset to all zones
  Object.keys(bodyPartsData).forEach(part => {
    const zone = bodyPartsData[part].zone;
    zone.translate(model.position);
  });
}

// --- Add visual debug box for zones ---
function addDebugBox(partId, box) {
  const size = new THREE.Vector3();
  box.getSize(size);
  
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // Create different colors for different body parts
  let color = 0xff0000; // Default red
  if (partId.includes('Arm')) {
    color = 0x00ff00; // Green for arms
  } else if (partId.includes('Leg')) {
    color = 0x0000ff; // Blue for legs
  } else if (partId === 'head') {
    color = 0xffff00; // Yellow for head
  } else if (partId === 'abdomen') {
    color = 0xff00ff; // Magenta for abdomen
  }
  
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  
  const debugBox = new THREE.Mesh(geometry, material);
  debugBox.position.copy(center);
  debugBox.name = 'debug_' + partId;
  scene.add(debugBox);
  
  console.log(`Added debug box for ${partId} at position ${center.x}, ${center.y}, ${center.z}`);
}

// --- Apply Biotech Material Effect for a more medical/futuristic look ---
function applyBioScanMaterial(model) {
  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      const material = node.material.clone();
      material.metalness = 0.3;
      material.roughness = 0.2;
      material.envMapIntensity = 1.2;
      
      // Cool blue medical scan look
      if (material.color) {
        material.color.set(0x6090ff);
        material.emissive.set(0x2050c0);
        material.emissiveIntensity = 0.2;
      }
      
      // Add some transparency for a holographic effect
      material.transparent = true;
      material.opacity = 0.9;
      
      node.material = material;
    }
  });
}

// --- Update Controls For Model ---
function updateControlsForModel() {
  controls.target.set(model.position.x, model.position.y + 1.0, model.position.z);
  controls.update();
  initialCameraPosition.copy(camera.position);
  initialControlsTarget.copy(controls.target);
}

// --- Complete Loading Process ---
function completeLoading() {
  setTimeout(startScanAnimation, 1000);
  loadingOverlay.style.transition = 'opacity 1s';
  loadingOverlay.style.opacity = '0';
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
  }, 1000);
  updateSystemStatus('ANALYZING', 'green');
}

// --- Start Scan Animation ---
function startScanAnimation() {
  if (audioEnabled) {
    soundScan.volume = 0.3;
    soundScan.play().catch(e => {
      console.warn("Auto-play prevented:", e);
      audioEnabled = false;
    });
  }
  controls.autoRotate = true;
  setTimeout(() => { controls.autoRotate = false; }, 5000);
  setTimeout(() => showLabel('head'), 500);
  setTimeout(() => showLabel('torso'), 1000);
  setTimeout(() => showLabel('arm'), 1500);
  setTimeout(() => showLabel('leg'), 2000);
  setTimeout(() => showLabel('abdomen'), 1300);
  setTimeout(() => { updateSystemStatus('ASSESSMENT READY', 'green'); }, 3000);
}

// --- Show AR Label ---
function showLabel(label) {
  if (arLabels[label]) {
    arLabels[label].style.opacity = '1';
  }
}

// --- Update System Status ---
function updateSystemStatus(status, color) {
  systemStatus.textContent = status;
  systemStatus.className = '';
  if (color === 'green') {
    systemStatus.classList.add('text-green-400');
  } else if (color === 'yellow') {
    systemStatus.classList.add('text-yellow-400');
  } else if (color === 'red') {
    systemStatus.classList.add('text-red-400');
  }
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);
  canvasContainer.addEventListener('click', onClick);
  canvasContainer.addEventListener('dblclick', onDoubleClick);
  canvasContainer.addEventListener('mousemove', onMouseMove);
  if (panelToggle) {
    panelToggle.addEventListener('click', () => {
      infoPanel.classList.toggle('collapsed');
    });
  }
  
  // Add keyboard listener for zone visualization toggle
  document.addEventListener('keydown', function(event) {
    if (event.key === 'z' || event.key === 'Z') {
      let zonesVisible = scene.children.some(child => 
        child.name && child.name.startsWith('debug_')
      );
      
      if (zonesVisible) {
        // Hide zones
        scene.children.forEach(child => {
          if (child.name && child.name.startsWith('debug_')) {
            scene.remove(child);
          }
        });
        console.log('Zone visualization disabled');
      } else {
        // Show zones
        showAllZones();
      }
    }
  });
}

// --- Visualization of all zones for debugging ---
function showAllZones() {
  // First clear any existing debug boxes
  scene.children.forEach(child => {
    if (child.name && child.name.startsWith('debug_')) {
      scene.remove(child);
    }
  });
  
  // Create a debug box for each body part zone
  Object.keys(bodyPartsData).forEach(part => {
    const zone = bodyPartsData[part].zone;
    addDebugBox(part, zone);
  });
  
  console.log('Zone visualization enabled');
}

// --- Handle Window Resize ---
function onWindowResize() {
  if (!renderer || !camera || !canvasContainer) return;
  camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  composer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  updateARLabelsPositions();
  positionLogoInCorner(); // Update logo position on resize
}

// --- Handle Double Click (Reset View) ---
function onDoubleClick() {
  if (!controls || !initialCameraPosition || !initialControlsTarget) return;
  if (audioEnabled) {
    soundClick.volume = 0.2;
    soundClick.play().catch(e => console.warn("Audio play prevented:", e));
  }
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialControlsTarget);
  controls.update();
  updateSystemStatus('VIEW RESET', 'yellow');
  setTimeout(() => updateSystemStatus('ASSESSMENT READY', 'green'), 2000);
}

// --- Handle Mouse Move ---
function onMouseMove(event) {
  if (!model) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(model, true);
  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    const clickPoint = intersects[0].point;
    const hoveredPart = getBodyPartAtPoint(clickPoint);
    if (hoveredPart && hoveredPart !== selectedPart) {
      updateTrackerPosition(clickPoint);
      if (audioEnabled && Math.random() > 0.95) {
        soundHover.volume = 0.1;
        soundHover.play().catch(e => console.warn("Audio play prevented:", e));
      }
    }
  } else {
    document.body.style.cursor = 'default';
    hideTracker();
  }
}

// --- Update Tracker Position ---
function updateTrackerPosition(position) {
  if (!tracker) return;
  const vector = new THREE.Vector3(position.x, position.y, position.z);
  vector.project(camera);
  const x = (vector.x * 0.5 + 0.5) * canvasContainer.clientWidth;
  const y = (-(vector.y * 0.5) + 0.5) * canvasContainer.clientHeight;
  tracker.style.left = x + 'px';
  tracker.style.top = y + 'px';
  tracker.style.opacity = '1';
}

// --- Hide Tracker ---
function hideTracker() {
  if (tracker) {
    tracker.style.opacity = '0';
  }
}

// --- Improved Click Handler - Now loads tests ---
function onClick(event) {
  if (!model) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(model, true);
  
  if (intersects.length > 0) {
    const clickPoint = intersects[0].point;
    console.log('Click Point:', clickPoint);
    
    // Try to get body part using the improved function
    const partId = getBodyPartAtPoint(clickPoint);
    
    if (partId) {
      selectBodyPart(partId, clickPoint);
      
      // Load the appropriate test using the window.loadTest function exposed by React
      if (window.loadTest) {
        window.loadTest(partId);
      }
    } else {
      console.log('Clicked on model but no part identified');
    }
  } else {
    clearBodyPartSelection();
  }
}

// --- Get Body Part At Point with EXTREMELY aggressive arm and abdomen detection ---
function getBodyPartAtPoint(point) {
  // Debug: Log the point coordinates for troubleshooting
  console.log('Checking point:', point);
  
  const y = point.y;
  const x = point.x;
  
  // EXTREMELY AGGRESSIVE ARM DETECTION
  // This will override the chest detection when x is far enough from center
  if (y > 1.2 && y < 2.6) {  // FIXED: Raised lower bound from 0.5 to 1.2 to match arm zone
    // Far left = left arm (no matter what other detections say)
    if (x < -0.5) {
      console.log('Aggressive arm detection: leftArm');
      return 'leftArm';
    }
    
    // Far right = right arm (no matter what other detections say)
    if (x > 0.5) {
      console.log('Aggressive arm detection: rightArm');
      return 'rightArm';
    }
  }
  
  // Special case for abdomen to make it more central - with CORRECTED height
  if (Math.abs(x) < 0.4 && y > 1.0 && y < 1.8) {  // Fixed height
    console.log('Direct abdomen detection');
    return 'abdomen';
  }
  
  // Standard detection for all parts
  const tolerance = 0.3;
  for (const partId in bodyPartsData) {
    const zone = bodyPartsData[partId].zone.clone();
    zone.expandByScalar(tolerance);
    
    if (zone.containsPoint(point)) {
      console.log('Direct hit on zone:', partId);
      return partId;
    }
  }
  
  // Find closest part if no direct hit
  let closestPart = null;
  let minDistance = Infinity;
  
  for (const partId in bodyPartsData) {
    const zoneCenter = new THREE.Vector3();
    bodyPartsData[partId].zone.getCenter(zoneCenter);
    
    const distance = point.distanceTo(zoneCenter);
    console.log(`Distance to ${partId}: ${distance.toFixed(3)}`);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPart = partId;
    }
  }
  
  // Use closest part if it's within a reasonable distance
  if (minDistance < 1.5) {
    console.log(`Using closest part: ${closestPart}, distance: ${minDistance.toFixed(3)}`);
    return closestPart;
  }
  
  console.log('No body part found at point');
  return null;
}

// --- Select Body Part with improved highlighting ---
function selectBodyPart(partId, clickPoint) {
  if (audioEnabled) {
    soundClick.volume = 0.3;
    soundClick.currentTime = 0;
    soundClick.play().catch(e => console.warn("Audio play prevented:", e));
  }
  if (selectedPart === partId) return;
  selectedPart = partId;
  updateSystemStatus('INITIALIZING TEST', 'yellow');
  
  // Try to select meshes that are within the zone of the selected part
  const selectedObjects = [];
  
  // For arm parts, use special handling
  if (partId === 'leftArm' || partId === 'rightArm') {
    // Determine which side to check
    const isLeft = partId === 'leftArm';
    const xThreshold = isLeft ? 0 : 0; // Use 0 as the dividing line
    
    // Check all meshes 
    model.traverse((object) => {
      if (object.isMesh) {
        const meshPosition = new THREE.Vector3();
        object.getWorldPosition(meshPosition);
        
        // For arms, check if the mesh is on the correct side (left or right)
        // and in the appropriate height range
        if ((isLeft && meshPosition.x < xThreshold) || (!isLeft && meshPosition.x > xThreshold)) {
          if (meshPosition.y > 1.2 && meshPosition.y < 2.7) { // FIXED: Updated height range for arms
            selectedObjects.push(object);
          }
        }
      }
    });
  } 
  // Special case for abdomen to ensure correct selection - CORRECTED height
  else if (partId === 'abdomen') {
    model.traverse((object) => {
      if (object.isMesh) {
        const meshPosition = new THREE.Vector3();
        object.getWorldPosition(meshPosition);
        
        // For abdomen, check if the mesh is in the central area
        if (Math.abs(meshPosition.x) < 0.5 && meshPosition.y > 1.0 && meshPosition.y < 1.8) {  // Fixed height
          selectedObjects.push(object);
        }
      }
    });
  }
  // Special case for legs with updated height range
  else if (partId === 'leftLeg' || partId === 'rightLeg') {
    // Determine which side to check
    const isLeft = partId === 'leftLeg';
    const xThreshold = isLeft ? 0 : 0; // Use 0 as the dividing line
    
    model.traverse((object) => {
      if (object.isMesh) {
        const meshPosition = new THREE.Vector3();
        object.getWorldPosition(meshPosition);
        
        // For legs, check if the mesh is on the correct side (left or right)
        // and in the appropriate height range
        if ((isLeft && meshPosition.x < xThreshold) || (!isLeft && meshPosition.x > xThreshold)) {
          if (meshPosition.y > -0.2 && meshPosition.y < 1.0) { // Updated height range for legs
            selectedObjects.push(object);
          }
        }
      }
    });
  }
  else {
    // For non-arm/non-leg parts, use the standard zone-based approach
    model.traverse((object) => {
      if (object.isMesh) {
        const meshPosition = new THREE.Vector3();
        object.getWorldPosition(meshPosition);
        
        // Use extended zone for selection to be more inclusive
        const extendedZone = bodyPartsData[partId].zone.clone().expandByScalar(0.3);
        if (extendedZone.containsPoint(meshPosition)) {
          selectedObjects.push(object);
        }
      }
    });
  }
