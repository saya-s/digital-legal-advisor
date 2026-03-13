// src/pages/Auth/Login.jsx
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-[1200px] h-[700px] flex flex-col md:flex-row rounded-lg shadow-lg overflow-hidden">
        {/* Left side - form */}
        <div className="flex-1 p-16 md:p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-1">Welcome again!</h2>
          <p className="text-gray-500 mb-8 text-lg">
            Please enter your details
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <label className="font-bold text-lg mt-4">Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
            />

            <label className="font-bold text-lg mt-4">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-b-2 border-gray-800 py-2 outline-none bg-transparent text-base"
            />

            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <input type="checkbox" className="mr-1" />
                <span>Remember me</span>
              </div>
              <span className="cursor-pointer">Forgot Password?</span>
            </div>

            <button
              type="submit"
              className="mt-6 py-4 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition"
            >
              Log In
            </button>

            <button
              type="button"
              className="mt-4 py-4 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              Log in with Google
            </button>
          </form>
        </div>

        {/* Right side - illustration */}
        <div className="flex-1 bg-gray-50 flex justify-center items-center p-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Illustration"
            className="w-64"
          />
        </div>
      </div>
    </div>
  );
}
