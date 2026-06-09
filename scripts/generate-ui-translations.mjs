import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(PROJECT_ROOT, "frontend", "src", "i18n", "locales");
const SOURCE_LOCALE_PATH = path.join(LOCALES_DIR, "en.json");
const BACKEND_ENV_PATH = path.join(PROJECT_ROOT, "backend", ".env");

const SUPPORTED_TARGETS = {
  ar: {
    englishName: "Arabic",
    nativeName: "العربية",
    fileName: "ar.json",
  },
  ckb: {
    englishName: "Central Kurdish",
    nativeName: "کوردی",
    fileName: "ckb.json",
  },
};

const DEFAULT_MODEL =
  process.env.OPENAI_TRANSLATION_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4.1-mini";
const DEFAULT_BATCH_SIZE = 24;
const DEFAULT_BATCH_CHAR_LIMIT = 6000;

function printUsage() {
  console.log(`Usage:
  OPENAI_API_KEY=... npm run translate:ui
  OPENAI_API_KEY=... npm run translate:ui -- --locales=ar

Options:
  --locales=ar,ckb       Comma-separated target locales. Defaults to ar,ckb.
  --model=<model>        OpenAI model ID. Defaults to ${DEFAULT_MODEL}.
  --batch-size=<number>  Max string entries per request batch. Defaults to ${DEFAULT_BATCH_SIZE}.
  --char-limit=<number>  Approximate max source characters per request batch. Defaults to ${DEFAULT_BATCH_CHAR_LIMIT}.
  --help                 Show this message.

Environment:
  OPENAI_API_KEY         Required unless backend/.env contains it.
  OPENAI_BASE_URL        Optional. Defaults to https://api.openai.com/v1
  OPENAI_TRANSLATION_MODEL / OPENAI_MODEL
                         Optional default model override.
`);
}

function parseArgs(argv) {
  const options = {
    locales: Object.keys(SUPPORTED_TARGETS),
    model: DEFAULT_MODEL,
    batchSize: DEFAULT_BATCH_SIZE,
    charLimit: DEFAULT_BATCH_CHAR_LIMIT,
  };

  for (const arg of argv) {
    if (arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--locales=")) {
      options.locales = arg
        .split("=")[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith("--model=")) {
      options.model = arg.split("=")[1].trim();
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = Number.parseInt(arg.split("=")[1], 10);
      continue;
    }

    if (arg.startsWith("--char-limit=")) {
      options.charLimit = Number.parseInt(arg.split("=")[1], 10);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const invalidLocales = options.locales.filter(
    (locale) => !SUPPORTED_TARGETS[locale],
  );
  if (invalidLocales.length > 0) {
    throw new Error(
      `Unsupported locale(s): ${invalidLocales.join(", ")}. Supported locales: ${Object.keys(
        SUPPORTED_TARGETS,
      ).join(", ")}`,
    );
  }

  if (!Number.isInteger(options.batchSize) || options.batchSize <= 0) {
    throw new Error("--batch-size must be a positive integer.");
  }

  if (!Number.isInteger(options.charLimit) || options.charLimit <= 0) {
    throw new Error("--char-limit must be a positive integer.");
  }

  return options;
}

function pathToKey(pathSegments) {
  return pathSegments
    .map((segment) =>
      String(segment)
        .replaceAll("~", "~0")
        .replaceAll("/", "~1"),
    )
    .join("/");
}

function collectStringEntries(value, pathSegments = [], entries = []) {
  if (typeof value === "string") {
    entries.push({
      key: pathToKey(pathSegments),
      pathSegments,
      value,
    });
    return entries;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectStringEntries(item, [...pathSegments, index], entries);
    });
    return entries;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, childValue]) => {
      collectStringEntries(childValue, [...pathSegments, key], entries);
    });
  }

  return entries;
}

