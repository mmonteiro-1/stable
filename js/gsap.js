//Redirect data-link
$("[data-link]").on("click", function() {
	const url = $(this).data("link");
	if (url) {
		$("body").fadeOut(500, function() {
			window.location.href = url;
		});
	}
});

// Custom GSAP smooth scroll
gsap.registerPlugin(ScrollTrigger);

const wrapper = document.querySelector(".smooth-wrapper");
const content = document.querySelector(".smooth-content");

let contentHeight;

function setHeight() {
	contentHeight = content.getBoundingClientRect().height;
	document.body.style.height = contentHeight + "px";
}

// Initial setup
setHeight();
window.addEventListener("resize", setHeight);

// Scroller proxy
ScrollTrigger.scrollerProxy(wrapper, {
	scrollTop(value) {
		if (arguments.length) {
			window.scrollTo(0, value);
		}
		return window.scrollY;
	},
	getBoundingClientRect() {
		return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
	}
});

// Smooth effect
gsap.ticker.add(() => {
	gsap.to(content, {
		y: -window.scrollY,
		ease: "power3.out",
		duration: 1,
		overwrite: true
	});
});

// Refresh on load
ScrollTrigger.addEventListener("refresh", setHeight);
ScrollTrigger.refresh();











// DICTIONARY HERO PARALLAX
const dictionaries = gsap.utils.toArray(".dictionary:not(.stable)");

// store the target scroll progress
let scrollTarget = 0;
let proxyScroll = 0;

// update target on scroll
wrapper.addEventListener("scroll", () => {
	scrollTarget = wrapper.scrollTop;
});

// smooth update loop
gsap.ticker.add(() => {
	// interpolate proxyScroll towards scrollTarget
	proxyScroll += (scrollTarget - proxyScroll) * 0.1; // tweak 0.1 for smoothing

	dictionaries.forEach(el => {
		// calculate the scroll progress relative to trigger element
		const trigger = el.closest(".project-hero");
		if (!trigger) return;

		const triggerRect = trigger.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		// compute progress 0 → 1 as trigger enters/leaves viewport
		let progress = 1 - (triggerRect.bottom / viewportHeight);
		progress = Math.min(Math.max(progress, 0), 1); // clamp

		// apply GSAP smooth transform
		gsap.to(el, {
			yPercent: -50 * progress,
			duration: 0.2,
			ease: "power1.out",
			overwrite: true
		});
	});
});











// const gsapText = gsap.utils.toArray('.gsap_text');

// gsapText.forEach((gsap_text, i) => {
// 	const anim = gsap.fromTo(gsap_text, {opacity: 0, y: 20}, {duration: 1, opacity: 1, y: 0});
// 	ScrollTrigger.create({
// 		trigger: gsap_text,
// 		start: "top 85%",
// 		animation: anim,
// 		toggleActions: 'play none none none',
// 		once: true,
// 	});
// });


// const gsapImage = gsap.utils.toArray('.gsap_image');

// gsapImage.forEach((gsap_image, i) => {
// 	const anim = gsap.fromTo(gsap_image, {opacity: 0, y: 20}, {duration: 1, delay: 0.5, opacity: 1, y: 0});
// 	ScrollTrigger.create({
// 		trigger: gsap_image,
// 		start: "top 100%",
// 		animation: anim,
// 		toggleActions: 'play none none none',
// 		once: true,
// 	});
// });


// gsap.to(".dictionary:not(.stable)", {
// 	yPercent: -50, 
// 	ease: "none",
// 	scrollTrigger: {
// 		trigger: ".project-hero",
// 		start: "top bottom",
// 		end: "bottom center",
// 		scrub: true,
// 	}
// });






















//change nav color
$(window).on('load', function() {
	var $nav = $('nav');
	var $navLinks = $('nav > a');
	var $logo = $('.logo > img');
	var heroBottom;

	function updateNav() {
		var $hero = $('.project-hero, .hero').first();

		if ($hero.length) {
			heroBottom = $hero.offset().top + $hero.outerHeight();
		} else {
			heroBottom = 0;
		}

		var scrollPosition = $(window).scrollTop();

		if (scrollPosition >= heroBottom - 60) {
			$nav.addClass('inverted');
		} else {
			$nav.removeClass('inverted');
		}
	}

	$(window).on('scroll', updateNav);
	$(window).on('resize', updateNav);
	updateNav(); // run once on load
});
