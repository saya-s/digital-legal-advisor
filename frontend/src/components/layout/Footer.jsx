export default function Footer() {
  return (
    <footer className="bg-[#1A2035] text-[#F8F7F2] px-8 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-3">Misharu</h2>
          <p className="text-sm text-slate-300">
            Simplifying contracts with AI. Understand risks, clauses, and legal
            terms instantly.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="hover:text-[#D4AF37] cursor-pointer">Features</li>
            <li className="hover:text-[#D4AF37] cursor-pointer">
              How it Works
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Team</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Saya Sardar</li>
            <li>Sewa Adnan</li>
            <li className="text-slate-400">Capstone Project 2026</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-600 mt-10 pt-6 text-center text-sm text-slate-400">
        © 2026 Misharu. All rights reserved.
      </div>
    </footer>
  );
}
