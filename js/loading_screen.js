function initLoadingScreen(options = {}) {
	const totalDuration = options.duration || 300;
	const loadingScreen = document.getElementById('loading-screen');
	const progressFill = document.querySelector('.loading-progress-fill');
	
	if (!loadingScreen || !progressFill) {
		console.warn('Loading screen elements not found');
		return;
	}

	let pageLoaded = false;
	let fakeLoadingComplete = false;

	const milestones = [0, 25, 50, 75, 100];
	
	function generateRandomDurations() {
		const chunks = [];
		const minChunkDuration = 300;
		const maxChunkDuration = 1500;
		
		for (let i = 0; i < 4; i++) {
			const randomDuration = Math.random() * (maxChunkDuration - minChunkDuration) + minChunkDuration;
			chunks.push(randomDuration);
		}
		
		const sum = chunks.reduce((a, b) => a + b, 0);
		const normalizedChunks = chunks.map(chunk => (chunk / sum) * totalDuration);
		
		return normalizedChunks;
	}

	const chunkDurations = generateRandomDurations();
	let currentChunkIndex = 0;
	let chunkStartTime = Date.now();
	let currentProgress = 0;

	function easeOutQuad(t) {
		return t * (2 - t);
	}

	function hideLoadingScreen() {
		if (pageLoaded && fakeLoadingComplete) {
			loadingScreen.classList.add('fade-out');
			setTimeout(() => {
				loadingScreen.style.display = 'none';
				if (options.onComplete && typeof options.onComplete === 'function') {
					options.onComplete();
				}
			}, 500);
		}
	}

	window.addEventListener('load', function() {
		pageLoaded = true;
		hideLoadingScreen();
	});

	function updateProgress() {
		if (currentChunkIndex >= 4) {
			progressFill.style.width = '100%';
			fakeLoadingComplete = true;
			hideLoadingScreen();
			return;
		}

		const elapsed = Date.now() - chunkStartTime;
		const chunkDuration = chunkDurations[currentChunkIndex];
		const chunkProgress = Math.min(elapsed / chunkDuration, 1);
		const easedChunkProgress = easeOutQuad(chunkProgress);
		
		const startProgress = milestones[currentChunkIndex];
		const endProgress = milestones[currentChunkIndex + 1];
		currentProgress = startProgress + (endProgress - startProgress) * easedChunkProgress;
		
		progressFill.style.width = currentProgress + '%';

		if (chunkProgress >= 1) {
			currentChunkIndex++;
			chunkStartTime = Date.now();
		}

		requestAnimationFrame(updateProgress);
	}

	updateProgress();
}

initLoadingScreen();

