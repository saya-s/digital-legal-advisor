import Navbar from "../components/layout/Navbar";
import PublicFooter from "../components/layout/PublicFooter";

export default function MainLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-surface text-brand-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem]">
        <div className="absolute left-[8%] top-14 h-56 w-56 rounded-full bg-brand-accent/15 blur-3xl" />
        <div className="absolute right-[8%] top-6 h-72 w-72 rounded-full bg-brand-ink/10 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative flex-1 pt-24">{children}</main>

      <PublicFooter />
    </div>
  );
}
