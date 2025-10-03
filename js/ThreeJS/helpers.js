// Three.js Scene Helpers
// This file contains helper functions to visualize cameras, lights, and other scene elements

class CameraHelpers {
	constructor(scene) {
		this.scene = scene;
		this.helpers = [];
	}

	createCameraHelper(pos, target, color) {
		// Create a sphere for camera position
		const cameraSphere = new THREE.Mesh(
			new THREE.SphereGeometry(0.5, 8, 6),
			new THREE.MeshBasicMaterial({ color: color })
		);
		cameraSphere.position.copy(pos);
		
		// Create a small box for target
		const targetBox = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 0.3, 0.3),
			new THREE.MeshBasicMaterial({ color: color })
		);
		targetBox.position.copy(target);
		
		// Create a line connecting camera to target
		const lineGeometry = new THREE.BufferGeometry().setFromPoints([pos, target]);
		const lineMaterial = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
		const line = new THREE.Line(lineGeometry, lineMaterial);
		
		// Group all helper elements
		const helperGroup = new THREE.Group();
		helperGroup.add(cameraSphere);
		helperGroup.add(targetBox);
		helperGroup.add(line);
		helperGroup.userData.isCameraHelper = true;
		
		return helperGroup;
	}

	addCameraHelpers(homePositions) {
		// Clear existing helpers
		this.clearHelpers();

		// Create helpers for each camera
		Object.keys(homePositions).forEach((cameraName, index) => {
			const camera = homePositions[cameraName];
			const colors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff]; // Red, Blue, Green, Yellow, Magenta
			const color = colors[index % colors.length];
			
			const helper = this.createCameraHelper(camera.pos, camera.target, color);
			this.helpers.push(helper);
			this.scene.add(helper);
		});
	}

	clearHelpers() {
		this.helpers.forEach(helper => {
			this.scene.remove(helper);
		});
		this.helpers = [];
	}

	updateHelper(cameraName, homePositions) {
		// Find and update specific camera helper
		const cameraIndex = Object.keys(homePositions).indexOf(cameraName);
		if (cameraIndex >= 0 && this.helpers[cameraIndex]) {
			// Remove old helper
			this.scene.remove(this.helpers[cameraIndex]);
			
			// Create new helper with updated position
			const camera = homePositions[cameraName];
			const colors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00, 0xff00ff];
			const color = colors[cameraIndex % colors.length];
			
			const newHelper = this.createCameraHelper(camera.pos, camera.target, color);
			this.helpers[cameraIndex] = newHelper;
			this.scene.add(newHelper);
		}
	}

	toggleHelpers(visible = true) {
		this.helpers.forEach(helper => {
			helper.visible = visible;
		});
	}
}

class LightHelpers {
	constructor(scene) {
		this.scene = scene;
		this.helpers = [];
	}

	addDirectionalLightHelper(directionalLight, size = 10, color = 0xffffff) {
		const dirHelper = new THREE.DirectionalLightHelper(directionalLight, size, color);
		this.helpers.push(dirHelper);
		this.scene.add(dirHelper);
		return dirHelper;
	}

	addShadowCameraHelper(directionalLight) {
		const camHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
		this.helpers.push(camHelper);
		this.scene.add(camHelper);
		return camHelper;
	}

	clearHelpers() {
		this.helpers.forEach(helper => {
			this.scene.remove(helper);
		});
		this.helpers = [];
	}

	toggleHelpers(visible = true) {
		this.helpers.forEach(helper => {
			helper.visible = visible;
		});
	}
}

class CameraDebugger {
	constructor(camera, homePositions, activeHome) {
		this.camera = camera;
		this.homePositions = homePositions;
		this.activeHome = activeHome;
		this.isVisible = false;
		this.debugContainer = null;
		this.initUI();
	}

