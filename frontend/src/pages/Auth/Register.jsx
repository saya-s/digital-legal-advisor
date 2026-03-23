import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/)) strength++;
    if (pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

 const handleSubmit = async (e) => { // Added 'async'
    e.preventDefault();

    // Validations
    if (!agree) {
      alert("Please agree to the terms to continue.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (passwordStrength < 3) {
      alert("Please choose a stronger password.");
      return;
    }

    try {
      // THE CONNECTION LOGIC
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully! Redirecting to login...");
        navigate("/login");
      } else {
        // This catches "User already exists" or other backend errors
        alert(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error("Connection Error:", err);
      alert("Could not connect to the server. Is your backend running on port 5001?");
    }
  };

  const getStrengthText = () => {
    const strengths = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["#FF4444", "#FF7744", "#FFAA44", "#D4AF37", "#22AA44"];
    return { text: strengths[passwordStrength - 1] || "Too Weak", color: colors[passwordStrength - 1] || "#FF4444" };
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] flex justify-center items-center p-4">
      <div className="w-full max-w-[1300px] min-h-[800px] flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden">
        
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
              <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Thousands of individuals and businesses already use Misharu 
                to navigate legal documents with confidence and clarity.
              </p>
            </div>
            
            {/* Benefits list */}
            <div className="space-y-4 mb-8">
              {[
                "AI-powered contract analysis",
                "Plain language explanations",
                "Risk detection & alerts",
                "Access to verified templates",
                "Lawyer directory & referrals"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-[#D4AF37] flex-shrink-0" />
                  <span className="text-gray-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-gray-400">
            © 2024 Misharu. All rights reserved.
          </div>
        </div>

        {/* Right side - Registration Form */}
        <div className="flex-1 bg-white p-12 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-[#1A2035] mb-2">Create Account</h2>
            <p className="text-gray-500 mb-8">
              Start your journey to clearer legal understanding
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username field */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Choose a username"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition bg-gray-50"
                />
              </div>

              {/* Email field */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition bg-gray-50"
                />
              </div>

              {/* Password field with strength meter */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Create a password"
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full transition-all"
                          style={{
                            backgroundColor: i < passwordStrength ? getStrengthText().color : "#E5E5E0",
                            height: "6px"
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: getStrengthText().color }}>
                      Password strength: {getStrengthText().text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Use at least 8 characters with mix of letters, numbers & symbols
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="block font-medium text-[#1A2035] mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1A2035]"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p className={`text-xs mt-1 ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                    {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Terms agreement */}
              <div className="flex gap-3 items-start mt-4">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-4 h-4 mt-1 text-[#D4AF37] border-gray-300 rounded focus:ring-[#D4AF37]"
                />
                <p className="text-sm text-gray-600 leading-relaxed">
                  I agree to Misharu's{" "}
                  <button type="button" className="text-[#D4AF37] hover:text-[#B85C38] font-medium">
                    Terms of Service
                  </button>,{" "}
                  <button type="button" className="text-[#D4AF37] hover:text-[#B85C38] font-medium">
                    Privacy Policy
                  </button>, and{" "}
                  <button type="button" className="text-[#D4AF37] hover:text-[#B85C38] font-medium">
                    Cookie Policy
                  </button>.
                </p>
              </div>

              {/* Sign Up button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#1A2035] text-white rounded-xl font-semibold hover:bg-[#303658] transition transform hover:-translate-y-0.5 shadow-lg mt-6"
              >
                Create Account
              </button>

              {/* Google signup button */}
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
                Sign up with Google
              </button>

              {/* Login link */}
              <p className="text-center text-gray-600 pt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-[#D4AF37] font-semibold hover:text-[#B85C38] transition"
                >
                  Sign in
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
