function imageviewer(selector = 'img')
{
	selector = $(selector);

	selector.click(function() {
		
		let imageLink = $(this).attr('src');

		if (imageLink === '') return console.warn('[ImageViewer] Invalid link to image');

		$('<div>', {
			id:    'imageviewer-wrapper',
			css: {
				position:        'fixed',
				top:             '0',
				left:            '0',
				zIndex:          '99999',
				display:         'flex',
				justifyContent:  'center',
				alignItems:      'center',
				width:           '100vw',
				height:          '100vh',
				backgroundColor: '#f2f2f2',
			},
			append: $('<img>', {
				id:  'imageviewer-image',
				css: {
					maxHeight : '100vh',
					maxWidth : '100vw',
				},
				src: imageLink,
			}).add($('<div>', {
				id:  'imageviewer-close',
				css: {
					position:           'fixed',
					top:                '0',
					right:              '0',
					zIndex:             '100000',
					width:              '100vw',
					height:             '100vh',
					cursor:             'zoom-out',
					translation:        '0.5s ease',
				},
				on: {
					click: function(event) {
						$('#imageviewer-wrapper').remove();
					}
				}
			})),
		}).appendTo('body');

	});
}