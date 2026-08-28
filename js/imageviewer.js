function imageviewer(selector = '.image > img, .tile > img') {
	let currentIndex = 0;
	let images = [];
	let isZoomed = false;

	document.addEventListener('click', function(e) {
		const target = e.target.closest(selector);
		if (!target) return;
		if (document.getElementById('imageviewer-wrapper')) return;
		images = Array.from(document.querySelectorAll(selector));
		currentIndex = images.indexOf(target);
		showImage(currentIndex);
	});

	function showImage(index) {
		const imageLink = images[index].getAttribute('src');
		isZoomed = false;

		const existing = document.getElementById('imageviewer-wrapper');
		if (existing) existing.remove();

		document.body.style.overflow = 'hidden';
		document.body.style.background = '#232323';

		const wrapper = document.createElement('div');
		wrapper.id = 'imageviewer-wrapper';
		wrapper.innerHTML = `
			<img id="imageviewer-image" src="${imageLink}">
			<div id="imageviewer-close"></div>
			${images.length > 1 ? `
				<div id="imageviewer-prev" class="imageviewer-arrow"></div>
				<div id="imageviewer-next" class="imageviewer-arrow"></div>
			` : ''}
		`;
		document.body.appendChild(wrapper);

		const img = document.getElementById('imageviewer-image');
		img.style.cursor = 'zoom-in';

		document.getElementById('imageviewer-close').addEventListener('click', function(e) {
			e.stopPropagation();
			closeViewer();
		});

		img.addEventListener('click', function(e) {
			e.stopPropagation();
			if (!isZoomed) {
				img.style.objectFit = 'none';
				img.style.cursor = 'zoom-out';
				img.style.width = 'auto';
				img.style.height = 'auto';
				isZoomed = true;
			} else {
				img.style.objectFit = 'contain';
				img.style.cursor = 'zoom-in';
				img.style.width = '100%';
				img.style.height = '100%';
				wrapper.scrollTop = 0;
				wrapper.scrollLeft = 0;
				isZoomed = false;
			}
		});

		const prevBtn = document.getElementById('imageviewer-prev');
		const nextBtn = document.getElementById('imageviewer-next');

		if (prevBtn) {
			prevBtn.addEventListener('click', function(e) {
				e.stopPropagation();
				currentIndex = (currentIndex - 1 + images.length) % images.length;
				showImage(currentIndex);
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', function(e) {
				e.stopPropagation();
				currentIndex = (currentIndex + 1) % images.length;
				showImage(currentIndex);
			});
		}

		document.removeEventListener('keydown', onKey);
		document.addEventListener('keydown', onKey);
	}

	function onKey(e) {
		if (e.key === 'ArrowLeft' && images.length > 1) {
			currentIndex = (currentIndex - 1 + images.length) % images.length;
			showImage(currentIndex);
		} else if (e.key === 'ArrowRight' && images.length > 1) {
			currentIndex = (currentIndex + 1) % images.length;
			showImage(currentIndex);
		} else if (e.key === 'Escape') {
			closeViewer();
		}
	}

	function closeViewer() {
		const wrapper = document.getElementById('imageviewer-wrapper');
		if (wrapper) wrapper.remove();
		document.body.style.overflow = '';
		document.body.style.background = '#f2f2f2';
		document.removeEventListener('keydown', onKey);
	}
}
