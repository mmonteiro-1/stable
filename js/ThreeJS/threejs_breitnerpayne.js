const container = document.getElementById('three-container');

// --- Helper Toggle Flags ---
const SHOW_CAMERA_HELPERS = false;  // Set to false to hide camera helpers
const SHOW_LIGHT_HELPERS = false;   // Set to false to hide light helpers

// --- Mesh visibility management ---
const meshesToToggle = {
	// Store references to meshes that should be hidden/shown based on camera
	walls: {
		mesh: null,
		originalPosition: null,
		originalOpacity: null,
		animation: null,
		upPosition: null // Store the up position for reverse animation
	},
	shelves: {
		mesh: null,
		originalPosition: null,
		originalOpacity: null,
		animation: null,
		upPosition: null // Store the up position for reverse animation
	},
	floor: {
		mesh: null,
		originalPosition: null,
		originalOpacity: null,
		animation: null
	},
	production: {
		mesh: null,
		originalPosition: null
	}
};

// Scene + renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f2f2);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
container.appendChild(renderer.domElement);

// --- PERSPECTIVE CAMERA SETUP ---
let camera;
function createPerspectiveCamera(pos, target, fov=50){
	const aspect = container.clientWidth / container.clientHeight;
	const cam = new THREE.PerspectiveCamera(fov, aspect, 0.01, 1000);
	cam.position.copy(pos);
	cam.lookAt(target);
	cam.userData.fov = fov; // store for resize
	return cam;
}


function addCreaseEdges(mesh, thresholdAngleDeg = 20, edgeColor = 0x808080) {
	const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, thresholdAngleDeg);
	const edgesMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.4});
	const edges = new THREE.LineSegments(edgesGeom, edgesMat);
	edges.userData.isCreaseEdges = true;
	edges.frustumCulled = false;
	edges.renderOrder = 2; // draw on top of mesh
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
scene.add(ground);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, .9);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0x808080, .7);
dirLight.position.set(20,20,-20);
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
c.left = -10;
c.right = 10;
c.top = 10;
c.bottom = -10;
c.near = 1;
c.far = 50;
c.updateProjectionMatrix();

