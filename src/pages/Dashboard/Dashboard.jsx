// src/pages/Dashboard/Dashboard.jsx
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-10 sm:p-4">
      <div className="w-full max-w-[90%]">
        {/* TOP NAV */}
        <div className="flex justify-between items-center bg-white p-7 rounded-xl shadow-md mb-5">
          <h2 className="text-2xl font-bold">Digital Legal Advisor</h2>
          <div className="flex">
            <button
              className="px-6 py-3 rounded-[20px] bg-[#303658] text-gray-100 text-lg ml-4 hover:bg-gray-700 transition"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="px-6 py-3 rounded-[20px] bg-[#303658] text-white text-lg ml-4 hover:bg-gray-700 transition"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* MAIN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            className="text-left bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate("/upload")}
          >
            <h3 className="text-2xl font-bold mb-2">Upload & Analyze</h3>
            <p className="text-gray-600 text-lg leading-6">
              Upload a contract and get summary, explanation, and risk score.
            </p>
          </button>

          <button
            className="text-left bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate("/qa")}
          >
            <h3 className="text-2xl font-bold mb-2">Ask a Question</h3>
            <p className="text-gray-600 text-lg leading-6">
              Ask legal questions and get AI-assisted guidance.
            </p>
          </button>

          <button
            className="text-left bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate("/templates")}
          >
            <h3 className="text-2xl font-bold mb-2">Contract Templates</h3>
            <p className="text-gray-600 text-lg leading-6">
              Browse ready-made templates and filter by category.
            </p>
          </button>

          <button
            className="text-left bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate("/lawyers")}
          >
            <h3 className="text-2xl font-bold mb-2">Find a Lawyer</h3>
            <p className="text-gray-600 text-lg leading-6">
              Search lawyers by city and specialty.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