function buildBatches(entries, maxItems, maxChars) {
  const batches = [];
  let currentBatch = [];
  let currentChars = 0;

  for (const entry of entries) {
    const entrySize = entry.value.length;
    const wouldOverflow =
      currentBatch.length >= maxItems || currentChars + entrySize > maxChars;

    if (wouldOverflow && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(entry);
    currentChars += entrySize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

function rebuildTranslatedTree(sourceValue, translatedValues, pathSegments = []) {
  if (typeof sourceValue === "string") {
    const key = pathToKey(pathSegments);
    return translatedValues[key] ?? sourceValue;
  }

  if (Array.isArray(sourceValue)) {
    return sourceValue.map((item, index) =>
      rebuildTranslatedTree(item, translatedValues, [...pathSegments, index]),
    );
  }

  if (sourceValue && typeof sourceValue === "object") {
    return Object.fromEntries(
      Object.entries(sourceValue).map(([key, childValue]) => [
        key,
        rebuildTranslatedTree(childValue, translatedValues, [...pathSegments, key]),
      ]),
    );
  }

  return sourceValue;
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractResponseText(responseJson) {
  if (!Array.isArray(responseJson.output)) {
    return "";
  }

  const parts = [];

  for (const item of responseJson.output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (
        contentItem?.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n").trim();
}

async function readEnvValueFromFile(filePath, key) {
  try {
    const envText = await fs.readFile(filePath, "utf8");
    const line = envText
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${key}=`));

    if (!line) {
      return "";
    }

    return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, "");
  } catch {
    return "";
  }
}

function buildDeveloperInstructions(target) {
  return [
    `You translate product interface copy from English into ${target.englishName} (${target.nativeName}).`,
    "Return JSON only. Do not add markdown, code fences, or explanations.",
    "Keep every key exactly the same as the input keys.",
    "Translate UI text naturally for a product demo.",
    "Preserve placeholders exactly, such as {username}, {number}, {count}, and {name}.",
    "Preserve the brand name Misharu exactly.",
    "Preserve file extensions like .pdf and acronym-like labels when appropriate.",
    "This is UI-only translation, not legal advice translation. Favor simple, natural interface wording.",
  ].join(" ");
}

function buildUserPrompt(batch) {
  const batchPayload = Object.fromEntries(
    batch.map((entry) => [entry.key, entry.value]),
  );

  return [
    "Translate the following JSON object values.",
    "Return a JSON object with the same keys and translated string values.",
    JSON.stringify(batchPayload, null, 2),
  ].join("\n\n");
}

async function requestTranslationBatch({ apiKey, baseUrl, model, target, batch }) {
  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_output_tokens: 4000,
      instructions: buildDeveloperInstructions(target),
      input: buildUserPrompt(batch),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI translation request failed (${response.status}): ${errorText}`,
    );
  }

  const responseJson = await response.json();
  const rawText = extractResponseText(responseJson);
  const parsed = JSON.parse(stripCodeFences(rawText));

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Translation response was not a JSON object.");
  }

  return parsed;
}

async function loadSourceLocale() {
  const sourceText = await fs.readFile(SOURCE_LOCALE_PATH, "utf8");
  return JSON.parse(sourceText);
}

async function writeLocaleFile(localeCode, translatedTree) {
  const targetPath = path.join(
    LOCALES_DIR,
    SUPPORTED_TARGETS[localeCode].fileName,
  );

  await fs.writeFile(
    targetPath,
    `${JSON.stringify(translatedTree, null, 2)}\n`,
    "utf8",
  );

  return targetPath;
}

async function translateLocale({
  apiKey,
  baseUrl,
  model,
  sourceLocale,
  localeCode,
  batchSize,
  charLimit,
}) {
  const target = SUPPORTED_TARGETS[localeCode];
  const sourceEntries = collectStringEntries(sourceLocale);
  const batches = buildBatches(sourceEntries, batchSize, charLimit);
  const translatedValues = {};

  console.log(
    `Translating ${localeCode} (${target.englishName}) in ${batches.length} batch(es)...`,
  );

  for (const [index, batch] of batches.entries()) {
    console.log(
      `  Batch ${index + 1}/${batches.length} with ${batch.length} string(s)...`,
    );
    const translatedBatch = await requestTranslationBatch({
      apiKey,
      baseUrl,
      model,
      target,
      batch,
    });

    for (const entry of batch) {
      const translatedValue = translatedBatch[entry.key];
      translatedValues[entry.key] =
        typeof translatedValue === "string" && translatedValue.trim()
          ? translatedValue
          : entry.value;
    }
  }

  const translatedTree = rebuildTranslatedTree(sourceLocale, translatedValues);
  const outputPath = await writeLocaleFile(localeCode, translatedTree);

  console.log(`  Wrote ${localeCode} draft to ${outputPath}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const apiKey =
    process.env.OPENAI_API_KEY ||
    (await readEnvValueFromFile(BACKEND_ENV_PATH, "OPENAI_API_KEY"));
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required. Set it in your shell or add it to backend/.env.",
    );
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const sourceLocale = await loadSourceLocale();

  for (const localeCode of options.locales) {
    await translateLocale({
      apiKey,
      baseUrl,
      model: options.model,
      sourceLocale,
      localeCode,
      batchSize: options.batchSize,
      charLimit: options.charLimit,
    });
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