// Increase resolution for cleaner edges
dirLight.shadow.mapSize.set(4096, 4096);

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
	'factory.glb',
	(glb) => {

		const root = glb.scene;

		// --- Center & scale ---
		const sizePre = new THREE.Vector3();
		new THREE.Box3().setFromObject(root).getSize(sizePre);
		const maxDim = Math.max(sizePre.x, sizePre.y, sizePre.z) || 1;
		const targetSize = 15; // desired max dimension in scene units
		root.scale.setScalar(targetSize / maxDim);

		// --- Grab target meshes for hover effects (before traverse) ---
		const productionMesh = root.getObjectByName('section_production');
		
		// Store production mesh reference for position management
		if (productionMesh) {
			meshesToToggle.production.mesh = productionMesh;
			meshesToToggle.production.originalPosition = productionMesh.position.clone();
		}

		// --- Traverse meshes ---
		root.traverse((obj) => {
			if (obj.isMesh && !obj.userData?.isOutline) {
				obj.castShadow = obj.receiveShadow = true;
				
				// Store reference to specific meshes for visibility toggling
				if (obj.name === 'walls') {
					meshesToToggle.walls.mesh = obj;
					meshesToToggle.walls.originalPosition = obj.position.clone();
					meshesToToggle.walls.originalOpacity = 1.0;
					
				}
				
				if (obj.name === 'shelves') {
					meshesToToggle.shelves.mesh = obj;
					meshesToToggle.shelves.originalPosition = obj.position.clone();
					meshesToToggle.shelves.originalOpacity = 1.0;
					
				}
				
				if (obj.name.toLowerCase().includes('floor')) {
					meshesToToggle.floor.mesh = obj;
					meshesToToggle.floor.originalPosition = obj.position.clone();
					meshesToToggle.floor.originalOpacity = 1.0;
				}
				
				// Only add crease edges to non-detection and non-floor meshes
				if (!obj.name.toLowerCase().includes('detection') && !obj.name.toLowerCase().includes('floor')) {
					// Use white edges for production mesh, gray for others
					const edgeColor = obj.name.toLowerCase().includes('section_production') ? 0xffffff : 0x808080;
					addCreaseEdges(obj, 30, edgeColor);
				}
				
				// Check if mesh name contains "detection"
				if (obj.name.toLowerCase().includes('detection')) {
					// Make detection meshes truly invisible and non-interfering
					obj.material = new THREE.MeshBasicMaterial({ 
						transparent: true, 
						opacity: 0,
						side: THREE.DoubleSide,
						depthWrite: false,
						depthTest: false,
						alphaTest: 0.5,  // Discard pixels with alpha < 0.5
						blending: THREE.NoBlending  // No blending with background
					});
					// Disable shadow casting and receiving for detection meshes
					obj.castShadow = false;
					obj.receiveShadow = false;
					// Make them not affect lighting calculations
					obj.visible = true; // Keep visible for ray casting but invisible to rendering
					// Add to interactive meshes
					interactiveMeshes.push({ 
						mesh: obj
					});
				} else {
					// Set section_production to always have red material
					if (obj.name.toLowerCase().includes('section_production')) {
						obj.material = new THREE.MeshStandardMaterial({
							color: 0xff3d33, // Red color
							roughness: 1,
							metalness: 0
						});
					} else if (obj.name !== 'walls' && obj.name !== 'shelves') {
						// Override others with simple light gray material (excluding walls, shelves, and floor)
						if (!obj.name.toLowerCase().includes('floor')) {
							obj.material = new THREE.MeshStandardMaterial({
								color: 0xf4f4f4,
								roughness: 1,
								metalness: 0
							});
						}
					}
				}
			}
			if (obj.isMesh) {
			}
		});
		
		// Apply transparent material to walls mesh after all other material assignments
		if (meshesToToggle.walls.mesh) {
			meshesToToggle.walls.mesh.material = new THREE.MeshStandardMaterial({
				color: 0xf4f4f4,
				transparent: true,
				opacity: 1.0,
				roughness: 1,
				metalness: 0
			});
		}
		
		// Apply transparent material to shelves mesh after all other material assignments
		if (meshesToToggle.shelves.mesh) {
			meshesToToggle.shelves.mesh.material = new THREE.MeshStandardMaterial({
				color: 0xf4f4f4,
				transparent: true,
				opacity: 1.0,
				roughness: 1,
				metalness: 0
			});
		}
		

		// --- Add to scene ---
		scene.add(root);

	},
	(xhr) => {
	},
	(err) => {
		console.error('❌ GLB load error:', err);
	}
);


