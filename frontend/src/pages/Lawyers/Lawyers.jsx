import {
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  Filter,
  Mail,
  MapPin,
  Phone,
  Scale,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

export default function Lawyers() {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/lawyers"));
        if (!response.ok) throw new Error("Failed to fetch lawyers");
        const data = await response.json();
        setLawyers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        setLawyers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);

  const cities = [...new Set(lawyers.map((l) => l.city))].filter(Boolean);
  const specialties = [...new Set(lawyers.map((l) => l.specialty))].filter(
    Boolean,
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLawyers = lawyers.filter((lawyer) => {
    const searchableText = [lawyer.name, lawyer.firm, lawyer.specialty]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

    const matchesCity = selectedCity === "" || lawyer.city === selectedCity;
    const matchesSpecialty =
      selectedSpecialty === "" || lawyer.specialty === selectedSpecialty;

    return matchesSearch && matchesCity && matchesSpecialty;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card-surface flex min-h-[16rem] items-center justify-center p-8 text-sm font-semibold text-slate-500">
          Loading experts...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
      >
        <ChevronRight size={18} className="rotate-180" />
        Back to Dashboard
      </button>

      <section className="card-surface mt-6 overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-10 md:px-8 md:py-12">
          <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10">
            <p className="eyebrow">Professional Directory</p>
            <div className="mb-6 mt-4 flex items-center gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <Scale size={40} className="text-brand-accent" />
              </div>
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                Connect with Expert Lawyers
              </h1>
            </div>
            <p className="max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Find trusted legal professionals. Filter by specialty and city to
              find the best match for your legal needs.
            </p>
          </div>
        </div>
      </section>

      <section className="card-surface mt-6 p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
            <Filter size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">
              Search and filter
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the list by name, specialty, or city.
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, specialty, or firm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3.5 pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-4 py-3 text-white transition hover:bg-brand-inkSoft md:hidden"
            >
              <Filter size={20} /> Filters
            </button>

            <div className="hidden gap-4 md:flex">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-2xl border border-brand-line bg-brand-surface px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="rounded-2xl border border-brand-line bg-brand-surface px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
              >
                <option value="">All Specialties</option>
                {specialties.map((spec, index) => (
                  <option key={index} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 space-y-4 md:hidden">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
              >
                <option value="">All Specialties</option>
                {specialties.map((spec, index) => (
                  <option key={index} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 text-sm text-slate-500">
            Found{" "}
            <span className="font-bold text-brand-ink">
              {filteredLawyers.length}
            </span>{" "}
            lawyers
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="card-surface overflow-hidden transition hover:-translate-y-1"
            >
              <div className="relative h-32 bg-gradient-to-r from-brand-ink to-brand-inkSoft">
                <div className="absolute -bottom-12 left-6">
                  {lawyer.image_url ? (
                    <img
                      src={lawyer.image_url}
                      alt={lawyer.name}
                      className="h-24 w-24 rounded-xl border-4 border-white object-cover shadow-float"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl border-4 border-white bg-white text-2xl font-black text-brand-ink shadow-float">
                      {lawyer.name
                        ?.split(" ")
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("") || "LP"}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-14">
                <h3 className="mb-1 text-xl font-bold text-brand-ink">
                  {lawyer.name}
                </h3>
                <p className="mb-2 font-medium text-brand-accentDeep">
                  {lawyer.firm}
                </p>

                <div className="mb-3 flex items-center gap-2">
                  <Star size={16} className="fill-current text-brand-accent" />
                  <span className="font-bold text-brand-ink">{lawyer.rating}</span>
                  <span className="text-sm text-slate-500">
                    ({lawyer.reviews} reviews)
                  </span>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Briefcase size={16} className="text-brand-accent" />
                    <span className="text-sm">{lawyer.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={16} className="text-brand-accent" />
                    <span className="text-sm">{lawyer.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={16} className="text-brand-accent" />
                    <span className="text-sm">
                      {lawyer.experience} experience
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-brand-line pt-4">
                  <div>
                    <span className="text-sm text-slate-500">Hourly Rate</span>
                    <p className="text-xl font-bold text-brand-ink">
                      {lawyer.hourly_rate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (lawyer.phone) {
                          window.location.href = `tel:${lawyer.phone}`;
                        }
                      }}
                      disabled={!lawyer.phone}
                      className="rounded-xl bg-brand-surface p-2 text-brand-ink transition hover:bg-brand-accentSoft disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Call ${lawyer.name}`}
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (lawyer.email) {
                          window.location.href = `mailto:${lawyer.email}`;
                        }
                      }}
                      disabled={!lawyer.email}
                      className="rounded-xl bg-brand-surface p-2 text-brand-ink transition hover:bg-brand-accentSoft disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Email ${lawyer.name}`}
                    >
                      <Mail size={18} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(`/lawyers/${lawyer.id}`, { state: { lawyer } })
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
                >
                  <BookOpen size={16} /> View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLawyers.length === 0 && !loading && (
          <div className="card-surface mt-8 py-12 text-center">
            <h3 className="text-2xl font-bold text-brand-ink">
              No Experts Found
            </h3>
            <p className="mt-2 text-slate-500">
              Try clearing your filters to see all available lawyers.
            </p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
