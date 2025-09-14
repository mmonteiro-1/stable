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
