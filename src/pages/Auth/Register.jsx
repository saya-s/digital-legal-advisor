import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!agree) {
      alert("Please agree to the terms.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log({ username, email, password });
    alert("Register submitted (frontend only)");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-[1200px] h-[700px] flex flex-col md:flex-row rounded-lg shadow-lg overflow-hidden">
        {/* Left side - form */}
        <div className="flex-1 p-16 md:p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-2">Register</h2>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <label className="font-bold text-lg mt-4">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
            />

            <label className="font-bold text-lg mt-4">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
            />

            <label className="font-bold text-lg mt-4">Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showPass1 ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex-1 border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
              />
            </div>

            <label className="font-bold text-lg mt-4">Re-type Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showPass2 ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="flex-1 border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
              />
            </div>

            <div className="flex gap-2 mt-4 items-start">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 leading-snug">
                By registering, you agree to the Terms, Conditions and Policies
                of our Privacy Policy
              </p>
            </div>

            <button
              type="submit"
              className="mt-6 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition"
            >
              Sign Up
            </button>

            <button
              type="button"
              className="mt-4 py-3 bg-gray-200 rounded-full font-semibold hover:bg-gray-300 transition"
            >
              Sign up with Google
            </button>

            <p className="mt-4 text-sm text-gray-600">
              Already have an account?{" "}
              <span className="text-gray-900 font-bold cursor-pointer">
                Log In
              </span>
            </p>
          </form>
        </div>

        {/* Right side - illustration */}
        <div className="flex-1 bg-gray-50 flex justify-center items-center p-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png"
            alt="Legal illustration"
            className="w-72 max-w-[80%]"
          />
        </div>
      </div>
    </div>
  );
}
