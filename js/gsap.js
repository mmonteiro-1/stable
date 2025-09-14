// CUSTOM GSAP SMOOTH SCROLL
gsap.registerPlugin(ScrollTrigger);

const wrapper = document.querySelector(".smooth-wrapper");
const content = document.querySelector(".smooth-content");

function setHeight() {
	const contentHeight = content.getBoundingClientRect().height;
	document.body.style.height = contentHeight + "px";
}

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

// Keep refreshing height
function refreshHeight() {
	setHeight();
	ScrollTrigger.refresh();
}

// On load, resize, image load
$(window).on("load", function () {
	refreshHeight();

	// Run multiple refreshes after load
	setTimeout(refreshHeight, 500);
	setTimeout(refreshHeight, 1500);

	// Also watch images
	$("img").on("load", refreshHeight);
});

// Resize handler
window.addEventListener("resize", refreshHeight);

// Final safety net: run several times via rAF
let rafRuns = 0;
function rafFix() {
	if (rafRuns < 30) { // ~0.5s at 60fps
		refreshHeight();
		rafRuns++;
		requestAnimationFrame(rafFix);
	}
}
requestAnimationFrame(rafFix);

// FADE OUT ON LINK CLICK
/*$(document).on("click", "a[href]", function (e) {
	e.preventDefault();
	const url = $(this).attr("href");

	if (url && url !== "#") {
		$("body").fadeOut(500, function () {
			window.location.href = url;
		});
	}
});*/


//HOMEPAGE HERO PARALLAX
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.matchMedia({
	"(min-width: 801px)": function () {
		gsap.to(".hero > .title", {
			yPercent: -300,
			ease: "none",
			scrollTrigger: {
				trigger: ".hero",
				start: "top 60px",
				end: "center center",
				scrub: 1,
			}
		});
	}
});

// PROJECTS PAGE HERO PARALLAX
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.matchMedia({
	"(min-width: 801px)": function () {
		gsap.to(".project-hero > .dictionary", {
			yPercent: -300,
			ease: "none",
			scrollTrigger: {
				trigger: ".hero",
				start: "top 60px",
				end: "center center",
				scrub: 1,
			}
		});
	}
});

// SUGGESTS OTHER PROJECTS RANDOM
$.get("project_gallery.html", function(data) {
	var $loaded = $(data);
	var $projects = $loaded.find(".other_projects").addBack(".other_projects");

	// Get the current page's file name
	var currentPage = window.location.pathname.split("/").pop();

	// Filter out the project that matches the current page
	$projects = $projects.filter(function() {
		return $(this).data("link") !== currentPage;
	});

	// Convert to array for Fisher–Yates shuffle
	var projectsArray = $projects.toArray();

	for (let i = projectsArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[projectsArray[i], projectsArray[j]] = [projectsArray[j], projectsArray[i]];
	}

	// Take 5 random ones
	var $selected = $(projectsArray.slice(0, 5));

	$(".row_other_projects").empty().append($selected);
});


//CHANGE NAV COLOR WHEN BELOW HERO
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
