// Change these rules if you want different risk patterns, reasons, or weights.
// Each rule says: if this wording appears, add risk points and record why.
const RISK_SIGNAL_RULES = [
  {
    level: "High",
    weight: 6,
    reason:
      "Allows one side to end or control the agreement on very broad terms.",
    patterns: [
      "sole discretion",
      "without notice",
      "without prior notice",
      "without cause",
      "at any time",
      "for convenience",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Makes all remaining payments immediately due after a default or early termination.",
    patterns: [
      "all remaining rent",
      "all remaining fees",
      "all remaining payments",
      "immediately due and payable",
      "entire balance becomes due",
      /\baccelerat(?:e|ion)\b/i,
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Allows deposits or payments to be forfeited without a balanced remedy.",
    patterns: [
      "non-refundable",
      "forfeiture",
      "forfeited",
      "deposit shall be forfeited",
      "security deposit shall be forfeited",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Creates broad indemnity or hold-harmless duties that can shift major legal risk.",
    patterns: [
      "hold harmless",
      "defend and indemnify",
      "defend, indemnify",
      "indemnify and hold harmless",
      "all claims",
    ],
    labels: ["Liability", "General"],
  },
  {
    level: "High",
    weight: 6,
    reason: "Waives important legal rights or remedies.",
    patterns: [
      "waive all rights",
      "waiver of jury trial",
      "class action waiver",
      "confession of judgment",
      "exclusive remedy",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Attempts to remove liability even for serious misconduct or negligence.",
    patterns: [
      "unlimited liability",
      "no liability",
      "regardless of negligence",
      "landlord's own misconduct",
      "landlord’s own misconduct",
      "gross negligence",
    ],
  },
  {
    level: "High",
    weight: 5,
    reason: "Requires a personal guarantee or exposes personal assets.",
    patterns: ["personal guarantee", "personally guarantee"],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Includes automatic renewal or continuing obligations that may be easy to miss.",
    patterns: ["automatic renewal", "automatically renew", "auto-renew"],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Adds penalties, late fees, or extra financial consequences.",
    patterns: [
      "late fee",
      "late charge",
      "penalty",
      "liquidated damages",
      "default interest",
      "interest at",
    ],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Lets one side change important terms with limited warning or consent.",
    patterns: [
      "subject to change",
      "may revise",
      "may change",
      "may modify",
      "reserves the right to change",
    ],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Uses broad termination rights that may need clearer limits or notice.",
    patterns: [
      "may terminate",
      "may end this agreement",
      "terminate this agreement",
      "immediate termination",
    ],
    labels: ["Termination", "General"],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Shifts attorney fees or legal costs onto one side.",
    patterns: ["attorney's fees", "attorneys' fees", "attorney fees", "legal fees"],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Creates broad ownership or assignment obligations that may be one-sided.",
    patterns: [
      "irrevocable",
      "exclusive ownership",
      "work made for hire",
      "assignment of rights",
    ],
    labels: ["Intellectual Property", "General"],
  },
  {
    level: "Medium",
    weight: 2,
    reason:
      "Contains indemnity or liability language that should be reviewed carefully.",
    patterns: ["indemnify", "liability", "damages", "losses"],
    labels: ["Liability"],
  },
];

// Support both plain-text keyword matching and regex matching.
function matchesRiskPattern(text, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(text);
  }

  return text.includes(pattern.toLowerCase());
}

// Main helper: score one clause and return Low, Medium, or High risk.
function assessClauseRisk(clauseText, clauseLabel, contextText = "") {
  // Combine the clause with nearby context so matching is less brittle.
  const normalizedClause = `${clauseText} ${contextText}`.toLowerCase();

  // Keep only the rules that match both the text and, when provided, the clause label.
  const matchedRules = RISK_SIGNAL_RULES.filter((rule) => {
    const labelMatches =
      !rule.labels ||
      rule.labels.includes(clauseLabel) ||
      rule.labels.includes("General");

    return (
      labelMatches &&
      rule.patterns.some((pattern) => matchesRiskPattern(normalizedClause, pattern))
    );
  });

  // Remove duplicate reasons so the frontend explanation stays readable.
  const uniqueReasons = [...new Set(matchedRules.map((rule) => rule.reason))];
  // Total score is the sum of all matched rule weights.
  const score = matchedRules.reduce((total, rule) => total + rule.weight, 0);
  const hasHighSignal = matchedRules.some((rule) => rule.level === "High");
  const hasMediumSignal = matchedRules.some((rule) => rule.level === "Medium");

  // A single strong rule or a high enough combined score makes the clause High risk.
  if (hasHighSignal || score >= 6) {
    return { risk: "High", score, reasons: uniqueReasons };
  }

  // Medium risk is used when medium-level signals appear without reaching High.
  if (hasMediumSignal || score >= 3) {
    return { risk: "Medium", score, reasons: uniqueReasons };
  }

  // If nothing meaningful matched, the clause stays Low risk.
  return { risk: "Low", score, reasons: [] };
}

// Combine all clause results into one overall contract risk level.
function getOverallRiskLevel(clauses) {
  // Count how many clauses were already marked High or Medium.
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;
  const mediumRiskCount = clauses.filter((clause) => clause.risk === "Medium").length;
  // Add the raw numeric risk scores so many smaller issues still affect the overall result.
  const totalRiskScore = clauses.reduce(
    (total, clause) => total + (clause.riskScore || 0),
    0,
  );

  // CHANGE HERE if you want stricter or softer overall contract thresholds.
  if (highRiskCount >= 1 || totalRiskScore >= 8 || mediumRiskCount >= 3) {
    return "High";
  }

  if (mediumRiskCount >= 1 || totalRiskScore >= 3) {
    return "Medium";
  }

  return "Low";
}

module.exports = {
  assessClauseRisk,
  getOverallRiskLevel,
};
