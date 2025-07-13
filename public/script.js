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
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  gestureDirection: "vertical",
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on("scroll", () => {
  const elements = document.querySelectorAll(".parallax");
  elements.forEach((el) => {
    const speed = el.dataset.speed || 0.2;
    el.style.transform = `translateY(${-lenis.scroll * speed}px)`;
  });
});
