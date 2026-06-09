// Clean one value so the page gets neat text.
function cleanText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

// Turn a list value into an array of clean words.
function toArray(value) {
  if (Array.isArray(value)) {
    // Clean every existing array item and remove empty results.
    return value.map(cleanText).filter(Boolean);
  }

  if (typeof value === "string") {
    // Turn comma-separated backend text into a clean array.
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

// Turn one value into a number if possible.
function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Make experience text look the same everywhere.
function normalizeExperience(value) {
  const text = cleanText(value);

  if (!text) {
    return "";
  }

  return /year/i.test(text) ? text : `${text} years`;
}

// Turn different backend field names into one clean lawyer object.
export function normalizeLawyerRecord(record, index = 0) {
  // Use the first available version of each lawyer detail.
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

// Make sure a lawyer website link opens correctly.
export function buildLawyerWebsiteHref(website) {
  if (!website) {
    return "";
  }

  return website.startsWith("http") ? website : `https://${website}`;
}

// Build initials if a lawyer has no photo.
export function getLawyerInitials(name) {
  // Split the name, keep two words, and join their first letters.
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    // Convert each remaining word into one uppercase letter.
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
