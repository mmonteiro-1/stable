// CUSTOM GSAP SMOOTH SCROLL + PARALLAX
gsap.registerPlugin(ScrollTrigger);

const wrapper = document.querySelector(".smooth-wrapper");
const content = document.querySelector(".smooth-content");

ScrollTrigger.matchMedia({
	"(min-width: 801px)": function () {

		// ---------- SMOOTH SCROLL ----------
		function setHeight() {
			document.body.style.height = content.getBoundingClientRect().height + "px";
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

		// Smooth scroll logic (lerp)
		let scrollY = 0;
		let targetY = 0;
		const ease = 0.1; // lower = smoother

		gsap.ticker.add(() => {
			targetY = window.scrollY;
			scrollY += (targetY - scrollY) * ease;

			gsap.set(content, { y: -scrollY });
			ScrollTrigger.update(); // keep ST in sync
		});

		// Refresh on load/resize/image load
		function refreshHeight() {
			setHeight();
			ScrollTrigger.refresh();
		}

		window.addEventListener("resize", refreshHeight);
		window.addEventListener("load", () => {
			refreshHeight();
			setTimeout(refreshHeight, 500);
			setTimeout(refreshHeight, 1500);
			document.querySelectorAll("img").forEach(img => {
				img.addEventListener("load", refreshHeight);
			});
		});

		/* // ---------- HERO PARALLAX ----------
		gsap.to(".hero-logo", {
			yPercent: -600,
			ease: "none",
			scrollTrigger: {
				trigger: ".hero",
				start: "top top",
				end: "bottom top",
				scrub: true,
				scroller: wrapper
			}
		}); */

		gsap.to(".project-hero > .dictionary", {
			yPercent: -300,
			ease: "none",
			scrollTrigger: {
				trigger: ".hero",
				start: "top top",
				end: "bottom top",
				scrub: true,
				scroller: wrapper
			}
		});
	}
});

// ---------- SUGGESTS OTHER PROJECTS RANDOM ----------
$.get("project_gallery.html", function(data) {
	var $loaded = $(data);
	var $projects = $loaded.find(".other_projects").addBack(".other_projects");

	// Current page
	var currentPage = window.location.pathname.split("/").pop();

	// Filter out current
	$projects = $projects.filter(function() {
		var href = $(this).attr("href");
		return href !== currentPage;
	});

	// Shuffle
	var projectsArray = $projects.toArray();
	for (let i = projectsArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[projectsArray[i], projectsArray[j]] = [projectsArray[j], projectsArray[i]];
	}

	// Take 5
	var $selected = $(projectsArray.slice(0, 5));
	$(".row_other_projects").empty().append($selected);
});

// ---------- CHANGE NAV COLOR + TOGGLE LOGO ----------
$(window).on('load', function() {
	var $nav = $('nav');
	var $logo = $('nav .logo');
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
			
			// only on index page: show logo
			if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
				$logo.addClass("visible");
			}
		} else {
			$nav.removeClass('inverted');

			// only on index page: hide logo
			if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
				$logo.removeClass("visible");
			}
		}
	}

	$(window).on('scroll resize', updateNav);
	updateNav();
});

