import Lenis from "@studio-freight/lenis";

import AOS from "aos";
import "aos/dist/aos.css";

AOS.init();

// Initialize Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: "vertical",
  gestureDirection: "vertical",
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: true,
  touchMultiplier: 2,
  infinite: false,
});

// Request animation frame for smooth scrolling
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Initialize AOS animations
if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 800,
    easing: "ease",
    once: false,
    mirror: false,
    anchorPlacement: "top-bottom",
  });
}

lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
  const parallaxElements = document.querySelectorAll(".parallax");
  parallaxElements.forEach((element) => {
    const speed = element.dataset.speed || 0.2;
    const yPos = -scroll * speed;
    element.style.transform = `translateY(${yPos}px)`;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  if (typeof AOS !== "undefined") {
    AOS.refresh();
  }
});
