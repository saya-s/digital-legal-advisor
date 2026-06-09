// Choose the badge colors for a risk level.
export function getRiskBadgeTone(riskLevel = "Low") {
  // Return the matching background and text colors for the badge.
  if (riskLevel === "High") {
    return "bg-red-100 text-red-700";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

// Choose the small dot color for a risk level.
export function getRiskDotTone(riskLevel = "Low") {
  // This smaller helper is used for circular risk markers.
  if (riskLevel === "High") {
    return "bg-red-500";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}
