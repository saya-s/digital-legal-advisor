// Safely turn a value into a plain JSON object, or return null if it is unusable.
function parseJsonObject(value) {
  // Empty values cannot be parsed into a useful object.
  if (!value) {
    return null;
  }

  // If the caller already passed a plain object, reuse it directly.
  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  // Only strings are valid candidates for JSON parsing at this point.
  if (typeof value !== "string") {
    return null;
  }

  try {
    // Parse the JSON string and accept it only if the result is a plain object.
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    // Invalid JSON should fail quietly instead of crashing the request flow.
    return null;
  }
}

module.exports = parseJsonObject;
