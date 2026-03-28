import { motion } from "framer-motion";
import { BrainCircuit, FileSearch, Scale, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Features() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Smart Risk Detection",
      desc: "Instantly spot high-risk clauses and understand potential pitfalls before signing.",
      icon: <ShieldCheck />,
      path: "/upload",
    },
    {
      title: "AI-Powered Explanations",
      desc: "Turn complex legal jargon into plain, easy-to-understand language in seconds.",
      icon: <BrainCircuit />,
      path: "/qa",
    },
    {
      title: "Verified Contract Templates",
      desc: "Browse ready-to-use contracts with filters for your business or personal needs.",
      icon: <FileSearch />,
      path: "/templates",
    },
    {
      title: "Trusted Lawyer Connections",
      desc: "Find expert lawyers in your city and get guidance on legal matters quickly.",
      icon: <Scale />,
      path: "/lawyers",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 py-20 px-8">
      <div className="text-center md:text-left mb-10 md:mb-0 md:col-span-2">
        <h2 className="text-4xl font-bold mb-4">
          Powerful Features for Confident Decisions
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto md:mx-0">
          Misharu combines AI, legal expertise, and easy-to-use tools to help
          you understand, analyze, and act on contracts like a pro.
        </p>
      </div>

      {features.map((feat, i) => (
        <motion.button
          key={i}
          onClick={() => navigate(feat.path)}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: i * 0.15 }}
          viewport={{ once: true }}
          className="p-8 bg-white/80 backdrop-blur-md border border-[#E5E5E0] rounded-3xl flex items-start gap-5 shadow-md hover:shadow-2xl hover:border-[#D4AF37] text-left transition-all active:scale-[0.98]"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-300/40 to-yellow-500/30 backdrop-blur-sm shadow-inner text-[#D4AF37] scale-125 mt-1">
            {feat.icon}
          </div>

          <div>
            <h3 className="font-bold text-xl mb-2">{feat.title}</h3>
            <p className="text-slate-600">{feat.desc}</p>
          </div>
        </motion.button>
      ))}
    </section>
  );
}
