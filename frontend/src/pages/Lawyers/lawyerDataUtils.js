function cleanText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeExperience(value) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  return /year/i.test(text) ? text : `${text} years`;
}

export function normalizeLawyerRecord(record, index = 0) {
  return {
    id:
      record?.id ??
      record?.lawyer_id ??
      record?.lawyerId ??
      `lawyer-${index + 1}`,
    name:
      cleanText(record?.name ?? record?.full_name ?? record?.fullName) ||
      "Lawyer profile",
    firm: cleanText(record?.firm ?? record?.law_firm ?? record?.lawFirm),
    specialty: cleanText(
      record?.specialty ?? record?.practice_area ?? record?.practiceArea,
    ),
    city: cleanText(record?.city ?? record?.location),
    phone: cleanText(record?.phone ?? record?.phone_number ?? record?.phoneNumber),
    email: cleanText(record?.email),
    website: cleanText(record?.website ?? record?.website_url ?? record?.websiteUrl),
    imageUrl: cleanText(record?.image_url ?? record?.imageUrl),
    bio:
      cleanText(record?.bio ?? record?.summary ?? record?.description) ||
      "Profile summary will appear here when lawyer details are available.",
    experience: normalizeExperience(
      record?.experience ?? record?.years_experience ?? record?.yearsExperience,
    ),
    hourlyRate: cleanText(record?.hourly_rate ?? record?.hourlyRate),
    availability: cleanText(
      record?.availability ??
        record?.availability_status ??
        record?.availabilityStatus,
    ),
    officeHours: cleanText(record?.office_hours ?? record?.officeHours),
    responseTime: cleanText(record?.response_time ?? record?.responseTime),
    rating: toNumber(record?.rating),
    reviews: toNumber(
      record?.reviews ?? record?.review_count ?? record?.reviewCount,
    ),
    practiceAreas: toArray(
      record?.practice_areas ?? record?.practiceAreas ?? record?.services,
    ),
    languages: toArray(
      record?.languages ?? record?.language_list ?? record?.languageList,
    ),
    credentials: toArray(
      record?.credentials ??
        record?.qualifications ??
        record?.credential_list ??
        record?.credentialList,
    ),
  };
}

export function buildLawyerWebsiteHref(website) {
  if (!website) {
    return "";
  }

  return website.startsWith("http") ? website : `https://${website}`;
}

export function getLawyerInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
