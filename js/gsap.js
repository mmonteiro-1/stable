const gsapText = gsap.utils.toArray('.gsap_text');

gsapText.forEach((gsap_text, i) => {
	const anim = gsap.fromTo(gsap_text, {opacity: 0, y: 20}, {duration: 1, opacity: 1, y: 0});
	ScrollTrigger.create({
		trigger: gsap_text,
		start: "top 85%",
		animation: anim,
		toggleActions: 'play none none none',
		once: true,
	});
});


const gsapImage = gsap.utils.toArray('.gsap_image');

gsapImage.forEach((gsap_image, i) => {
	const anim = gsap.fromTo(gsap_image, {opacity: 0, y: 20}, {duration: 1, delay: 0.5, opacity: 1, y: 0});
	ScrollTrigger.create({
		trigger: gsap_image,
		start: "top 100%",
		animation: anim,
		toggleActions: 'play none none none',
		once: true,
	});
});


gsap.to(".dictionary", {
	yPercent: -50, 
	ease: "none",
	scrollTrigger: {
		trigger: ".project-hero",
		start: "top bottom",
		end: "bottom center",
		scrub: true,
	}
});


//change nav color
$(window).on('load', function() {
	var $nav = $('nav');
	var $navLinks = $('nav > a');
	var $logo = $('.logo > img');
	var heroBottom;

	function updateNav() {
		// pick whichever hero exists (.project-hero or .hero)
		var $hero = $('.project-hero, .hero').first();

		if ($hero.length) {
			heroBottom = $hero.offset().top + $hero.outerHeight();
		} else {
			heroBottom = 0; // fallback if no hero found
		}

		var scrollPosition = $(window).scrollTop();

		if (scrollPosition >= heroBottom - 60) {
			$nav.addClass('inverted');
		} else {
			$nav.removeClass('inverted');
			/* $navLinks.css('color', '#fff');
			   $logo.attr('src', 'images/logo_stable_white.svg'); */
		}
	}

	$(window).on('scroll', updateNav);
	$(window).on('resize', updateNav);
	updateNav(); // run once on load
});
