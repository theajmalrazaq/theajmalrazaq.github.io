import Lenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.39/dist/lenis.mjs";
import AOS from "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";

const lenis = new Lenis({
  lerp: 0.08,
  wheelMultiplier: 1.2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Define bentoCards collection
const bentoCards = document.querySelectorAll(".pixel-card");

bentoCards.forEach((card) => {
  // Add shine effect element to each card
  const shine = document.createElement("div");
  shine.classList.add(
    "absolute",
    "inset-0",
    "pointer-events-none",
    "opacity-0"
  );
  shine.style.background =
    "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(73, 69, 118, 0.2) 0%, rgba(73, 69, 118, 0.02) 50%)";
  shine.style.transition = "opacity 0.3s ease";
  card.style.position = "relative";
  card.style.overflow = "hidden";
  card.appendChild(shine);

  // Scale and shadow effect on hover
  card.addEventListener("mouseenter", () => {
    card.style.transition = "all 0.3s ease-in-out";
    shine.style.opacity = "1";
  });

  card.addEventListener("mouseleave", () => {
    shine.style.opacity = "0";
  });

  // Track mouse position for shine effect
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--mouse-x", `${x}%`);
    card.style.setProperty("--mouse-y", `${y}%`);
  });
});

// Initialize real-time clock for the timezone card
window.updateClock = () => {
  const now = new Date();
  const localTimeElement = document.getElementById("local-time");
  if (localTimeElement) {
    localTimeElement.textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Update time progress bar (24-hour cycle)
    const timeProgress = document.getElementById("time-progress");
    if (timeProgress) {
      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      const percentage = (totalMinutes / (24 * 60)) * 100;
      timeProgress.style.width = `${percentage}%`;
    }

    // Update timezone badges
    const timezoneBadges = document.querySelectorAll(".timezone-badge");
    timezoneBadges.forEach((badge) => {
      const offset = parseFloat(badge.dataset.offset || 0);
      const localTime = new Date();
      const utcTime =
        localTime.getTime() + localTime.getTimezoneOffset() * 60000;
      const tzTime = new Date(utcTime + 3600000 * offset);

      const timeSpan = badge.querySelector(".timezone-time");
      if (timeSpan) {
        timeSpan.textContent = tzTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    });
  }
};

updateClock();
setInterval(updateClock, 60000);

document.addEventListener("DOMContentLoaded", function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  document.body.style.overflow = "hidden";
  if (loadingOverlay) {
    setTimeout(() => {
      loadingOverlay.style.display = "none";
      document.body.style.overflow = "auto";
      window.scrollTo(0, 0);
      AOS.init({
        duration: 800,
        easing: "ease",
        once: false,
        mirror: false,
      });

      // Initialize clock for timezone card
      const localTimeElement = document.getElementById("local-time");
      if (localTimeElement) {
        updateClock();
      }
    }, 1000);
  }
});

// Handle tab switching
const tabs = document.querySelectorAll("[data-tab]");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const tabId = tab.getAttribute("data-tab");

    // Update active tab styling
    tabs.forEach((t) => {
      if (t.getAttribute("data-tab") === tabId) {
        t.classList.add("shadow-accent", "bg-accent/10");
        t.classList.remove("bg-transparent", "shadow-accent-x");
      } else {
        t.classList.remove("shadow-accent", "bg-accent/10");
        t.classList.add("bg-transparent", "shadow-accent-x");
      }
    });

    // Show the selected project section and hide others
    document
      .querySelectorAll(
        "#selected_web_projects, #selected_ui_projects, #selected_graphics_projects"
      )
      .forEach((section) => {
        section.classList.add("hidden");
      });
    document.querySelector(`#${tabId}`).classList.remove("hidden");
  });
});

// Only initialize Lottie animations if LottieInteractivity is defined
if (typeof LottieInteractivity !== "undefined") {
  const firstLottieElement = document.querySelector("#firstLottie");
  if (firstLottieElement) {
    LottieInteractivity.create({
      player: "#firstLottie",
      mode: "scroll",
      actions: [
        {
          visibility: [0, 1],
          type: "seek",
          frames: [0, 70],
        },
      ],
    });
  }

  const lottie1Element = document.querySelector("#lottie-1");
  if (lottie1Element) {
    LottieInteractivity.create({
      player: "#lottie-1",
      mode: "scroll",
      actions: [
        {
          visibility: [0, 1],
          type: "seek",
          frames: [0, 100],
        },
      ],
    });
  }
}
