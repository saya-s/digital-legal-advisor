export function scrollToSection(id) {
  if (!id) return;

  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function navigateToSection({ id, location, navigate }) {
  const targetHash = `#${id}`;

  if (location.pathname === "/" && location.hash === targetHash) {
    scrollToSection(id);
    return;
  }

  navigate(`/${targetHash}`);
}
