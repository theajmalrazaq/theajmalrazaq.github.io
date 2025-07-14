import Lenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.39/dist/lenis.mjs";
import AOS from "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";

document.addEventListener("DOMContentLoaded", () => {
  AOS.init({
    duration: 800,
    easing: "ease",
    once: false,
    mirror: false,
    anchorPlacement: "top-bottom",
  });
});

const lenis = new Lenis({
  lerp: 0.08,
  wheelMultiplier: 1.2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
