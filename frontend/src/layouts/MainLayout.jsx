import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A2035] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20">{children}</main>

      <Footer />
    </div>
  );
}
