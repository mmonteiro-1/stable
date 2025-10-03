const container = document.getElementById('three-container');

// --- Helper Toggle Flags ---
const SHOW_CAMERA_HELPERS = false;  // Set to false to hide camera helpers
const SHOW_LIGHT_HELPERS = false;   // Set to false to hide light helpers

// Scene + renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2f2);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft shadows for smoother edges
renderer.autoClear = true;
container.appendChild(renderer.domElement);

// --- PERSPECTIVE CAMERA SETUP ---
let camera;
function createPerspectiveCamera(pos, target, fov=50){
	const aspect = container.clientWidth / container.clientHeight;
	const cam = new THREE.PerspectiveCamera(fov, aspect, 0.01, 100);
	cam.position.copy(pos);
	cam.lookAt(target);
	cam.userData.fov = fov; // store for resize
	return cam;
}

function addCreaseEdges(mesh, thresholdAngleDeg = 20, edgeColor = 0x808080) {
	const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, thresholdAngleDeg);
	const edgesMat = new THREE.LineBasicMaterial({
		color: edgeColor,
		transparent: true,
		opacity: .4,
		depthTest: true,
		depthWrite: false
	});
	const edges = new THREE.LineSegments(edgesGeom, edgesMat);
	edges.userData.isCreaseEdges = true;
	edges.frustumCulled = false;
	edges.renderOrder = 2; // rely on depth to hide back edges
	mesh.add(edges);
	return edges;
}

// Ground as shadow catcher
const ground = new THREE.Mesh(
	new THREE.PlaneGeometry(50,50),
	new THREE.ShadowMaterial({ opacity:0.2 })
);
ground.rotation.x = -Math.PI/2;
ground.position.y=0;
ground.receiveShadow = true;
ground.visible = true;
scene.add(ground);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, .5);
scene.add(ambientLight);
// Add a subtle sky light to lift shadowed areas
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.3);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, .5);
dirLight.position.set(30,20,-10);
dirLight.castShadow = true;
dirLight.target.position.set(0, 0, 0);
scene.add(dirLight);

// --- Light helpers ---
const lightHelpers = new LightHelpers(scene);
if (SHOW_LIGHT_HELPERS) {
	lightHelpers.addDirectionalLightHelper(dirLight, 10, 0xffffff);
	lightHelpers.addShadowCameraHelper(dirLight);
}

const c = dirLight.shadow.camera; // OrthographicCamera
// Tighter frustum for higher texel density (sharper edges)
c.left = -6;
c.right = 6;
c.top = 6;
c.bottom = -6;
c.near = 1;
c.far = 50;
c.updateProjectionMatrix();

// Increase resolution for cleaner edges
dirLight.shadow.mapSize.set(4096, 4096);
// Reduce shadow acne and peter-panning
dirLight.shadow.bias = -0.0001;
dirLight.shadow.normalBias = 0.005;
// Add radius for softer shadow edges
dirLight.shadow.radius = 4;

// GLTF / GLB loader with proper base paths and DRACO support
const loader = new THREE.GLTFLoader()
	.setPath('images/models/')
	.setResourcePath('images/models/');

// Uncomment if your asset is Draco-compressed
const draco = new THREE.DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
loader.setDRACOLoader(draco);

// Cache-bust model requests to avoid stale .gltf/.bin during dev
THREE.DefaultLoadingManager.setURLModifier((url) => {
	if (url.indexOf('images/models/') !== -1) {
		const sep = url.indexOf('?') === -1 ? '?' : '&';
		return url + sep + 'v=' + Date.now();
	}
	return url;
});

