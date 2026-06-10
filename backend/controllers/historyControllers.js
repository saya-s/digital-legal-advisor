// Database access for saving and loading per-user history rows.
const db = require("../db");
// Safely parse stored JSON payloads without crashing on bad data.
const parseJsonObject = require("../utils/parseJsonObject");

// Normalize a saved contract-analysis payload before writing it to the database.
function buildAnalysisPayload(body) {
  // Prefer the nested analysis object when the frontend sends the full analysis result.
  const incomingAnalysis =
    body?.analysis && typeof body.analysis === "object" && !Array.isArray(body.analysis)
      ? body.analysis
      : {};

  // Fall back to top-level clauses when a nested analysis object is not present.
  const clauses = Array.isArray(incomingAnalysis.clauses)
    ? incomingAnalysis.clauses
    : Array.isArray(body?.clauses)
      ? body.clauses
      : [];

  return {
    ...incomingAnalysis,
    // Keep the same core fields the dashboard expects later when loading history.
    documentName: incomingAnalysis.documentName || body?.document_name || "Untitled document",
    summary:
      incomingAnalysis.summary ||
      body?.summary ||
      "No summary saved for this analysis.",
    riskLevel: incomingAnalysis.riskLevel || body?.risk_level || "Low",
    clauses,
    documentText:
      typeof incomingAnalysis.documentText === "string"
        ? incomingAnalysis.documentText
        : "",
  };
}

// Keep titles short enough for the history table and database column.
function clampText(text = "", maxLength = 255) {
  const normalized = String(text || "").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trim();
}

// Normalize a saved legal-Q&A payload before writing it to the database.
function buildQaPayload(body) {
  const rawAnalysisId = String(body?.analysisId || "").trim();
  const parsedAnalysisId = Number.parseInt(rawAnalysisId, 10);

  return {
    // Mark this row so getHistory can rebuild it correctly later.
    entryType: "qa",
    qaScope: body?.qa_scope === "contract" ? "contract" : "law",
    question: String(body?.question || "").trim(),
    answer: String(body?.answer || "").trim(),
    answerSource: String(body?.answerSource || "fallback").trim(),
    confidence: String(body?.confidence || "low").trim(),
    citations: Array.isArray(body?.citations) ? body.citations : [],
    contractMatches: Array.isArray(body?.contractMatches)
      ? body.contractMatches
      : [],
    needsLawyer: Boolean(body?.needsLawyer),
    lawyerSuggestion: String(body?.lawyerSuggestion || "").trim(),
    disclaimer: String(body?.disclaimer || "").trim(),
    contractDocumentName: String(body?.contractDocumentName || "").trim(),
    analysisId:
      Number.isInteger(parsedAnalysisId) && parsedAnalysisId > 0
        ? parsedAnalysisId
        : null,
  };
}

// Rebuild one database row into the Q&A shape expected by the frontend.
function buildQaHistoryRow(row, qaPayload = {}) {
  return {
    ...row,
    // Expose the saved question as the display name for Q&A history rows.
    entry_type: "qa",
    document_name: qaPayload.question || row.document_name || "Saved AI question",
    risk_level: row.risk_level || "",
    summary:
      qaPayload.answer ||
      row.summary ||
      "No saved AI answer is available for this question yet.",
    question: qaPayload.question || "",
    answer: qaPayload.answer || "",
    answerSource: qaPayload.answerSource || "fallback",
    confidence: qaPayload.confidence || "low",
    citations: Array.isArray(qaPayload.citations) ? qaPayload.citations : [],
    contractMatches: Array.isArray(qaPayload.contractMatches)
      ? qaPayload.contractMatches
      : [],
    needsLawyer: Boolean(qaPayload.needsLawyer),
    lawyerSuggestion: qaPayload.lawyerSuggestion || "",
    disclaimer: qaPayload.disclaimer || "",
    qa_scope: qaPayload.qaScope || "law",
    contractDocumentName: qaPayload.contractDocumentName || "",
    analysisId: qaPayload.analysisId || null,
    clauses: [],
    documentText: "",
    analysis: null,
  };
}

// Rebuild one database row into either an analysis row or a Q&A row for the dashboard.
function buildHydratedHistoryRow(row) {
  const savedAnalysis = parseJsonObject(row.analysis_json);

  // Q&A rows are stored differently from analysis rows, so hydrate them separately.
  if (savedAnalysis?.entryType === "qa") {
    return buildQaHistoryRow(row, savedAnalysis);
  }

  // Analysis rows restore the structured analysis object used by the dashboard and modal views.
  const clauses = Array.isArray(savedAnalysis?.clauses) ? savedAnalysis.clauses : [];
  const analysis = {
    ...(savedAnalysis || {}),
    entryType: "analysis",
    documentName:
      savedAnalysis?.documentName || row.document_name || "Untitled document",
    summary:
      savedAnalysis?.summary ||
      row.summary ||
      "No summary saved for this analysis.",
    riskLevel: savedAnalysis?.riskLevel || row.risk_level || "Low",
    clauses,
    documentText:
      typeof savedAnalysis?.documentText === "string"
        ? savedAnalysis.documentText
        : "",
  };

  return {
    ...row,
    entry_type: "analysis",
    document_name: analysis.documentName,
    risk_level: analysis.riskLevel,
    summary: analysis.summary,
    clauses,
    documentText: analysis.documentText,
    analysis,
  };
}

// Save either a contract analysis or a legal-Q&A result to the user's history.
exports.saveHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    // STEP 1: Decide which history format to save.
    const entryType = req.body?.entry_type === "qa" ? "qa" : "analysis";
    const historyPayload =
      entryType === "qa"
        ? buildQaPayload(req.body)
        : buildAnalysisPayload(req.body);

    // STEP 2: Derive the display fields that are also stored in top-level table columns.
    const status =
      entryType === "qa"
        ? req.body?.status || "Answered"
        : req.body?.status || "Analyzed";
    const documentName =
      entryType === "qa"
        ? clampText(historyPayload.question || "Saved AI question")
        : historyPayload.documentName;
    const summary =
      entryType === "qa"
        ? historyPayload.answer ||
          "No saved AI answer is available for this question yet."
        : historyPayload.summary;
    const riskLevel = entryType === "qa" ? null : historyPayload.riskLevel;

    // Q&A rows must have both a question and an answer to be useful later.
    if (entryType === "qa" && (!historyPayload.question || !historyPayload.answer)) {
      return res.status(400).json({
        error: "Both the AI question and answer are required to save Q&A history.",
      });
    }

    // STEP 3: Insert the history row and store the full structured payload as JSON.
    const [result] = await db.query(
      `INSERT INTO analysis_history
       (user_id, document_name, risk_level, summary, status, analysis_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        documentName,
        riskLevel,
        summary,
        status,
        JSON.stringify(historyPayload),
      ],
    );

    res.status(201).json({ message: "History saved", historyId: result.insertId });
  } catch (err) {
    console.error("Save history error:", err);
    res.status(500).json({ error: "Failed to save history" });
  }
};

// Load all saved history rows for the signed-in user and hydrate them for the frontend.
exports.getHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    // STEP 1: Read the newest history rows first for dashboard display.
    const [rows] = await db.query(
      `SELECT id, document_name, risk_level, summary, status, analysis_json, created_at
       FROM analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    // STEP 2: Convert raw database rows back into analysis/Q&A objects the UI understands.
    const historyRows = rows.map(buildHydratedHistoryRow);

    res.json(historyRows);
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
