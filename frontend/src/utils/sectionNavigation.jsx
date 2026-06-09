// These small helpers move the user to sections on the landing page.
// Scroll smoothly to one section by its id.
export function scrollToSection(id) {
  if (!id) return; //if we don't have an id, we can't scroll anywhere, so we just exit the function.

  // Wait for React to paint the target section before trying to scroll.
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start", //align the top of the section with the top of the viewport
    });
  });
}

// If we are already on the landing page, scroll there. If not, go there first.
export function navigateToSection({ id, location, navigate }) {
  // Build the #section part used by the browser URL.
  const targetHash = `#${id}`;

  if (location.pathname === "/" && location.hash === targetHash) { //
    scrollToSection(id);
    return;
  }

  // If another page is open, navigate home with the hash attached.
  navigate(`/${targetHash}`);
}
