import Lenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.39/dist/lenis.mjs";
import AOS from "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";

// Initialize smooth scrolling with Lenis
const lenis = new Lenis({
  lerp: 0.05,
  wheelMultiplier: 1.2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Initialize Animate On Scroll (AOS)
document.addEventListener("DOMContentLoaded", function () {
  AOS.init({
    duration: 1200,
    once: false,
    delay: 100,
    mirror: true,
  });
  
  // Clean initialization refresh
  setTimeout(() => {
    AOS.refresh();
  }, 100);
});