loader.load(
	'electric.glb',
	(glb) => {

		const root = glb.scene;

		// --- Center & scale ---
		const sizePre = new THREE.Vector3();
		new THREE.Box3().setFromObject(root).getSize(sizePre);
		const maxDim = Math.max(sizePre.x, sizePre.y, sizePre.z) || 1;
		const targetSize = 2; // desired max dimension in scene units
		root.scale.setScalar(targetSize / maxDim);

		// --- Traverse meshes ---
		root.traverse((obj) => {
			if (obj.isMesh && !obj.userData?.isOutline) {
				obj.castShadow = obj.receiveShadow = true;
				
				// Special treatment for ground mesh - solid background color, no outline
				if (obj.name.toLowerCase().includes('ground')) {
					obj.material = new THREE.MeshStandardMaterial({ 
						color: 0xdddddd,
						metalness: 0,
						roughness: 1
					});
				} else if (obj.name.toLowerCase().includes('stairs')) {
					// Special treatment for stairs mesh - yellow material with outline
					obj.material = new THREE.MeshStandardMaterial({ 
						color: 0xd6aa26,
						metalness: 0,
						roughness: 1,
						flatShading: true
					});
					// Slightly push base mesh back to avoid z-fighting with edges
					if (obj.material && obj.material.polygonOffset !== undefined) {
						obj.material.polygonOffset = true;
						obj.material.polygonOffsetFactor = 1;
						obj.material.polygonOffsetUnits = 1;
					}
					// Add white crease edges to stairs mesh
					addCreaseEdges(obj, 30, 0xffffff);
				} else {
					// Use a flat-shaded standard material so the model can receive self-shadows
					obj.material = new THREE.MeshStandardMaterial({ 
						color: 0xffffff,
						metalness: 0,
						roughness: 1,
						flatShading: true
					});
					// Slightly push base mesh back to avoid z-fighting with edges
					if (obj.material && obj.material.polygonOffset !== undefined) {
						obj.material.polygonOffset = true;
						obj.material.polygonOffsetFactor = 1;
						obj.material.polygonOffsetUnits = 1;
					}
					// Add gray crease edges to all meshes (higher threshold = fewer lines)
					addCreaseEdges(obj, 30, 0x808080);
				}
			}
		});

		scene.add(root);

	}
);

// After any model load completes, set pan center and limit from its bounds
THREE.DefaultLoadingManager.onLoad = function(){
	// Find the model root by looking for meshes; fallback to scene center
	let modelRoot = null;
	for (let i = scene.children.length - 1; i >= 0; i--) {
		const child = scene.children[i];
		if (child.isMesh || (child.children && child.children.length > 0)) { 
			modelRoot = child; 
			break; 
		}
	}
	if (modelRoot) {
		const bbox = new THREE.Box3().setFromObject(modelRoot);
		const center = new THREE.Vector3();
		bbox.getCenter(center);
		sceneFocus.copy(center);
		const size = new THREE.Vector3();
		bbox.getSize(size);
		panLimit = Math.max(5, 0.75 * Math.max(size.x, size.z));
	}
};

// --- Camera home (single) ---
const homePositions = {
	cameraDefault: { pos:new THREE.Vector3(15.7,5.6,15), target:new THREE.Vector3(0.3,0.5,0), fov:6, color:0xffffff },
};

// --- Camera helpers ---
const cameraHelpers = new CameraHelpers(scene);
if (SHOW_CAMERA_HELPERS) {
	cameraHelpers.addCameraHelpers(homePositions);
}
camera = createPerspectiveCamera(homePositions.cameraDefault.pos, homePositions.cameraDefault.target, homePositions.cameraDefault.fov);

// Initialize camera debugger
let cameraDebugger;
if (typeof CameraDebugger !== 'undefined') {
	cameraDebugger = new CameraDebugger(camera, homePositions, 'cameraDefault');
}

const minHeight=1, minDistance=5, maxDistance=25;
let panLimit=5; // updated after model load
let sceneFocus = new THREE.Vector3(0,0.5,0); // pan center updated from model

// --- Spherical helpers ---
function posFromSpherical(targetVec, az, pol, r){
	return new THREE.Vector3(
		targetVec.x + Math.cos(az)*Math.cos(pol)*r,
		targetVec.y + Math.sin(pol)*r,
		targetVec.z + Math.sin(az)*Math.cos(pol)*r
	);
}

function computeAnglesFromPos(pos,targetVec){
	const offset = new THREE.Vector3().subVectors(pos,targetVec);
	const radius = offset.length();
	const polar = Math.asin(offset.y/radius);
	const azimuth = Math.atan2(offset.z, offset.x);
	return { azimuth, polar, radius };
}

function clampPolar(polar,radius,targetY){
	const need=(minHeight-targetY)/radius;
	const safe=Math.max(-0.9999, Math.min(0.9999,need));
	const minPolar=Math.asin(safe);
	const maxPolar=Math.PI/2-0.01;
	return Math.max(minPolar, Math.min(maxPolar, polar));
}

