const db = require("../db");
const parseJsonObject = require("../utils/parseJsonObject");

function buildAnalysisPayload(body) {
  const incomingAnalysis =
    body?.analysis && typeof body.analysis === "object" && !Array.isArray(body.analysis)
      ? body.analysis
      : {};

  const clauses = Array.isArray(incomingAnalysis.clauses)
    ? incomingAnalysis.clauses
    : Array.isArray(body?.clauses)
      ? body.clauses
      : [];

  return {
    ...incomingAnalysis,
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

function clampText(text = "", maxLength = 255) {
  const normalized = String(text || "").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trim();
}

function buildQaPayload(body) {
  const rawAnalysisId = String(body?.analysisId || "").trim();
  const parsedAnalysisId = Number.parseInt(rawAnalysisId, 10);

  return {
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

function buildQaHistoryRow(row, qaPayload = {}) {
  return {
    ...row,
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

function buildHydratedHistoryRow(row) {
  const savedAnalysis = parseJsonObject(row.analysis_json);

  if (savedAnalysis?.entryType === "qa") {
    return buildQaHistoryRow(row, savedAnalysis);
  }

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

exports.saveHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const entryType = req.body?.entry_type === "qa" ? "qa" : "analysis";
    const historyPayload =
      entryType === "qa"
        ? buildQaPayload(req.body)
        : buildAnalysisPayload(req.body);
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

    if (entryType === "qa" && (!historyPayload.question || !historyPayload.answer)) {
      return res.status(400).json({
        error: "Both the AI question and answer are required to save Q&A history.",
      });
    }

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

exports.getHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT id, document_name, risk_level, summary, status, analysis_json, created_at
       FROM analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    const historyRows = rows.map(buildHydratedHistoryRow);

    res.json(historyRows);
  } catch (err) {
    console.error("Fetch history error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
