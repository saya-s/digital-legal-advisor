import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-12 py-6">
      <h1
        className="text-3xl font-bold tracking-tight cursor-pointer"
        onClick={() => navigate("/")}
      >
        Misharu
      </h1>

      <div className="space-x-6">
        <button
          className="font-medium hover:text-[#D4AF37] transition"
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          className="font-medium text-[#F8F7F2] bg-[#1A2035] hover:bg-[#303658] transition px-6 py-2 rounded-full"
          onClick={() => navigate("/register")}
        >
          Sign Up
        </button>
      </div>
    </nav>
  );
}
