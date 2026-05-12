import {
  ArrowLeft,
  Briefcase,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Scale,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  buildLawyerWebsiteHref,
  getLawyerInitials,
  normalizeLawyerRecord,
} from "./lawyerDataUtils.js";

// Show a bigger lawyer photo, or initials if there is no photo.
function ProfileAvatar({ lawyer }) {
  if (lawyer.imageUrl) {
    return (
      <img
        src={lawyer.imageUrl}
        alt={lawyer.name}
        className="h-24 w-24 rounded-[1.75rem] border-4 border-white object-cover shadow-float"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-brand-ink text-2xl font-black text-brand-accent shadow-float">
      {getLawyerInitials(lawyer.name) || "LP"}
    </div>
  );
}

// Small card for one lawyer detail.
function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-brand-ink">{value}</p>
    </div>
  );
}

// This page shows the full details for one lawyer.
export default function LawyerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lawyerId } = useParams();
  const stateLawyer = useMemo(
    () =>
      location.state?.lawyer
        ? normalizeLawyerRecord(location.state.lawyer)
        : null,
    [location.state],
  );
  const [lawyer, setLawyer] = useState(stateLawyer);
  const [loading, setLoading] = useState(!stateLawyer);
  const [profileReady, setProfileReady] = useState(true);

  useEffect(() => {
    if (stateLawyer) {
      setLawyer(stateLawyer);
      setLoading(false);
      return;
    }

    // Load the lawyer only if it was not already passed from the list page.
    async function loadLawyer() {
      setLoading(true);
      setProfileReady(true);

      try {
        const response = await fetch(buildApiUrl(`/api/lawyers/${lawyerId}`));

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = await response.json();
        setLawyer(normalizeLawyerRecord(data));
      } catch (error) {
        console.error("Lawyer profile error:", error);
        setLawyer(null);
        setProfileReady(false);
      } finally {
        setLoading(false);
      }
    }

    loadLawyer();
  }, [lawyerId, stateLawyer]);

  if (!lawyer) {
    return (
      <DashboardLayout>
        <section className="card-surface px-6 py-10 text-center md:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-surface text-brand-accent">
            <Scale size={28} />
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
            {loading ? "Loading lawyer profile" : "Lawyer profile not found"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
            {loading
              ? "Fetching the selected lawyer from the directory."
              : "Please return to the lawyer directory and choose a profile from the list."}
          </p>
          {!profileReady && !loading && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              More profile details will appear here when they are available.
            </p>
          )}
          {!loading && (
            <button
              type="button"
              onClick={() => navigate("/lawyers")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
            >
              <ArrowLeft size={16} />
              Back to Lawyer Directory
            </button>
          )}
        </section>
      </DashboardLayout>
    );
  }

  const websiteHref = buildLawyerWebsiteHref(lawyer.website);

  return (
    // Dashboard layout gives this page the sidebar and top bar.
    <DashboardLayout>
      {/* Back button to the lawyer list. */}
      <button
        type="button"
        onClick={() => navigate("/lawyers")}
        className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
      >
        <ArrowLeft size={16} />
        Back to Lawyer Directory
      </button>

      {/* Top profile card. */}
      <section className="card-surface mt-5 overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-8 md:px-10 md:py-10">
          <div className="absolute -right-16 -top-14 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="eyebrow">Lawyer Profile</p>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-200">
                {lawyer.specialty && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Briefcase size={16} className="text-brand-accent" />
                    {lawyer.specialty}
                  </span>
                )}
                {lawyer.city && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <MapPin size={16} className="text-brand-accent" />
                    {lawyer.city}
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white">
                {lawyer.name || "Lawyer Profile"}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                {lawyer.firm && (
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={16} className="text-brand-accent" />
                    {lawyer.firm}
                  </span>
                )}
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                {lawyer.bio}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {lawyer.phone && (
                  <a
                    href={`tel:${lawyer.phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-accentSoft"
                  >
                    <Phone size={16} />
                    Call lawyer
                  </a>
                )}
                {lawyer.email && (
                  <a
                    href={`mailto:${lawyer.email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    <Mail size={16} />
                    Email lawyer
                  </a>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:border-brand-accent hover:text-brand-accent"
                  >
                    <Globe size={16} />
                    Visit website
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-brand-ink shadow-float">
              <div className="flex items-center gap-4">
                <ProfileAvatar lawyer={lawyer} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                    Quick Snapshot
                  </p>
                  <p className="mt-2 text-lg font-bold text-brand-ink">
                    Profile overview
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {lawyer.experience && (
                  <InfoCard label="Experience" value={lawyer.experience} />
                )}
                {lawyer.hourlyRate && (
                  <InfoCard label="Rate" value={lawyer.hourlyRate} />
                )}
                {lawyer.availability && (
                  <InfoCard label="Availability" value={lawyer.availability} />
                )}
                {lawyer.responseTime && (
                  <InfoCard label="Response time" value={lawyer.responseTime} />
                )}
              </div>
            </div>
          </div>
        </div>
        </section>

      {/* Lower detail sections. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="card-surface p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            About
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink">
            About this lawyer
          </h2>
          <p className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
            {lawyer.bio}
          </p>

          {lawyer.practiceAreas.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Practice areas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lawyer.practiceAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card-surface p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            Contact
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink">
            Contact and background
          </h2>

          <div className="mt-5 grid gap-4">
            {lawyer.city && <InfoCard label="City" value={lawyer.city} />}
            {lawyer.phone && <InfoCard label="Phone" value={lawyer.phone} />}
            {lawyer.email && <InfoCard label="Email" value={lawyer.email} />}
            {lawyer.officeHours && (
              <InfoCard label="Office hours" value={lawyer.officeHours} />
            )}
          </div>

          {lawyer.languages.length > 0 && (
            <div className="mt-6 border-t border-brand-line pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Languages
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lawyer.languages.map((language) => (
                  <span
                    key={language}
                    className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lawyer.credentials.length > 0 && (
            <div className="mt-6 border-t border-brand-line pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Credentials
              </p>
              <div className="mt-3 space-y-3">
                {lawyer.credentials.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-brand-surface px-4 py-4 text-sm leading-7 text-slate-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!lawyer.phone &&
            !lawyer.email &&
            !lawyer.officeHours &&
            lawyer.languages.length === 0 &&
            lawyer.credentials.length === 0 && (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-brand-line bg-brand-surface px-5 py-6">
                <p className="text-sm font-semibold text-brand-ink">
                  More profile details can appear here.
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  This area can show extra contact details and background
                  information when they are available.
                </p>
              </div>
            )}
        </section>
      </div>
    </DashboardLayout>
  );
}
