import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "How it Works", path: "/#how-it-works" },
    { name: "Templates", path: "/templates" },
    { name: "Find a Lawyer", path: "/lawyers" },
  ];

  const handleNavigate = (path) => {
    setIsOpen(false);

    if (path.startsWith("/#")) {
      const id = path.replace("/#", "");

      if (location.pathname === "/") {
        // If already on Home, just scroll
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // If on another page, go Home first, then scroll after a tiny delay
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(id);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F8F7F2]/90 backdrop-blur-md border-b border-[#E5E5E0]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
        {/* LOGO */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center cursor-pointer gap-2 transition-opacity hover:opacity-80"
        >
          <img
            src={logo}
            alt="Misharu Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A2035]">
            Misharu
          </h1>
        </div>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigate(link.path)}
              className="text-sm font-semibold text-slate-600 hover:text-[#D4AF37] transition-colors"
            >
              {link.name}
            </button>
          ))}

          <div className="h-5 w-[1px] bg-slate-300 mx-2"></div>

          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-[#1A2035] hover:text-[#D4AF37] transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-bold text-[#F8F7F2] bg-[#1A2035] hover:bg-[#D4AF37] hover:text-[#1A2035] transition-all px-6 py-2.5 rounded-full shadow-md active:scale-95"
          >
            Sign Up
          </button>
        </div>

        {/* MOBILE BUTTON */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[#1A2035]"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-[#F8F7F2] border-b border-[#E5E5E0] shadow-2xl md:hidden"
          >
            <div className="p-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigate(link.path)}
                  className="text-xl font-bold text-[#1A2035] text-left hover:text-[#D4AF37]"
                >
                  {link.name}
                </button>
              ))}
              <hr className="border-slate-200" />
              <button
                onClick={() => handleNavigate("/login")}
                className="w-full py-4 font-bold border-2 border-[#1A2035] rounded-2xl"
              >
                Login
              </button>
              <button
                onClick={() => handleNavigate("/register")}
                className="w-full py-4 font-bold bg-[#1A2035] text-white rounded-2xl"
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
