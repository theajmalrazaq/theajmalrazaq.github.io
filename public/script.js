import Lenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.39/dist/lenis.mjs";
import AOS from "https://cdn.jsdelivr.net/npm/aos@2.3.4/+esm";

// Cursor Tracker
const cursorTracker = document.getElementById("cursor-tracker");
let mouseX = 0;
let mouseY = 0;
let trackerX = 0;
let trackerY = 0;
let cursoricon = cursorTracker.querySelector("#cursor-icon");

document.querySelectorAll("a, button, img").forEach((element) => {
  element.addEventListener("mouseenter", () => {
    if (cursorTracker) {
      cursoricon.classList.add("invert");
    }
  });

  element.addEventListener("mouseleave", () => {
    if (cursorTracker) {
      cursoricon.classList.remove("invert");
    }
  });
});

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  // Add smooth movement with lerp (linear interpolation)
  const speed = 0.55;
  trackerX += (mouseX - trackerX) * speed;
  trackerY += (mouseY - trackerY) * speed;

  if (cursorTracker) {
    cursorTracker.style.left = `${trackerX}px`;
    cursorTracker.style.top = `${trackerY}px`;
  }

  requestAnimationFrame(animateCursor);
}

animateCursor();

const lenis = new Lenis({
  lerp: 0.05,
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
    "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(73, 69, 118, 0.1) 0%, rgba(73, 69, 118, 0.01) 50%)";
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
      
      setTimeout(() => {
        loadingOverlay.style.display = "none";
        document.body.style.overflow = "auto";
        window.scrollTo(0, 0);
        
        // Initialize AOS after loading overlay disappears and content is visible
        AOS.init({
          duration: 800,
          once: false,
          delay: 100,
          mirror: true,
        });
        
        // Force AOS to refresh and detect elements
        setTimeout(() => {
          AOS.refresh();
        }, 100);
        
      }, 500);

      // Initialize clock for timezone card
      const localTimeElement = document.getElementById("local-time");
      if (localTimeElement) {
        updateClock();
      }
    }, 1500);
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
        t.classList.add("bg-accent");
        t.classList.remove("bg-transparent");
      } else {
        t.classList.remove("bg-accent");
        t.classList.add("bg-transparent");
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
}


