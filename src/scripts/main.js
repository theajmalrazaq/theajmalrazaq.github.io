import Lenis from "lenis";
import AOS from "aos";
import "aos/dist/aos.css";

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
