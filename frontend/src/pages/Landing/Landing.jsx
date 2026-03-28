import MainLayout from "../../layouts/MainLayout";
import Hero from "./sections/Hero";
import Features from "./sections/Features";

export default function Landing() {
  return (
    <MainLayout>
      <Hero />
      <Features />
    </MainLayout>
  );
}