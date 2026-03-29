import { motion } from "framer-motion";
import { Brain, CheckCircle, Upload } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Upload Your Document",
      desc: "Upload your contract in seconds. We support simple formats and ensure your data stays private.",
      icon: <Upload />,
    },
    {
      title: "AI Analyzes It",
      desc: "Our AI scans clauses, detects risks, and simplifies complex legal language instantly.",
      icon: <Brain />,
    },
    {
      title: "Understand & Decide",
      desc: "Get clear explanations and risk insights so you can confidently make decisions.",
      icon: <CheckCircle />,
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 px-6 scroll-mt-24">
      {/* SECTION TITLE */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          A simple process designed to make legal documents easy to understand.
        </p>
      </div>

      {/* STEPS */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            viewport={{ once: true }}
            className="bg-[#F8F7F2] p-8 rounded-3xl shadow-sm border border-[#E5E5E0] text-center hover:shadow-md transition"
          >
            {/* ICON */}
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-[#D4AF37]/20 text-[#D4AF37] rounded-full mb-6">
              {step.icon}
            </div>

            {/* STEP NUMBER */}
            <p className="text-sm text-[#D4AF37] font-semibold mb-2">
              Step {i + 1}
            </p>

            {/* TITLE */}
            <h3 className="text-xl font-bold mb-3">{step.title}</h3>

            {/* DESCRIPTION */}
            <p className="text-slate-600 text-sm">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
