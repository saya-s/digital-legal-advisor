import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { scrollToSection } from "../../utils/sectionNavigation";
import AudienceSection from "./sections/AudienceSection";
import Features from "./sections/Features";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    scrollToSection(location.hash.replace("#", ""));
  }, [location.hash]);

  return (
    <MainLayout>
      <Hero />
      <AudienceSection />
      <HowItWorks />
      <Features />
    </MainLayout>
  );
}
