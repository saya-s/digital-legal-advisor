import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-14 py-20 grid md:grid-cols-2 gap-12 items-center">
      
      {/* LEFT */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Understand Every Contract <br />
          <span className="text-[#D4AF37]">Before You Sign</span>
        </h1>

        <p className="text-lg text-slate-700 mb-8 max-w-xl">
          AI-powered legal assistant that explains clauses, detects risks,
          and helps you make confident decisions.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-4 bg-[#D4AF37] text-[#1A2035] rounded-xl font-bold hover:bg-[#B85C38] hover:text-white transition shadow-lg"
          >
            Start Free Analysis
          </button>

          <button className="px-8 py-4 border border-[#1A2035] rounded-xl font-semibold hover:bg-[#1A2035] hover:text-white transition">
            See How It Works
          </button>
        </div>
      </motion.div>

      {/* RIGHT */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        whileHover={{ scale: 1.02 }}
        className="relative"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-3xl"></div>

        <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-[#E5E5E0] p-6">
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Contract Analysis</h3>
            <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full">
              High Risk
            </span>
          </div>

          <div className="space-y-3 text-sm text-slate-700">
            <p className="bg-yellow-100 p-2 rounded">
              “The tenant must vacate the property within 7 days...”
            </p>

            <p>
              Payment terms are required monthly with penalties applied.
            </p>

            <p className="bg-red-100 p-2 rounded">
              “The landlord may terminate the agreement at any time...”
            </p>
          </div>

          <div className="mt-6 p-4 bg-[#F8F7F2] rounded-xl">
            <p className="text-sm text-slate-600">
              ⚠️ Risk detected. Review termination clause carefully.
            </p>
          </div>
        </div>
      </motion.div>

    </section>
  );
}