// After any model load completes, set pan center and limit from its bounds
THREE.DefaultLoadingManager.onLoad = function(){
	// Find a recently added group as model root; fallback to scene center
	let modelRoot = null;
	for (let i = scene.children.length - 1; i >= 0; i--) {
		const child = scene.children[i];
		if (child.type === 'Group') { modelRoot = child; break; }
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

// --- Camera homes ---
const homePositions = {
	cameraFactory: { pos:new THREE.Vector3(30,20.5,22.5), target:new THREE.Vector3(0.5,0.5,0), fov:10, color:0xffffff },
	cameraProduction: { pos:new THREE.Vector3(30,15,12.5), target:new THREE.Vector3(0,0,-1.5), fov:5, color:0xffffff },
};


// --- Camera helpers ---
const cameraHelpers = new CameraHelpers(scene);
if (SHOW_CAMERA_HELPERS) {
	cameraHelpers.addCameraHelpers(homePositions);
}
let activeHome='cameraFactory';
camera = createPerspectiveCamera(homePositions.cameraFactory.pos, homePositions.cameraFactory.target, homePositions.cameraFactory.fov);

// Initialize camera selection on page load
updateCameraSelection('cameraFactory');


const minHeight=1, minDistance=5, maxDistance=50;
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
	const home = homePositions.cameraFactory;
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

// --- Animated floor mesh visibility management ---
function animateFloorVisibility(meshData, shouldHide) {
	if (!meshData.mesh) return;
	
	const mesh = meshData.mesh;
	
	// Enable transparency on the original material without changing it
	if (!mesh.material.transparent) {
		mesh.material.transparent = true;
	}
	
	// Kill any existing animation
	if (meshData.animation) {
		meshData.animation.kill();
	}
	
	if (shouldHide) {
		// Animate out: fade to transparent
		meshData.animation = gsap.to(mesh.material, {
			opacity: 0,
			duration: 1.2,
			ease: "power3.inOut",
			onComplete: () => {
				mesh.visible = false;
			}
		});
	} else {
		// Animate in: fade from transparent to original opacity
		mesh.visible = true;
		mesh.material.opacity = 0;
		
		meshData.animation = gsap.to(mesh.material, {
			opacity: 1.0,
			duration: 1.2,
			ease: "power3.inOut"
		});
	}
}

// --- Animated mesh visibility management ---
function animateMeshVisibility(meshData, shouldHide) {
	if (!meshData.mesh || !meshData.originalPosition) return;
	
	const mesh = meshData.mesh;
	const originalPos = meshData.originalPosition;
	const originalOpacity = meshData.originalOpacity;
	
	// Kill any existing animation
	if (meshData.animation) {
		meshData.animation.kill();
	}
	
	if (shouldHide) {
		// Animate out: move up slightly, then down past ground level
		const upPosition = originalPos.clone();
		upPosition.z += 0.1; // Small upward movement
		
		const downPosition = originalPos.clone();
		downPosition.z -= 1.4; // Move down past ground level
		
		// Store upPosition for reverse animation
		meshData.upPosition = upPosition.clone();
		
		
		meshData.animation = gsap.timeline({
			onComplete: () => {
				mesh.visible = false;
				// Reset position for next show animation
				mesh.position.copy(originalPos);
			}
		})
		.to(mesh.position, {
			z: upPosition.z,
			duration: .3,
			ease: "power4.Out" // Even smoother curve for downward movement
		})
		.to(mesh.position, {
			z: downPosition.z,
			duration: 1,
			ease: "power3.inOut" // Even smoother curve for downward movement
		})
		.to(mesh.material, {
			opacity: 0,
			duration: .8,
		}, "-=.7"); // Start fade earlier to match reverse timing
		
		
	} else {
		// Animate in: start from below, move up with gentle bounce and fade in
		mesh.visible = true;
		mesh.position.copy(originalPos);
		mesh.position.z -= 1.3; // Start from below along Z-axis
		mesh.material.opacity = 0;
		
		// Use stored upPosition if available, otherwise create one
		const upPosition = meshData.upPosition || (() => {
			const up = originalPos.clone();
			up.z += 0.2;
			return up;
		})();
		
		meshData.animation = gsap.timeline()
		.to(mesh.position, {
			z: upPosition.z, // Use the upPosition from hide animation
			duration: .8,
			ease: "power4.inOut" // Smooth ease in-out instead of elastic
		})
		.to(mesh.position, {
			z: originalPos.z, // Then settle to original position
			duration: 0.8,
			ease: "power3.out"
		})
		.to(mesh.material, {
			opacity: originalOpacity,
			duration: 1.2,
		}, "-=1.5"); // Start fade at the same time as movement
		
	}
}

function toggleMeshVisibility(cameraName) {
	// Hide/show meshes based on camera selection with animation
	if (meshesToToggle.walls.mesh) {
		if (cameraName === 'cameraProduction') {
			// Hide walls when viewing production
			animateMeshVisibility(meshesToToggle.walls, true);
			
			// Hide floor with smooth animation when viewing production
			if (meshesToToggle.floor.mesh) {
				animateFloorVisibility(meshesToToggle.floor, true);
			}
			
			// Hide shelves with 400ms delay
			if (meshesToToggle.shelves.mesh) {
				setTimeout(() => {
					animateMeshVisibility(meshesToToggle.shelves, true);
				}, 200);
			}
			
			// Move production mesh down when viewing production
			if (meshesToToggle.production.mesh && meshesToToggle.production.originalPosition) {
				meshesToToggle.production.mesh.position.z = meshesToToggle.production.originalPosition.z - 0.03;
			}
		} else if (cameraName === 'cameraFactory') {
			// Show walls when viewing factory
			animateMeshVisibility(meshesToToggle.walls, false);
			
			// Show floor with smooth animation when viewing factory
			if (meshesToToggle.floor.mesh) {
				animateFloorVisibility(meshesToToggle.floor, false);
			}
			
			// Show shelves with 400ms delay
			if (meshesToToggle.shelves.mesh) {
				setTimeout(() => {
					animateMeshVisibility(meshesToToggle.shelves, false);
				}, 200);
			}
			
			// Reset production mesh to original position when viewing factory
			if (meshesToToggle.production.mesh && meshesToToggle.production.originalPosition) {
				meshesToToggle.production.mesh.position.copy(meshesToToggle.production.originalPosition);
			}
		}
	}
}

// --- Camera selection management ---
function updateCameraSelection(selectedCamera) {
	// Remove selected class from all camera buttons
	document.getElementById('cameraFactory').classList.remove('selected');
	document.getElementById('cameraProduction').classList.remove('selected');
	
	// Add selected class to the active camera button
	document.getElementById(selectedCamera).classList.add('selected');
	
	// Toggle mesh visibility based on camera selection
	toggleMeshVisibility(selectedCamera);
}

// --- Camera switch ---
function goToHome(name, transitionDuration = 4000){
	activeHome=name;
	updateCameraSelection(name); // Update UI selection
	
	const home = homePositions[name];
	targetLookAt.copy(home.target);
	const ang = computeAnglesFromPos(home.pos,home.target);
	
	// Use shortest path for azimuth to avoid swirling
	targetAz = shortestAngularDistance(currentAz, ang.azimuth);
	targetPolar=clampPolar(ang.polar,ang.radius,targetLookAt.y);
	targetRadius=Math.max(minDistance,Math.min(maxDistance,ang.radius));
	
	// Set the target FOV (will be smoothly interpolated)
	targetFov = home.fov;
	
	// Calculate smooth factor based on desired transition duration
	// Faster transitions need higher smooth factor
	const baseSmoothFactor = 0.05;
	const targetSmoothFactor = Math.max(0.01, Math.min(0.2, 3000 / transitionDuration * baseSmoothFactor));
	
	isTransitioning=true;
	
	// Set transition end time for smoother completion detection
	window.transitionEndTime = Date.now() + transitionDuration;
	window.targetSmoothFactor = targetSmoothFactor; // Store for use in animate loop
}
document.getElementById('cameraFactory').addEventListener('click',()=>goToHome('cameraFactory'));
document.getElementById('cameraProduction').addEventListener('click',()=>goToHome('cameraProduction'));

// --- Raycaster for hover ---
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();

window.addEventListener('mousemove',e=>{
	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
	mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
});

// Add click functionality to detection meshes
renderer.domElement.addEventListener('click', e => {
	// Only trigger click if there was no dragging
	if (hasDragged) return;
	
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(interactiveMeshes.map(o => o.mesh));
	if (intersects.length > 0) {
		const clickedMesh = intersects[0].object;
		
		// Check detection mesh type and switch to appropriate camera
		if (clickedMesh.name.toLowerCase().includes('production')) {
			goToHome('cameraProduction');
		}
		// You can add more click actions here for other detection meshes
	}
});

const interactiveMeshes = [
	// Detection container will be added dynamically when model loads
];

function checkHover() {
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(interactiveMeshes.map(o => o.mesh));
	if (intersects.length > 0) {
		renderer.domElement.style.cursor = 'pointer';
	} else {
		renderer.domElement.style.cursor = 'grab';
	}
}

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



	checkHover();
	// Update light helpers
	lightHelpers.helpers.forEach(helper => {
		if (helper.update) helper.update();
	});
	// Render
	renderer.render(scene,camera);

	// End transition when we're close enough to target or time has elapsed
	if(isTransitioning){
		const homePos=homePositions[activeHome].pos;
		const d=camera.position.distanceTo(homePos);
		const azErr=Math.abs(currentAz-targetAz);
		const polErr=Math.abs(currentPolar-targetPolar);
		const rErr=Math.abs(currentRadius-targetRadius);
		const fovErr=Math.abs(currentFov-targetFov);
		const timeElapsed = window.transitionEndTime ? Date.now() > window.transitionEndTime : false;
		
		// End transition if close enough OR time has elapsed (more lenient thresholds)
		if((d<0.1 && azErr<0.01 && polErr<0.01 && rErr<0.1 && fovErr<0.1) || timeElapsed) {
			isTransitioning=false;
			window.targetSmoothFactor = null; // Reset smooth factor
		}
	}
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
