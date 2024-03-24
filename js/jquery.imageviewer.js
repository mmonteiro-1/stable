function imageviewer(selector = 'img') {
    $(document).on('click', selector, function() {
        let imageLink = $(this).attr('src');

        if (!imageLink) {
            console.warn('[ImageViewer] Invalid link to image');
            return;
        }

        // Check if the image viewer already exists
        if ($('#imageviewer-wrapper').length > 0) {
            return; // If it exists, do nothing
        }

        // Prevent scrolling of parent div
        $('body').css('overflow', 'hidden');

        $('<div>', {
            id: 'imageviewer-wrapper',
            css: {
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
                backgroundColor: '#232323',
                overflow: 'auto',
            },
            append: $('<img>', {
                id: 'imageviewer-image',
                css: {
                    cursor: 'zoom-in',
                    maxHeight: '90vh', // Adjusted to leave space for close button
                    maxWidth: '90vw', // Adjusted to leave space for close button
                },
                src: imageLink,
                on: {
                    click: function(event) {
                        $(this).toggleClass('expanded');
                    }
                }
            }),
        }).append(
            $('<div>', {
                id: 'imageviewer-close',
                css: {
                    position: 'fixed',
                    top: '20px', // Adjusted for space from top
                    right: '20px', // Adjusted for space from right
                    zIndex: 100000,
                    cursor: 'pointer',
                    padding: '20px',
                    backgroundColor: 'white',
                    backgroundImage: 'url(images/icon_close.png)',
                    backgroundSize: '20px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: '50%',
                },
                on: {
                    click: function(event) {
                        $('#imageviewer-wrapper').remove();
                        $('body').css('overflow', ''); // Re-enable scrolling of parent div
                    }
                }
            })
        ).appendTo('body');
    });
}
