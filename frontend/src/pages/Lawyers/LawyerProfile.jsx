import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function ProfileAvatar({ name, imageUrl }) {
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-24 w-24 rounded-[1.75rem] border-4 border-white object-cover shadow-float md:h-28 md:w-28"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-brand-ink text-2xl font-black text-brand-accent shadow-float md:h-28 md:w-28">
      {initials || "LP"}
    </div>
  );
}

function EmptyPanel({ title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-brand-line bg-brand-surface px-5 py-6">
      <h3 className="text-sm font-bold text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function ContactRow({ icon, label, value, href }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-brand-surface px-4 py-4">
      <div className="rounded-2xl bg-white p-2 text-brand-accent shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 block break-words text-sm font-semibold text-brand-ink transition hover:text-brand-accentDeep"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm font-semibold text-brand-ink">{value}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-surface px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-brand-ink">{value}</p>
    </div>
  );
}

export default function LawyerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lawyerId } = useParams();
  const lawyer = location.state?.lawyer ?? null;
  const aboutParagraphs = Array.isArray(lawyer?.about) ? lawyer.about : [];
  const practiceAreas = Array.isArray(lawyer?.practiceAreas)
    ? lawyer.practiceAreas
    : [];
  const credentials = Array.isArray(lawyer?.credentials)
    ? lawyer.credentials
    : [];
  const languages = Array.isArray(lawyer?.languages) ? lawyer.languages : [];
  const consultationModes = Array.isArray(lawyer?.consultationModes)
    ? lawyer.consultationModes
    : [];

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-brand-surface px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-panel">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-surface text-brand-accent">
            <Scale size={28} />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold text-brand-ink">
            Lawyer profile not found
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
            Open this page from the lawyer directory, or let your backend load
            the lawyer details using the route id{" "}
            <span className="font-semibold text-brand-ink">{lawyerId}</span>.
          </p>
          <button
            type="button"
            onClick={() => navigate("/lawyers")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
          >
            <ArrowLeft size={16} />
            Back to Lawyer Directory
          </button>
        </div>
      </div>
    );
  }

  const websiteHref = lawyer.website
    ? lawyer.website.startsWith("http")
      ? lawyer.website
      : `https://${lawyer.website}`
    : "";

  return (
    <div className="min-h-screen bg-brand-surface px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/lawyers")}
          className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
        >
          <ArrowLeft size={16} />
          Back to Lawyer Directory
        </button>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-brand-ink px-6 py-8 text-white shadow-panel md:px-10 md:py-10">
          <div className="absolute -right-16 -top-14 h-56 w-56 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-accent">
                Lawyers
              </p>

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
                {lawyer.availability && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <ShieldCheck size={16} className="text-brand-accent" />
                    {lawyer.availability}
                  </span>
                )}
              </div>

              <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-5xl">
                {lawyer.name || "Lawyer Profile"}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                {lawyer.firm && (
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={16} className="text-brand-accent" />
                    {lawyer.firm}
                  </span>
                )}
                {lawyer.rating && (
                  <span className="inline-flex items-center gap-2">
                    <Star size={16} className="fill-brand-accent text-brand-accent" />
                    {lawyer.rating} rating
                  </span>
                )}
                {lawyer.reviews !== undefined && lawyer.reviews !== null && (
                  <span>{lawyer.reviews} client reviews</span>
                )}
              </div>

              {lawyer.bio && (
                <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                  {lawyer.bio}
                </p>
              )}

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

            <div className="rounded-[2rem] bg-white p-6 text-brand-ink shadow-float md:p-7">
              <div className="flex items-center gap-4">
                <ProfileAvatar name={lawyer.name} imageUrl={lawyer.image_url} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                    Lawyer snapshot
                  </p>
                  <p className="mt-2 text-lg font-bold text-brand-ink">
                    Profile overview
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {lawyer.hourly_rate && (
                  <StatCard label="Hourly rate" value={lawyer.hourly_rate} />
                )}
                {lawyer.experience && (
                  <StatCard label="Experience" value={lawyer.experience} />
                )}
                {lawyer.responseTime && (
                  <StatCard label="Response time" value={lawyer.responseTime} />
                )}
                {lawyer.officeHours && (
                  <StatCard label="Office hours" value={lawyer.officeHours} />
                )}
              </div>

              {consultationModes.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Consultation modes
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {consultationModes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="card-surface p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                About
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-brand-ink">
                About this lawyer
              </h2>
              {aboutParagraphs.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {aboutParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-8 text-slate-600 md:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyPanel
                    title="About section"
                    description="This area is ready for biography or profile notes."
                  />
                </div>
              )}
            </section>

            <section className="card-surface p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                Services
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-brand-ink">
                Practice areas
              </h2>
              {practiceAreas.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {practiceAreas.map((area) => (
                    <article
                      key={area}
                      className="rounded-[1.5rem] border border-brand-line bg-brand-surface px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-2 text-brand-accent shadow-sm">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-brand-ink">
                            {area}
                          </h3>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyPanel
                    title="Practice areas"
                    description="This area is ready for specialties, services, or legal focus categories."
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="card-surface p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                Contact
              </p>
              <h2 className="mt-3 text-2xl font-bold text-brand-ink">
                Contact and availability
              </h2>
              <div className="mt-5 space-y-4">
                {lawyer.city && (
                  <ContactRow
                    icon={<MapPin size={18} />}
                    label="City"
                    value={lawyer.city}
                  />
                )}
                {lawyer.phone && (
                  <ContactRow
                    icon={<Phone size={18} />}
                    label="Phone"
                    value={lawyer.phone}
                    href={`tel:${lawyer.phone}`}
                  />
                )}
                {lawyer.email && (
                  <ContactRow
                    icon={<Mail size={18} />}
                    label="Email"
                    value={lawyer.email}
                    href={`mailto:${lawyer.email}`}
                  />
                )}
                {websiteHref && (
                  <ContactRow
                    icon={<Globe size={18} />}
                    label="Website"
                    value={lawyer.website}
                    href={websiteHref}
                  />
                )}
                {lawyer.officeHours && (
                  <ContactRow
                    icon={<CalendarDays size={18} />}
                    label="Office hours"
                    value={lawyer.officeHours}
                  />
                )}
                {lawyer.responseTime && (
                  <ContactRow
                    icon={<Clock3 size={18} />}
                    label="Response time"
                    value={lawyer.responseTime}
                  />
                )}
                {!lawyer.city &&
                  !lawyer.phone &&
                  !lawyer.email &&
                  !websiteHref &&
                  !lawyer.officeHours &&
                  !lawyer.responseTime && (
                    <EmptyPanel
                      title="Contact details"
                      description="This card is ready for phone, email, address, office hours, and other contact fields."
                    />
                  )}
              </div>
            </section>

            <section className="card-surface p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                Credentials
              </p>
              <h2 className="mt-3 text-2xl font-bold text-brand-ink">
                Background and languages
              </h2>

              {credentials.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {credentials.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0 text-brand-accent"
                      />
                      <p className="text-sm leading-7 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyPanel
                    title="Credentials"
                    description="This area is ready for degrees, certifications, bar membership, and experience highlights."
                  />
                </div>
              )}

              {languages.length > 0 && (
                <div className="mt-6 border-t border-brand-line pt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Languages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languages.map((language) => (
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
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
}
