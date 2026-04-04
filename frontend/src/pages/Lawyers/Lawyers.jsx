import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { hasAuthSession } from "../../utils/authSession.js";
import { getLawyerInitials, normalizeLawyerRecord } from "./lawyerDataUtils.js";

function LawyerAvatar({ lawyer }) {
  if (lawyer.imageUrl) {
    return (
      <img
        src={lawyer.imageUrl}
        alt={lawyer.name}
        className="h-16 w-16 rounded-2xl object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-ink text-lg font-black text-brand-accent shadow-sm">
      {getLawyerInitials(lawyer.name) || "LP"}
    </div>
  );
}

export default function Lawyers() {
  const navigate = useNavigate();
  const isSignedIn = hasAuthSession();
  const PageLayout = isSignedIn ? DashboardLayout : MainLayout;
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [directoryReady, setDirectoryReady] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  useEffect(() => {
    async function loadLawyers() {
      setLoading(true);
      setDirectoryReady(true);

      try {
        const response = await fetch(buildApiUrl("/api/lawyers"));

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = await response.json();
        const nextLawyers = Array.isArray(data)
          ? data.map(normalizeLawyerRecord)
          : [];

        setLawyers(nextLawyers);
      } catch (error) {
        console.error("Lawyer directory error:", error);
        setLawyers([]);
        setDirectoryReady(false);
      } finally {
        setLoading(false);
      }
    }

    loadLawyers();
  }, []);

  const cities = [...new Set(lawyers.map((lawyer) => lawyer.city))].filter(
    Boolean,
  );
  const specialties = [
    ...new Set(lawyers.map((lawyer) => lawyer.specialty)),
  ].filter(Boolean);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLawyers = lawyers.filter((lawyer) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [lawyer.name, lawyer.firm, lawyer.specialty, lawyer.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    const matchesCity = !selectedCity || lawyer.city === selectedCity;
    const matchesSpecialty =
      !selectedSpecialty || lawyer.specialty === selectedSpecialty;

    return matchesSearch && matchesCity && matchesSpecialty;
  });

  return (
    <PageLayout>
      <section className="card-surface overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-10 md:px-8 md:py-12">
          <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="eyebrow">Lawyer Finder Portal</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-white">
                Connect with Expert Lawyers
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                Find trusted legal professionals. Filter by specialty and city
                to find the best match for your legal needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card-surface mt-6 p-6 md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            Directory Search
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink">
            Search and filter the lawyer list
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Use the search box and filters to narrow the directory and find the
            right legal specialty.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <label className="relative block">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by lawyer name, firm, city, or specialty..."
              className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3.5 pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
            />
          </label>

          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={selectedSpecialty}
            onChange={(event) => setSelectedSpecialty(event.target.value)}
            className="rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          >
            <option value="">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Showing{" "}
            <span className="font-bold text-brand-ink">
              {filteredLawyers.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-brand-ink">{lawyers.length}</span>{" "}
            lawyers
          </p>

          {(searchTerm || selectedCity || selectedSpecialty) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCity("");
                setSelectedSpecialty("");
              }}
              className="text-sm font-bold text-brand-accentDeep transition hover:text-brand-accent"
            >
              Clear filters
            </button>
          )}
        </div>

        {!directoryReady && (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-10 text-center">
            <p className="text-sm font-semibold text-brand-ink">
              Lawyer profiles will appear here when they are available.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              When lawyer records are added, the directory will fill in
              automatically.
            </p>
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-[1.75rem] bg-brand-surface px-5 py-12 text-center text-sm font-semibold text-slate-500">
            Loading lawyers...
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-sm">
              <AlertCircle size={24} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-brand-ink">
              No lawyers match the current filters
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Try another city or specialty, or clear the search terms to show
              the full directory again.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredLawyers.map((lawyer) => (
              <article
                key={lawyer.id}
                className="card-surface p-6 transition hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <LawyerAvatar lawyer={lawyer} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-bold text-brand-ink">
                      {lawyer.name}
                    </h3>
                    {lawyer.firm && (
                      <p className="mt-1 text-sm font-semibold text-brand-accentDeep">
                        {lawyer.firm}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {lawyer.specialty && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Briefcase size={16} className="text-brand-accent" />
                      <span>{lawyer.specialty}</span>
                    </div>
                  )}
                  {lawyer.city && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin size={16} className="text-brand-accent" />
                      <span>{lawyer.city}</span>
                    </div>
                  )}
                  {lawyer.experience && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock3 size={16} className="text-brand-accent" />
                      <span>{lawyer.experience}</span>
                    </div>
                  )}
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {lawyer.bio}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {lawyer.phone && (
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                      <Phone
                        size={12}
                        className="mr-1.5 inline text-brand-accent"
                      />
                      Call available
                    </span>
                  )}
                  {lawyer.email && (
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                      <Mail
                        size={12}
                        className="mr-1.5 inline text-brand-accent"
                      />
                      Email available
                    </span>
                  )}
                  {lawyer.hourlyRate && (
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                      {lawyer.hourlyRate}
                    </span>
                  )}
                </div>

                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/lawyers/${lawyer.id}`, { state: { lawyer } })
                    }
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
                  >
                    View Profile
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    {/* Guests can browse the directory, but full profiles stay gated. */}
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/login", {
                          state: { from: `/lawyers/${lawyer.id}` },
                        })
                      }
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
                    >
                      Sign In to View Full Profile
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
