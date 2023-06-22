// scroll animations
gsap.registerPlugin(ScrollTrigger);
let tl = gsap.timeline();


gsap.from(".playground_title", {
	opacity: 0, 
	y: 20, 
	duration: 0.5,
	delay: 0.5
});

gsap.from(".playground_subtitle", {
	opacity: 0, 
	y: 20, 
	duration: 0.5,
	delay: 0.7
});

gsap.from(".playground", {
	opacity: 0,
	delay: 0.2
});








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