const { normalizeWhitespace } = require("./legalQaDataset");

const DEFAULT_MODEL =
  process.env.OPENAI_LEGAL_QA_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-5.4-mini";
const DEFAULT_BASE_URL = (
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/$/, "");
const DEFAULT_CONTEXT_CITATIONS = 4;
const DEFAULT_MAX_OUTPUT_TOKENS = 420;

function hasOpenAiLegalQa() {
  return Boolean(String(process.env.OPENAI_API_KEY || "").trim());
}

function clampText(text = "", maxLength = 1800) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildCitationContext(citations = []) {
  const citationLimit = toPositiveInteger(
    process.env.LEGAL_QA_MAX_CONTEXT_CITATIONS,
    DEFAULT_CONTEXT_CITATIONS,
  );

  return citations
    .slice(0, citationLimit)
    .map((citation, index) => {
      const label = citation.reference_label || citation.article_label || "Section";
      const lawTitle = citation.law_title || citation.source_document || "Unknown law";
      const contextLabel =
        citation.chapter || citation.section_title || "Loaded law section";
      const sourceText = normalizeWhitespace(
        citation.original_text || citation.excerpt || "",
      );

      return [
        `[${index + 1}] ${label}`,
        `Law: ${lawTitle}`,
        `Context: ${contextLabel}`,
        `Text: ${clampText(sourceText)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildPrompt({ question, citations = [] }) {
  return [
    `User question: ${normalizeWhitespace(question)}`,
    "",
    "Provided Iraqi law excerpts:",
    buildCitationContext(citations),
    "",
    "Answer the question in plain language using the provided excerpts.",
    "If the excerpts are not enough, say that clearly.",
  ].join("\n");
}

function buildClauseExplanationPrompt({
  clause = {},
  citations = [],
  contractContext = {},
}) {
  return [
    `Contract document: ${normalizeWhitespace(contractContext.documentName || "Uploaded contract")}`,
    contractContext.summary
      ? `Contract summary: ${normalizeWhitespace(contractContext.summary)}`
      : "",
    "",
    "Clause text:",
    clampText(normalizeWhitespace(clause.text || ""), 2200),
    "",
    "Relevant Iraqi law excerpts:",
    buildCitationContext(citations),
    "",
    "Explain this contract clause in plain language.",
    "Use the clause text and the law excerpts shown above.",
    "If the law excerpts do not clearly fit this clause, say that briefly instead of guessing.",
    "Write the answer as plain sentences only.",
    "Do not use bullet points, markdown, or headings.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractResponseText(responseJson = {}) {
  if (typeof responseJson.output_text === "string" && responseJson.output_text) {
    return responseJson.output_text;
  }

  if (!Array.isArray(responseJson.output)) {
    return "";
  }

  const parts = [];

  responseJson.output.forEach((item) => {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((contentItem) => {
      if (contentItem?.type === "output_text" && contentItem.text) {
        parts.push(contentItem.text);
      }
    });
  });

  return parts.join("\n").trim();
}

function buildApiErrorMessage(status, errorJson = {}) {
  const apiMessage =
    errorJson?.error?.message ||
    errorJson?.message ||
    errorJson?.error ||
    "";

  if (apiMessage) {
    return `OpenAI legal QA request failed (${status}): ${apiMessage}`;
  }

  return `OpenAI legal QA request failed with status ${status}.`;
}

async function requestText({
  instructions,
  prompt,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
}) {
  const response = await fetch(`${DEFAULT_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      instructions,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      max_output_tokens: maxOutputTokens,
      store: false,
      truncation: "auto",
    }),
  });

  const responseJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(response.status, responseJson));
  }

  return {
    responseJson,
    text: normalizeWhitespace(extractResponseText(responseJson)),
  };
}

async function generateGroundedAnswer({ question, citations = [] }) {
  if (!hasOpenAiLegalQa()) {
    throw new Error("OPENAI_API_KEY is not configured for legal QA.");
  }

  const { responseJson, text } = await requestText({
      instructions:
        "You are an Iraqi-law research assistant. Answer only from the excerpts provided in the user message. Do not use outside knowledge. Do not invent missing facts. If the excerpts are not enough to answer the question, say so clearly. Keep the answer concise, practical, and neutral.",
      prompt: buildPrompt({ question, citations }),
      maxOutputTokens: toPositiveInteger(
        process.env.OPENAI_LEGAL_QA_MAX_OUTPUT_TOKENS,
        DEFAULT_MAX_OUTPUT_TOKENS,
      ),
    });

  if (!text) {
    throw new Error("OpenAI legal QA returned an empty response.");
  }

  return {
    answer: text,
    model: responseJson.model || DEFAULT_MODEL,
    usage: responseJson.usage || null,
  };
}

async function generateGroundedClauseExplanation({
  clause,
  citations = [],
  contractContext = {},
}) {
  if (!hasOpenAiLegalQa()) {
    throw new Error("OPENAI_API_KEY is not configured for legal QA.");
  }

  const { responseJson, text } = await requestText({
    instructions:
      "You are an Iraqi-law contract explainer. Explain the selected contract clause in plain language using only the clause text and the retrieved Iraqi law excerpts. Do not use outside knowledge. Do not invent facts. If the excerpts are weak, incomplete, or not clearly on point, say that clearly. If you mention article numbers, mention only article numbers that appear in the provided excerpts. Keep the explanation concise, neutral, and practical.",
    prompt: buildClauseExplanationPrompt({
      clause,
      citations,
      contractContext,
    }),
    maxOutputTokens: toPositiveInteger(
      process.env.OPENAI_LEGAL_QA_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
    ),
  });

  if (!text) {
    throw new Error("OpenAI legal QA returned an empty response.");
  }

  return {
    answer: text,
    model: responseJson.model || DEFAULT_MODEL,
    usage: responseJson.usage || null,
  };
}

module.exports = {
  generateGroundedClauseExplanation,
  generateGroundedAnswer,
  hasOpenAiLegalQa,
};
