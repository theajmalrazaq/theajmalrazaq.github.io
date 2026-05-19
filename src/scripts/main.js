import AOS from "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";

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
