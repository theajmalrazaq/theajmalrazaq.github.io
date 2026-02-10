// Section perspective and focus effect - DISABLED
export function initSectionPerspective() {
  const sections = document.querySelectorAll('section[data-aos]');
  
  sections.forEach((section) => {
    // Reset all effects
    section.style.transform = 'none';
    section.style.opacity = '1';
    section.style.filter = 'none';
  });
}