// Helper function to find shortest angular distance
function shortestAngularDistance(current, target) {
	let diff = target - current;
	// Normalize to [-π, π]
	while (diff > Math.PI) diff -= 2 * Math.PI;
	while (diff < -Math.PI) diff += 2 * Math.PI;
	return current + diff;
}

function clampPanTarget(targetVec){
	const dx = targetVec.x - sceneFocus.x;
	const dz = targetVec.z - sceneFocus.z;
	const dist = Math.sqrt(dx*dx + dz*dz);
	if(dist>panLimit){
		const scale=panLimit/dist;
		targetVec.x=sceneFocus.x+dx*scale;
		targetVec.z=sceneFocus.z+dz*scale;
	}
}

// --- Camera state ---
let targetAz,targetPolar,targetRadius;
let currentAz,currentPolar,currentRadius;
let targetLookAt=new THREE.Vector3();
let currentLookAt=new THREE.Vector3();
let targetFov, currentFov;
let isTransitioning=false;

(function initCamera(){
	const home = homePositions.cameraDefault;
	targetLookAt.copy(home.target);
	currentLookAt.copy(home.target);
	const ang = computeAnglesFromPos(home.pos,home.target);
	targetAz=currentAz=ang.azimuth;
	targetPolar=currentPolar=ang.polar;
	targetRadius=currentRadius=ang.radius;
	targetFov=currentFov=home.fov;
	
})();

// --- Input & Zoom ---
let isLeft=false,isRight=false,lastX=0,lastY=0;
let hasDragged=false; // Track if mouse has moved while pressed
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('mousedown',e=>{
	lastX=e.clientX; lastY=e.clientY;
	hasDragged=false; // Reset drag flag on mouse down
	if(e.button===0)isLeft=true;
	if(e.button===2)isRight=true;
});

window.addEventListener('mouseup',e=>{
	if(e.button===0)isLeft=false;
	if(e.button===2)isRight=false;
});

