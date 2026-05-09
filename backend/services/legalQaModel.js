const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { summarizeArticle } = require("./legalQaAnswerBuilder");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PYTHON_PATH = path.resolve(PROJECT_ROOT, "ai_env/bin/python");
const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "ml/answer_question.py");
const TOKENIZER_PATH = path.resolve(
  PROJECT_ROOT,
  "ml/artifacts/tokenizer/iraq_law_bpe.model",
);
const CHECKPOINT_PATH = path.resolve(
  PROJECT_ROOT,
  "ml/artifacts/checkpoints/sft_last.pt",
);

function hasLocalQaModel() {
  return [PYTHON_PATH, SCRIPT_PATH, TOKENIZER_PATH, CHECKPOINT_PATH].every(
    (filePath) => fs.existsSync(filePath),
  );
}

function prepareContext(citations = []) {
  return citations.slice(0, 2).map((citation) => ({
    article_number: citation.article_number,
    article_label: citation.article_label,
    chapter: citation.chapter,
    excerpt: summarizeArticle(citation),
  }));
}

function generateModelAnswer({ question, citations = [] }) {
  if (!hasLocalQaModel()) {
    return Promise.reject(
      new Error("Local QA model artifacts are not available yet."),
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      PYTHON_PATH,
      [
        SCRIPT_PATH,
        "--tokenizer-model",
        TOKENIZER_PATH,
        "--checkpoint",
        CHECKPOINT_PATH,
        "--max-new-tokens",
        "96",
      ],
      {
        cwd: PROJECT_ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;
      child.kill("SIGTERM");
      reject(new Error("Local QA model timed out while generating an answer."));
    }, 25000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || `Local QA model exited with status code ${code}.`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed.answer || "");
      } catch (error) {
        reject(
          new Error(
            `Could not parse local QA model output. ${error.message}`,
          ),
        );
      }
    });

    child.stdin.write(
      JSON.stringify({
        question,
        context: prepareContext(citations),
      }),
    );
    child.stdin.end();
  });
}

module.exports = {
  generateModelAnswer,
  hasLocalQaModel,
};
