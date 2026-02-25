function imageviewer(selector = '.image > img, .tile > img') {
	let currentIndex = 0;
	let images = [];
	let isZoomed = false;

	$(document).on('click', selector, function() {
		// Get all images matching the selector
		images = $(selector).toArray();
		currentIndex = images.indexOf(this);
		
		if ($('#imageviewer-wrapper').length) return;
		
		showImage(currentIndex);
	});

	function showImage(index) {
		const imageLink = $(images[index]).attr('src');
		isZoomed = false;
		
		// Remove existing viewer if present
		$('#imageviewer-wrapper').remove();
		
		$('body').css('overflow', 'hidden').css('background', '#232323').append(`
			<div id="imageviewer-wrapper">
				<img id="imageviewer-image" src="${imageLink}">
				<div id="imageviewer-close"></div>
				${images.length > 1 ? `
					<div id="imageviewer-prev" class="imageviewer-arrow"></div>
					<div id="imageviewer-next" class="imageviewer-arrow"></div>
				` : ''}
			</div>
		`);

		const $image = $('#imageviewer-image');
		const $wrapper = $('#imageviewer-wrapper');
		
		// Set initial cursor to zoom-in
		$image.css('cursor', 'zoom-in');

		// Close viewer
		$('#imageviewer-close').on('click', function(e) {
			e.stopPropagation();
			$('#imageviewer-wrapper').remove();
			$('body').css('overflow', '').css('background', '#f2f2f2');
			$(document).off('keydown.imageviewer');
		});

		// Zoom functionality
		$image.on('click', function(e) {
			e.stopPropagation();
			
			if (!isZoomed) {
				// Zoom in to native size
				$(this).css({
					'object-fit': 'none',
					'cursor': 'zoom-out',
					'width': 'auto',
					'height': 'auto'
				});
				isZoomed = true;
			} else {
				// Zoom out to fit screen
				$(this).css({
					'object-fit': 'contain',
					'cursor': 'zoom-in',
					'width': '100%',
					'height': '100%'
				});
				// Reset scroll position
				$wrapper.scrollTop(0).scrollLeft(0);
				isZoomed = false;
			}
		});

		// Previous image
		$('#imageviewer-prev').on('click', function(e) {
			e.stopPropagation();
			currentIndex = (currentIndex - 1 + images.length) % images.length;
			showImage(currentIndex);
		});

		// Next image
		$('#imageviewer-next').on('click', function(e) {
			e.stopPropagation();
			currentIndex = (currentIndex + 1) % images.length;
			showImage(currentIndex);
		});

		// Keyboard navigation
		$(document).off('keydown.imageviewer').on('keydown.imageviewer', function(e) {
			if (e.key === 'ArrowLeft' && images.length > 1) {
				currentIndex = (currentIndex - 1 + images.length) % images.length;
				showImage(currentIndex);
			} else if (e.key === 'ArrowRight' && images.length > 1) {
				currentIndex = (currentIndex + 1) % images.length;
				showImage(currentIndex);
			} else if (e.key === 'Escape') {
				$('#imageviewer-wrapper').remove();
				$('body').css('overflow', '').css('background', '#f2f2f2');
				$(document).off('keydown.imageviewer');
			}
		});
	}
}