window.addEventListener('mousemove',e=>{
	const dx = e.clientX-lastX;
	const dy = e.clientY-lastY;
	lastX=e.clientX; lastY=e.clientY;
	if(isTransitioning) return;
	if(isLeft){
		const orbitSpeed=0.01;
		targetAz+=dx*orbitSpeed;
		targetPolar+=dy*orbitSpeed;
		targetPolar=clampPolar(targetPolar,targetRadius,targetLookAt.y);
		// Mark as dragged if mouse moved while left button is pressed
		if(Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged=true;
	}else if(isRight){
		const panSpeed=0.01;
		const right = new THREE.Vector3();
		const up = new THREE.Vector3();
		camera.getWorldDirection(right);
		right.cross(camera.up).normalize();
		up.copy(camera.up);
		targetLookAt.addScaledVector(right,-dx*panSpeed);
		targetLookAt.addScaledVector(up,dy*panSpeed);
		clampPanTarget(targetLookAt);
		// Mark as dragged if mouse moved while right button is pressed
		if(Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged=true;
	}
});

renderer.domElement.addEventListener('wheel', e=>{
	e.preventDefault();
	if(isTransitioning) return;
	const zoomFactor=1 + e.deltaY*0.001;
	targetRadius = Math.max(minDistance, Math.min(maxDistance, targetRadius*zoomFactor));
});

// --- Touch controls (mobile): 1-finger orbit, 2-finger pan, pinch to zoom ---
let activeTouchMode = null; // 'orbit' | 'pan' | 'pinch'
let touchLastX = 0, touchLastY = 0;
let pinchStartDistance = 0;
let pinchStartRadius = 0;

function getTouchMidpoint(t1, t2) {
	return {
		x: (t1.clientX + t2.clientX) * 0.5,
		y: (t1.clientY + t2.clientY) * 0.5
	};
}

function getTouchDistance(t1, t2) {
	const dx = t1.clientX - t2.clientX;
	const dy = t1.clientY - t2.clientY;
	return Math.hypot(dx, dy);
}

renderer.domElement.addEventListener('touchstart', (e) => {
	e.preventDefault();
	if (e.touches.length === 1) {
		activeTouchMode = 'orbit';
		touchLastX = e.touches[0].clientX;
		touchLastY = e.touches[0].clientY;
		hasDragged = false;
	} else if (e.touches.length === 2) {
		activeTouchMode = 'pinch';
		const [t1, t2] = e.touches;
		pinchStartDistance = getTouchDistance(t1, t2);
		pinchStartRadius = targetRadius;
		// Initialize pan midpoint for two-finger pan
		const mid = getTouchMidpoint(t1, t2);
		touchLastX = mid.x;
		touchLastY = mid.y;
	}
}, { passive: false });

renderer.domElement.addEventListener('touchmove', (e) => {
	e.preventDefault();
	if (isTransitioning) return;

	if (e.touches.length === 1 && activeTouchMode === 'orbit') {
		const t = e.touches[0];
		const dx = t.clientX - touchLastX;
		const dy = t.clientY - touchLastY;
		touchLastX = t.clientX;
		touchLastY = t.clientY;

		const orbitSpeed = 0.01;
		targetAz += dx * orbitSpeed;
		targetPolar += dy * orbitSpeed;
		targetPolar = clampPolar(targetPolar, targetRadius, targetLookAt.y);

		if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged = true;
	} else if (e.touches.length === 2) {
		const [t1, t2] = e.touches;

		// Pan using midpoint movement
		const mid = getTouchMidpoint(t1, t2);
		const dx = mid.x - touchLastX;
		const dy = mid.y - touchLastY;
		touchLastX = mid.x;
		touchLastY = mid.y;

		const panSpeed = 0.01;
		const right = new THREE.Vector3();
		const up = new THREE.Vector3();
		camera.getWorldDirection(right);
		right.cross(camera.up).normalize();
		up.copy(camera.up);

		targetLookAt.addScaledVector(right, -dx * panSpeed);
		targetLookAt.addScaledVector(up, dy * panSpeed);
		clampPanTarget(targetLookAt);

		// Pinch zoom based on distance delta
		const currentDist = getTouchDistance(t1, t2);
		const scale = pinchStartDistance > 0 ? (pinchStartDistance / currentDist) : 1;
		const desiredRadius = pinchStartRadius * scale;
		targetRadius = Math.max(minDistance, Math.min(maxDistance, desiredRadius));
	}
}, { passive: false });

renderer.domElement.addEventListener('touchend', (e) => {
	if (e.touches.length === 0) {
		activeTouchMode = null;
		pinchStartDistance = 0;
	}
}, { passive: false });

// --- Animate ---
const smoothFactor=0.05; // Slower camera movement for smoother transitions

function animate(){
	requestAnimationFrame(animate);
	
	// Use dynamic smooth factor during transitions, otherwise use default
	const smooth = isTransitioning && window.targetSmoothFactor ? window.targetSmoothFactor : smoothFactor;
	
	currentAz+=(targetAz-currentAz)*smooth;
	currentPolar+=(targetPolar-currentPolar)*smooth;
	currentRadius+=(targetRadius-currentRadius)*smooth;
	currentLookAt.lerp(targetLookAt,smooth);
	
	// Smoothly interpolate FOV
	currentFov += (targetFov - currentFov) * smooth;
	camera.fov = currentFov;
	camera.updateProjectionMatrix();

	const desiredPos=posFromSpherical(currentLookAt,currentAz,currentPolar,currentRadius);
	camera.position.copy(desiredPos);
	if(camera.position.y<minHeight)camera.position.y=minHeight;
	camera.lookAt(currentLookAt);

	// Update light helpers
	lightHelpers.helpers.forEach(helper => {
		if (helper.update) helper.update();
	});
	// Render
	renderer.render(scene,camera);

	// End transition when we're close enough to target or time has elapsed
	if(isTransitioning){
		const azErr=Math.abs(currentAz-targetAz);
		const polErr=Math.abs(currentPolar-targetPolar);
		const rErr=Math.abs(currentRadius-targetRadius);
		const fovErr=Math.abs(currentFov-targetFov);
		const timeElapsed = window.transitionEndTime ? Date.now() > window.transitionEndTime : false;

		// End transition if close enough OR time has elapsed (more lenient thresholds)
		if((azErr<0.01 && polErr<0.01 && rErr<0.1 && fovErr<0.1) || timeElapsed) {
			isTransitioning=false;
			window.targetSmoothFactor = null; // Reset smooth factor
		}
	}

	const dampingFactor = activeTouchMode ? 0.3 : 0.1; // Faster during touch, slower otherwise

	currentAz += (targetAz - currentAz) * dampingFactor;
	currentPolar += (targetPolar - currentPolar) * dampingFactor;
	currentRadius += (targetRadius - currentRadius) * dampingFactor;
	currentLookAt.lerp(targetLookAt, dampingFactor);
}
animate();

// --- Resize ---
function resizeRenderer(){
	const w = container.clientWidth;
	const h = container.clientHeight;
	renderer.setSize(w,h);
	const aspect=w/h;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();
}
window.addEventListener('resize',resizeRenderer);
resizeRenderer();

// Handle three.js overlay click
document.getElementById('three-overlay').addEventListener('click', function () {
	// Hide the overlay
	this.classList.add('hidden');

	// Get the three-container
	const threeContainer = document.getElementById('three-container');

	// 1. Scroll to center the container
	if (threeContainer) {
		threeContainer.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});

		// 2. Add red border
		threeContainer.style.border = '1px #ddd solid';
	}

	// Enable pointer events on the canvas
	const canvas = document.querySelector('#three-container canvas');
	if (canvas) {
		canvas.style.pointerEvents = 'auto';
	}

	// Animate the three-ui into view
	const threeUI = document.querySelector('.three-ui');
	if (threeUI) {
		threeUI.classList.add('visible');
	}
});