	initUI() {
		// Create debug container if it doesn't exist
		this.createDebugUI();
		
		// Get UI elements
		this.xSlider = document.getElementById('cam-x');
		this.ySlider = document.getElementById('cam-y');
		this.zSlider = document.getElementById('cam-z');
		this.fovSlider = document.getElementById('cam-fov');
		
		// Target sliders
		this.targetXSlider = document.getElementById('target-x');
		this.targetYSlider = document.getElementById('target-y');
		this.targetZSlider = document.getElementById('target-z');
		
		// Value displays
		this.xValue = document.getElementById('cam-x-value');
		this.yValue = document.getElementById('cam-y-value');
		this.zValue = document.getElementById('cam-z-value');
		this.fovValue = document.getElementById('cam-fov-value');
		this.targetXValue = document.getElementById('target-x-value');
		this.targetYValue = document.getElementById('target-y-value');
		this.targetZValue = document.getElementById('target-z-value');

		// Add event listeners for real-time updates
		[this.xSlider, this.ySlider, this.zSlider, this.fovSlider].forEach(slider => {
			slider.addEventListener('input', () => this.updateCamera());
		});
		
		[this.targetXSlider, this.targetYSlider, this.targetZSlider].forEach(slider => {
			slider.addEventListener('input', () => this.updateTarget());
		});

		// Initial update
		this.updateUI();
	}

	createDebugUI() {
		// Check if debug container already exists
		let debugContainer = document.getElementById('camera-debug');
		if (!debugContainer) {
			// Create the debug UI container
			debugContainer = document.createElement('div');
			debugContainer.id = 'camera-debug';
			debugContainer.style.cssText = `
				position: absolute; 
				top: 20px; 
				right: 20px; 
				background: rgba(0,0,0,0.8); 
				color: white; 
				padding: 20px; 
				border-radius: 8px; 
				font-family: monospace; 
				font-size: 12px; 
				z-index: 1000; 
				min-width: 300px;
				display: none;
			`;
			
			debugContainer.innerHTML = `
				<h3 style="margin: 0 0 15px 0; color: #fff;">Camera Debug</h3>
				
				<!-- Camera Position -->
				<div style="margin-bottom: 15px;">
					<h4 style="margin: 0 0 10px 0; color: #ccc;">Camera Position</h4>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">X:</label>
						<input type="range" id="cam-x" min="-50" max="50" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="cam-x-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">Y:</label>
						<input type="range" id="cam-y" min="0" max="50" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="cam-y-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">Z:</label>
						<input type="range" id="cam-z" min="-50" max="50" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="cam-z-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">FOV:</label>
						<input type="range" id="cam-fov" min="1" max="120" step="1" style="flex: 1; margin-right: 10px;">
						<span id="cam-fov-value" style="width: 40px; text-align: right;">50</span>
					</div>
				</div>
				
				<!-- Camera Target -->
				<div style="margin-bottom: 15px;">
					<h4 style="margin: 0 0 10px 0; color: #ccc;">Camera Target</h4>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">X:</label>
						<input type="range" id="target-x" min="-50" max="50" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="target-x-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">Y:</label>
						<input type="range" id="target-y" min="-10" max="20" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="target-y-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
					<div style="display: flex; align-items: center; margin-bottom: 5px;">
						<label style="width: 20px; margin-right: 10px;">Z:</label>
						<input type="range" id="target-z" min="-50" max="50" step="0.1" style="flex: 1; margin-right: 10px;">
						<span id="target-z-value" style="width: 40px; text-align: right;">0.0</span>
					</div>
				</div>
				
				<!-- Controls -->
				<div style="display: flex; gap: 10px;">
					<button id="toggle-helpers" style="background: #333; color: white; border: 1px solid #555; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Toggle Helpers</button>
					<button id="reset-camera" style="background: #333; color: white; border: 1px solid #555; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Reset</button>
				</div>
			`;
			
			// Add to the three-container if it exists, otherwise to body
			const threeContainer = document.getElementById('three-container');
			if (threeContainer) {
				threeContainer.appendChild(debugContainer);
			} else {
				document.body.appendChild(debugContainer);
			}
		}
		
		this.debugContainer = debugContainer;
	}

