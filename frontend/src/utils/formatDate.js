// Turn a saved date into short text such as "Jun 9, 2026".
export function formatShortDate(value, fallback = "", locale = "en-US") {
  // Return the supplied fallback when there is no valid date.
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  // Show the date in the normal order and wording for the chosen language.
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
