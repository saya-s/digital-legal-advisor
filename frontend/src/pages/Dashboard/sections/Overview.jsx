import { motion } from "framer-motion";

export default function Overview() {
  const stats = [
    { label: "Contracts", value: "12" },
    { label: "High Risk", value: "3" },
    { label: "Analyzed Today", value: "2" },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {stats.map((item, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.03 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E5E0]"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}