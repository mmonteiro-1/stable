function imageviewer(selector = '.image > img, .tile > img') {
	let currentIndex = 0;
	let images = [];

	$(document).on('click', selector, function() {
		// Get all images matching the selector
		images = $(selector).toArray();
		currentIndex = images.indexOf(this);
		
		if ($('#imageviewer-wrapper').length) return;
		
		showImage(currentIndex);
	});

	function showImage(index) {
		const imageLink = $(images[index]).attr('src');
		
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

		// Close viewer
		$('#imageviewer-image, #imageviewer-close').on('click', function() {
			$('#imageviewer-wrapper').remove();
			$('body').css('overflow', '').css('background', '#f2f2f2');
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
	}
}
