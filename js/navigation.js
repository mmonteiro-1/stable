// CUSTOM GSAP SMOOTH SCROLL + PARALLAX
gsap.registerPlugin(ScrollTrigger);

const wrapper = document.querySelector(".smooth-wrapper");
const content = document.querySelector(".smooth-content");

const mm = gsap.matchMedia();

mm.add("(min-width: 801px)", () => {
	if (!wrapper || !content) return;

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
	const ease = 0.1;

	const ticker = () => {
		targetY = window.scrollY;
		scrollY += (targetY - scrollY) * ease;
		gsap.set(content, { y: -scrollY });
		ScrollTrigger.update();
	};
	gsap.ticker.add(ticker);

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

	// Cleanup when breakpoint no longer matches
	return () => {
		gsap.ticker.remove(ticker);
	};
});

// ---------- SUGGESTS OTHER PROJECTS RANDOM ----------
fetch("projects.json")
	.then(r => r.json())
	.then(projects => {
		const currentPage = window.location.pathname.split("/").pop();
		const filtered = projects.filter(p => p.href !== currentPage);

		// Shuffle
		for (let i = filtered.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[filtered[i], filtered[j]] = [filtered[j], filtered[i]];
		}

		const container = document.querySelector(".row_other_projects");
		if (!container) return;

		container.innerHTML = filtered.slice(0, 5).map(p => `
			<a class="other_projects flip-click" href="${p.href}">
				<img src="${p.img}" alt="${p.label}">
				<div>
					<div class="flip-mask">
						<div class="default-text">${p.label} →</div>
					</div>
				</div>
			</a>
		`).join("");
	});

// ---------- CHANGE NAV COLOR + TOGGLE LOGO ----------
window.addEventListener("load", () => {
	const nav = document.querySelector("nav");
	const logo = document.querySelector("nav .logo");
	const isIndex = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

	function updateNav() {
		const hero = document.querySelector(".project-hero, .hero");
		let heroBottom = 0;
		if (hero) {
			heroBottom = hero.getBoundingClientRect().bottom + window.scrollY - 60;
		}

		if (window.scrollY >= heroBottom) {
			nav.classList.add("inverted");
			if (isIndex && logo) logo.classList.add("visible");
		} else {
			nav.classList.remove("inverted");
			if (isIndex && logo) logo.classList.remove("visible");
		}
	}

	window.addEventListener("scroll", updateNav);
	window.addEventListener("resize", updateNav);
	updateNav();
});
