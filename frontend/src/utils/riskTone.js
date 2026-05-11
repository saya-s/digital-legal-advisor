export function getRiskBadgeTone(riskLevel = "Low") {
  if (riskLevel === "High") {
    return "bg-red-100 text-red-700";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

export function getRiskDotTone(riskLevel = "Low") {
  if (riskLevel === "High") {
    return "bg-red-500";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}