// Camera debug UI event listeners
document.addEventListener('DOMContentLoaded', function() {
	// Set up event listeners after the debug UI is created
	setTimeout(() => {
		// Toggle helpers button
		const toggleHelpersBtn = document.getElementById('toggle-helpers');
		if (toggleHelpersBtn) {
			toggleHelpersBtn.addEventListener('click', function() {
				SHOW_CAMERA_HELPERS = !SHOW_CAMERA_HELPERS;
				if (SHOW_CAMERA_HELPERS) {
					cameraHelpers.addCameraHelpers(homePositions);
				} else {
					cameraHelpers.clearHelpers();
				}
			});
		}
		
		// Reset camera button
		const resetCameraBtn = document.getElementById('reset-camera');
		if (resetCameraBtn) {
			resetCameraBtn.addEventListener('click', function() {
				// Reset to default position
				const home = homePositions.cameraDefault;
				targetLookAt.copy(home.target);
				currentLookAt.copy(home.target);
				const ang = computeAnglesFromPos(home.pos, home.target);
				targetAz = currentAz = ang.azimuth;
				targetPolar = currentPolar = ang.polar;
				targetRadius = currentRadius = ang.radius;
				targetFov = currentFov = home.fov;
				
				// Update debugger UI if it exists
				if (cameraDebugger) {
					cameraDebugger.updateUI();
				}
			});
		}
	}, 100);
});

// Global function to toggle camera debug UI
window.toggleCameraDebug = function() {
	if (cameraDebugger) {
		cameraDebugger.toggle();
	}
};

// Global function to show camera debug UI
window.showCameraDebug = function() {
	if (cameraDebugger) {
		cameraDebugger.show();
	}
};

// Global function to hide camera debug UI
window.hideCameraDebug = function() {
	if (cameraDebugger) {
		cameraDebugger.hide();
	}
};

// Global function to toggle camera helpers
window.toggleCameraHelpers = function() {
	SHOW_CAMERA_HELPERS = !SHOW_CAMERA_HELPERS;
	if (SHOW_CAMERA_HELPERS) {
		cameraHelpers.addCameraHelpers(homePositions);
	} else {
		cameraHelpers.clearHelpers();
	}
};

// Global function to show camera helpers
window.showCameraHelpers = function() {
	SHOW_CAMERA_HELPERS = true;
	cameraHelpers.addCameraHelpers(homePositions);
};

// Global function to hide camera helpers
window.hideCameraHelpers = function() {
	SHOW_CAMERA_HELPERS = false;
	cameraHelpers.clearHelpers();
};

// Make functions available globally for the debugger
window.computeAnglesFromPos = computeAnglesFromPos;
window.targetLookAt = targetLookAt;
window.targetAz = targetAz;
window.targetPolar = targetPolar;
window.targetRadius = targetRadius;
window.currentAz = currentAz;
window.currentPolar = currentPolar;
window.currentRadius = currentRadius;

// Function to update spherical coordinates (for debugger)
window.updateSphericalCoords = function(az, pol, rad) {
	targetAz = currentAz = az;
	targetPolar = currentPolar = pol;
	targetRadius = currentRadius = rad;
};