	updateUI() {
		// Update sliders and value displays with current camera values
		this.xSlider.value = this.camera.position.x;
		this.ySlider.value = this.camera.position.y;
		this.zSlider.value = this.camera.position.z;
		this.fovSlider.value = this.camera.fov;
		
		// Update target sliders
		this.targetXSlider.value = this.camera.target ? this.camera.target.x : 0;
		this.targetYSlider.value = this.camera.target ? this.camera.target.y : 0;
		this.targetZSlider.value = this.camera.target ? this.camera.target.z : 0;
		
		// Update value displays
		this.updateValueDisplays();
	}
	
	updateValueDisplays() {
		this.xValue.textContent = parseFloat(this.xSlider.value).toFixed(1);
		this.yValue.textContent = parseFloat(this.ySlider.value).toFixed(1);
		this.zValue.textContent = parseFloat(this.zSlider.value).toFixed(1);
		this.fovValue.textContent = parseFloat(this.fovSlider.value).toFixed(0);
		this.targetXValue.textContent = parseFloat(this.targetXSlider.value).toFixed(1);
		this.targetYValue.textContent = parseFloat(this.targetYSlider.value).toFixed(1);
		this.targetZValue.textContent = parseFloat(this.targetZSlider.value).toFixed(1);
	}

	updateCamera() {
		// Get values from sliders
		const x = parseFloat(this.xSlider.value);
		const y = parseFloat(this.ySlider.value);
		const z = parseFloat(this.zSlider.value);
		const fov = parseFloat(this.fovSlider.value);

		// Update value displays
		this.updateValueDisplays();

		// Update camera position
		this.camera.position.set(x, y, z);
		
		// Update camera FOV
		this.camera.fov = Math.max(1, Math.min(120, fov));
		this.camera.updateProjectionMatrix();

		// Update the current home position
		if (this.homePositions[this.activeHome]) {
			this.homePositions[this.activeHome].pos.set(x, y, z);
			this.homePositions[this.activeHome].fov = fov;
		}

		// Update spherical coordinates to match new position
		// This prevents the spherical system from overriding the position
		if (window.computeAnglesFromPos && window.targetLookAt) {
			const ang = window.computeAnglesFromPos(this.camera.position, window.targetLookAt);
			window.targetAz = window.currentAz = ang.azimuth;
			window.targetPolar = window.currentPolar = ang.polar;
			window.targetRadius = window.currentRadius = ang.radius;
			
			// Also update the local variables in the main script
			if (window.updateSphericalCoords) {
				window.updateSphericalCoords(ang.azimuth, ang.polar, ang.radius);
			}
		}
	}
	
	updateTarget() {
		// Get values from target sliders
		const x = parseFloat(this.targetXSlider.value);
		const y = parseFloat(this.targetYSlider.value);
		const z = parseFloat(this.targetZSlider.value);

		// Update value displays
		this.updateValueDisplays();

		// Update target position
		if (window.targetLookAt) {
			window.targetLookAt.set(x, y, z);
		}

		// Update the current home position target
		if (this.homePositions[this.activeHome]) {
			this.homePositions[this.activeHome].target.set(x, y, z);
		}

		// Update spherical coordinates to match new target
		if (window.computeAnglesFromPos && window.targetLookAt) {
			const ang = window.computeAnglesFromPos(this.camera.position, window.targetLookAt);
			window.targetAz = window.currentAz = ang.azimuth;
			window.targetPolar = window.currentPolar = ang.polar;
			window.targetRadius = window.currentRadius = ang.radius;
			
			// Also update the local variables in the main script
			if (window.updateSphericalCoords) {
				window.updateSphericalCoords(ang.azimuth, ang.polar, ang.radius);
			}
		}
	}

	// Method to be called when camera changes
	onCameraChange(newActiveHome) {
		this.activeHome = newActiveHome;
		this.updateUI();
	}

	// Toggle debug UI visibility
	toggle() {
		if (this.debugContainer) {
			this.isVisible = !this.isVisible;
			this.debugContainer.style.display = this.isVisible ? 'block' : 'none';
		}
	}

	// Show debug UI
	show() {
		if (this.debugContainer) {
			this.isVisible = true;
			this.debugContainer.style.display = 'block';
		}
	}

	// Hide debug UI
	hide() {
		if (this.debugContainer) {
			this.isVisible = false;
			this.debugContainer.style.display = 'none';
		}
	}
}