// Blog-specific functionality
function initializeBlogPage() {
  // Search functionality
  const searchInput = document.getElementById("search-input");
  const blogItems = document.querySelectorAll(".blog-card");
  const noResultsMessage = document.getElementById("no-results-message");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      let hasResults = false;

      blogItems.forEach((item) => {
        const title = item.querySelector("h2").textContent.toLowerCase();
        const excerpt = item.querySelector("p").textContent.toLowerCase();

        if (title.includes(searchTerm) || excerpt.includes(searchTerm)) {
          item.style.display = "block";
          hasResults = true;
        } else {
          item.style.display = "none";
        }
      });

      // Show or hide the no results message
      if (hasResults || searchTerm === "") {
        noResultsMessage.classList.add("hidden");
      } else {
        noResultsMessage.classList.remove("hidden");
      }
      
      // Reset pagination when searching
      resetPagination();
    });
  }

  // Filter functionality
  const filterAll = document.getElementById("filter-all");
  const filterTags = document.querySelectorAll(".filter-tag");

  if (filterAll && filterTags.length > 0) {
    filterAll.addEventListener("click", () => {
      setActiveFilterButton(filterAll);
      showAllBlogItems();
    });

    filterTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        setActiveFilterButton(tag);
        filterblogByTag(tag.dataset.tag);
      });
    });

    function setActiveFilterButton(button) {
      [filterAll, ...filterTags].forEach((btn) => {
        btn.classList.add("bg-accent");
        btn.classList.remove(
          "bg-accent",
          "text-white"
        );
      });
      button.classList.remove("bg-accent");
      button.classList.add(
        "bg-accent",
        "text-white"
      );
    }




    function showAllBlogItems() {
      blogItems.forEach((item) => {
        item.style.display = "block";
      });
      noResultsMessage.classList.add("hidden");
      resetPagination();
      hideExtraPosts();
    }

    function filterblogByTag(tag) {
      let hasResults = false;

      blogItems.forEach((item) => {
        // Get tags from data attribute
        const tagsText = item.dataset.tags || "";
        const tags = tagsText.split(",").map((t) => t.trim());

        if (tags.includes(tag)) {
          item.style.display = "block";
          hasResults = true;
        } else {
          item.style.display = "none";
        }
      });

      // Show or hide the no results message for tag filtering
      if (hasResults) {
        noResultsMessage.classList.add("hidden");
      } else {
        noResultsMessage.classList.remove("hidden");
      }
      
      resetPagination();
    }
  }

  // Load More functionality
  const loadMoreBtn = document.getElementById("load-more-btn");
  const loadingIndicator = document.getElementById("loading-indicator");
  const endOfPosts = document.getElementById("end-of-posts");
  const blogPostsContainer = document.getElementById("blog-posts-container");
  
  // Configuration for pagination
  let currentOffset = 0;
  const postsPerPage = 6; // Adjust this based on your needs
  let allPosts = []; // Will store all blog posts
  let isLoading = false;

  // Initialize load more functionality
  if (loadMoreBtn && blogPostsContainer) {
    // Store initial posts
    allPosts = Array.from(blogItems);
    
    // Show load more button if there are more than postsPerPage posts
    if (allPosts.length > postsPerPage) {
      // Hide posts beyond the initial load
      hideExtraPosts();
      loadMoreBtn.classList.remove("hidden");
    }

    loadMoreBtn.addEventListener("click", loadMorePosts);
  }

  function hideExtraPosts() {
    allPosts.forEach((post, index) => {
      if (index >= postsPerPage) {
        post.style.display = "none";
      }
    });
    currentOffset = postsPerPage;
  }

  function loadMorePosts() {
    if (isLoading) return;
    
    isLoading = true;
    loadMoreBtn.classList.add("hidden");
    loadingIndicator.classList.remove("hidden");

    // Simulate loading delay (remove this in production if fetching from API)
    setTimeout(() => {
      const nextPosts = allPosts.slice(currentOffset, currentOffset + postsPerPage);
      
      nextPosts.forEach((post, index) => {
        setTimeout(() => {
          post.style.display = "block";
          // Trigger AOS animation for newly shown posts
          if (typeof AOS !== 'undefined') {
            AOS.refresh();
          }
        }, index * 100); // Stagger the appearance
      });

      currentOffset += postsPerPage;
      
      // Check if there are more posts to load
      setTimeout(() => {
        loadingIndicator.classList.add("hidden");
        
        if (currentOffset >= allPosts.length) {
          // No more posts to load
          endOfPosts.classList.remove("hidden");
        } else {
          // More posts available
          loadMoreBtn.classList.remove("hidden");
        }
        
        isLoading = false;
      }, 800);
    }, 1000);
  }

  // Reset pagination when filtering
  function resetPagination() {
    currentOffset = 0;
    loadMoreBtn.classList.add("hidden");
    loadingIndicator.classList.add("hidden");
    endOfPosts.classList.add("hidden");
    
    // Show appropriate posts based on current filter
    const visiblePosts = allPosts.filter(post => post.style.display !== "none");
    if (visiblePosts.length > postsPerPage) {
      loadMoreBtn.classList.remove("hidden");
    }
  }
}

// Check if we're on the blog page and initialize blog functionality
if (window.location.pathname === '/blog' || window.location.pathname.includes('/blog')) {
  document.addEventListener("DOMContentLoaded", initializeBlogPage);
}

// Email Copy Functionality
document.addEventListener("DOMContentLoaded", () => {
  const emailCopyBtn = document.getElementById("email-copy-btn");
  const copySuccess = document.getElementById("copy-success");
  const emailText = "theajmalrazaq@gmail.com";

  if (emailCopyBtn && copySuccess) {
    emailCopyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(emailText);
        
        // Show success message with enhanced animation
        copySuccess.style.opacity = "1";
        copySuccess.style.transform = "translate(-50%, -10px) scale(1)";
        
        // Add bounce effect to button
        emailCopyBtn.style.transform = "scale(0.95)";
        
        setTimeout(() => {
          emailCopyBtn.style.transform = "scale(1)";
        }, 150);
        
        // Hide success message after 2.5 seconds
        setTimeout(() => {
          copySuccess.style.opacity = "0";
          copySuccess.style.transform = "translate(-50%, 0) scale(0.95)";
        }, 2500);
        
      } catch (err) {
        console.error("Failed to copy email: ", err);
        
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = emailText;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand("copy");
          copySuccess.style.opacity = "1";
          copySuccess.innerHTML = "✓ Copied!";
          
          setTimeout(() => {
            copySuccess.style.opacity = "0";
            copySuccess.innerHTML = "✓ Copied to clipboard!";
          }, 2500);
        } catch (fallbackErr) {
          console.error("Fallback copy failed: ", fallbackErr);
        }
        
        document.body.removeChild(textArea);
      }
    });
  }
});
