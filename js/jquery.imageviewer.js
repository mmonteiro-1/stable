function imageviewer(selector = '.image > img, .tile > img') {
	$(document).on('click', selector, function() {
		const imageLink = $(this).attr('src');

		if ($('#imageviewer-wrapper').length) return;

		$('body').css('overflow', 'hidden').append(`
			<div id="imageviewer-wrapper">
				<img id="imageviewer-image" src="${imageLink}">
				<div id="imageviewer-close"></div>
			</div>
		`);
		$('#imageviewer-image, #imageviewer-close').on('click', function() {
			$('#imageviewer-wrapper').remove();
			$('body').css('overflow', '');
		});
	});
}
