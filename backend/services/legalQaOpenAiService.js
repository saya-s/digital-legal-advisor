// Reuse shared text normalization so prompts and responses stay consistently formatted.
const { normalizeWhitespace } = require("./legalQaDataset");

// Environment-based OpenAI settings with safe defaults for this service.
const DEFAULT_MODEL =
  process.env.OPENAI_LEGAL_QA_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-5.4-mini";
const DEFAULT_BASE_URL = (
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
).replace(/\/$/, "");
const DEFAULT_CONTEXT_CITATIONS = 4;
const DEFAULT_MAX_OUTPUT_TOKENS = 420;

// This feature is considered available only when an API key is configured.
function hasOpenAiLegalQa() {
  return Boolean(String(process.env.OPENAI_API_KEY || "").trim());
}

// Keep prompt excerpts short enough to fit comfortably inside one model request.
function clampText(text = "", maxLength = 1800) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

// Read positive integer settings from env vars while falling back safely on invalid values.
function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

// Convert citation records into the text block sent to the model as grounded legal context.
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

// Build the legal-question prompt that tells the model to answer only from provided excerpts.
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

// Build a separate prompt for explaining one selected contract clause in plain language.
function buildClauseExplanationPrompt({
  clause = {},
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
    "Explain this clause in simple language for a non-lawyer.",
    "Say what the clause means, what it requires or allows, and any important caution a reader should notice.",
    "Use only the clause text shown above.",
    "Do not mention laws, articles, citations, or missing excerpts.",
    "Write the answer as plain sentences only.",
    "Do not use bullet points, markdown, or headings.",
    "Keep the answer short, clear, and practical.",
  ]
    .filter(Boolean)
    .join("\n");
}

// Extract plain text from the OpenAI Responses API payload, supporting both convenience and structured fields.
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

// Turn OpenAI API errors into clearer service-level error messages.
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

// Shared low-level request helper used by both legal-answer and clause-explainer flows.
async function requestText({
  instructions,
  prompt,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
}) {
  // Use the Responses API with one user input message plus system-style instructions.
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

  // If JSON parsing fails, fall back to an empty object so error handling still works cleanly.
  const responseJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(response.status, responseJson));
  }

  return {
    responseJson,
    text: normalizeWhitespace(extractResponseText(responseJson)),
  };
}

// Ask OpenAI to answer a legal question using only the retrieved law excerpts.
async function generateGroundedAnswer({ question, citations = [] }) {
  if (!hasOpenAiLegalQa()) {
    throw new Error("OPENAI_API_KEY is not configured for legal QA.");
  }

  // The instruction strongly grounds the model to the supplied citations and forbids outside facts.
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
    // Return the text plus model/usage metadata so the controller can log or expose it if needed.
    answer: text,
    model: responseJson.model || DEFAULT_MODEL,
    usage: responseJson.usage || null,
  };
}

// Ask OpenAI to rewrite one contract clause in simpler language using only the clause text itself.
async function generateGroundedClauseExplanation({
  clause,
  contractContext = {},
}) {
  if (!hasOpenAiLegalQa()) {
    throw new Error("OPENAI_API_KEY is not configured for legal QA.");
  }

  const { responseJson, text } = await requestText({
    instructions:
      "You are a contract explainer. Rewrite the selected contract clause in simple plain language for a non-lawyer. Use only the clause text provided by the user. Do not invent facts that are not in the clause. Do not mention laws, citations, or article numbers unless they literally appear in the clause itself. Keep the explanation concise, neutral, and practical.",
    prompt: buildClauseExplanationPrompt({
      clause,
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
    // Match the same response shape as legal QA answers for simpler controller handling.
    answer: text,
    model: responseJson.model || DEFAULT_MODEL,
    usage: responseJson.usage || null,
  };
}

module.exports = {
  // Export the two grounded OpenAI helpers plus the configuration availability check.
  generateGroundedClauseExplanation,
  generateGroundedAnswer,
  hasOpenAiLegalQa,
};
