import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { scrollToSection } from "../../utils/sectionNavigation";
import AudienceSection from "./sections/AudienceSection";
import Features from "./sections/Features";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";

// This page combines all sections of the public home page.
export default function Landing() {
  const location = useLocation(); //uselocation hook to access the current URL location

  // Scroll again when the website address points to a different section.
  useEffect(() => {
    // If the URL has a section id, scroll there.
    if (!location.hash) return;

    scrollToSection(location.hash.replace("#", ""));
  }, [location.hash]);

  return (
    <MainLayout>
      {/* Home page sections. */}
      {/* Keeping sections separate makes each landing-page area easier to edit. */}
      <Hero />
      <AudienceSection />
      <HowItWorks />
      <Features />
    </MainLayout>
  );
}
