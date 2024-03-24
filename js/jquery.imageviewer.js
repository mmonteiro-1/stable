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
                backgroundColor: '#f2f2f2',
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
                        $(this).css({ maxHeight: 'unset', maxWidth: 'unset', cursor: 'grabbing' });
                    },
                    load: function(event) {
                        $(this).css({ cursor: 'grab' });
                        $(this).draggable(); // Make the image draggable
                    }
                }
            }),
        }).append(
            $('<div>', {
                id: 'imageviewer-close',
                css: {
                    position: 'absolute',
                    top: '10px', // Adjusted for space from top
                    right: '10px', // Adjusted for space from right
                    zIndex: 100000,
                    cursor: 'pointer',
                    padding: '5px 10px',
                    backgroundColor: '#fff',
                    borderRadius: '5px',
                    boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
                },
                text: 'Close',
                on: {
                    click: function(event) {
                        $('#imageviewer-wrapper').remove();
                    }
                }
            })
        ).appendTo('body');
    });
}
