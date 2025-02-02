function imageviewer(selector = '.image > img') {
	$(document).on('click', selector, function() {
		const imageLink = $(this).attr('src');

		if ($('#imageviewer-wrapper').length) return;

		$('body').css('overflow', 'hidden').append(`
			<div id="imageviewer-wrapper">
				<img id="imageviewer-image" src="${imageLink}">
				<div id="imageviewer-close"></div>
				${window.innerWidth < 800 ? '<div id="imageviewer-text">Tap to expand</div>' : ''}
			</div>
		`);
		$('#imageviewer-image').on('click', function() {
			$(this).toggleClass('expanded');
			if (window.innerWidth < 800) {
				$('#imageviewer-text').text($(this).hasClass('expanded') ? 'Tap to contract' : 'Tap to expand');
			}
		});
		$('#imageviewer-close').on('click', function() {
			$('#imageviewer-wrapper').remove();
			$('body').css('overflow', '');
		});
	});
}
