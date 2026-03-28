import MainLayout from "../../layouts/MainLayout";
import Features from "./sections/Features";
import Hero from "./sections/Hero";
import HowItWorks from "./sections/HowItWorks";

export default function Landing() {
  return (
    <MainLayout>
      <Hero />
      <HowItWorks />
      <Features />
    </MainLayout>
  );
}
