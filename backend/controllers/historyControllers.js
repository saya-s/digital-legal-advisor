const db = require("../db");

async function getHistoryTableColumns() {
  const [rows] = await db.query("SHOW COLUMNS FROM analysis_history");
  return new Set(rows.map((row) => row.Field));
}

function parseClausesJson(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function parseJsonObject(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  return null;
}

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

function buildHydratedHistoryRow(row) {
  const savedAnalysis = parseJsonObject(row.analysis_json);
  const clauses = Array.isArray(savedAnalysis?.clauses)
    ? savedAnalysis.clauses
    : parseClausesJson(row.clauses_json);
  const analysis = {
    ...(savedAnalysis || {}),
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
    const { status } = req.body;
    const tableColumns = await getHistoryTableColumns();
    const analysisPayload = buildAnalysisPayload(req.body);
    const insertColumns = [
      "user_id",
      "document_name",
      "risk_level",
      "summary",
      "status",
    ];
    const values = [
      userId,
      analysisPayload.documentName,
      analysisPayload.riskLevel,
      analysisPayload.summary,
      status || "Analyzed",
    ];

    if (tableColumns.has("analysis_json")) {
      insertColumns.push("analysis_json");
      values.push(JSON.stringify(analysisPayload));
    }

    if (tableColumns.has("clauses_json")) {
      insertColumns.push("clauses_json");
      values.push(JSON.stringify(analysisPayload.clauses));
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const [result] = await db.query(
      `INSERT INTO analysis_history
       (${insertColumns.join(", ")})
       VALUES (${placeholders})`,
      values,
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
    const tableColumns = await getHistoryTableColumns();
    const selectColumns = [
      "id",
      "document_name",
      "risk_level",
      "summary",
      "status",
      "created_at",
    ];

    if (tableColumns.has("analysis_json")) {
      selectColumns.push("analysis_json");
    }

    if (tableColumns.has("clauses_json")) {
      selectColumns.push("clauses_json");
    }

    const [rows] = await db.query(
      `SELECT ${selectColumns.join(", ")}
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
