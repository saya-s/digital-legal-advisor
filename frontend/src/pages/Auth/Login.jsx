import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user info locally so the Dashboard knows who is logged in
        localStorage.setItem("token", data.token); 
        localStorage.setItem("username", data.username);
        
        navigate("/dashboard");
      } else {
        alert(data.error || "Invalid login credentials");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("Could not connect to the server. Is your backend running?");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex justify-center items-center p-4">
      <div className="w-full max-w-[1200px] min-h-[700px] flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left side - Decorative Panel */}
        <div className="flex-1 bg-[#1A2035] p-12 flex flex-col justify-between text-[#F8F7F2] relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37] opacity-5 rounded-full -ml-40 -mb-40"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Misharu</h1>
            <p className="text-[#D4AF37] font-medium">Ancient wisdom, modern AI</p>
          </div>
          
          <div className="relative z-10">
            <div className="mb-8">
              <Scale size={48} className="text-[#D4AF37] mb-4" />
              <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Continue your journey to clearer, safer legal understanding. 
                Your contracts deserve wisdom, both ancient and new.
              </p>
            </div>
            
            {/* Testimonial/quotes */}
            <div className="border-l-4 border-[#D4AF37] pl-6 py-2">
              <p className="text-gray-300 italic">
                "Finally, legal language I can actually understand. 
                Misharu has been a game-changer for my business."
              </p>
              <p className="text-[#D4AF37] mt-2 font-medium">— Jane Doe., Small Business Owner</p>
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-gray-400">
            © 2024 Misharu. All rights reserved.
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 bg-white p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-[#1A2035] mb-2">Sign In</h2>
            <p className="text-gray-500 mb-8">
              Please enter your details to access your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/Username field */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email or username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition bg-gray-50"
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1A2035]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex justify-between items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-[#D4AF37] hover:text-[#B85C38] font-medium transition"
                  onClick={() => {/* Handle forgot password */}}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#1A2035] text-white rounded-xl font-semibold hover:bg-[#303658] transition transform hover:-translate-y-0.5 shadow-lg"
              >
                Sign In
              </button>

              {/* Google login button */}
              <button
                type="button"
                className="w-full py-3 bg-white border border-gray-200 rounded-xl font-semibold text-[#1A2035] hover:bg-gray-50 transition flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              {/* Register link */}
              <p className="text-center text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-[#D4AF37] font-semibold hover:text-[#B85C38] transition"
                >
                  Sign up
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}