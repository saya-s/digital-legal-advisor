import argparse
import json
import random
import re
from pathlib import Path
from typing import Dict, List, Sequence, Tuple


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTICLES_PATH = PROJECT_ROOT / "data/processed_laws/iraq_labour_law_articles.json"
DEFAULT_TRAIN_PATH = PROJECT_ROOT / "ml/data/legal_qa_train.jsonl"
DEFAULT_VAL_PATH = PROJECT_ROOT / "ml/data/legal_qa_val.jsonl"
DEFAULT_METADATA_PATH = PROJECT_ROOT / "ml/data/legal_qa_metadata.json"

QUESTION_TEMPLATES = [
    "What does {article_label} say?",
    "Explain {article_label} in simple language.",
    "Summarize {article_label} of Iraq labour law.",
    "What is the rule in {article_label}?",
    "What does Iraqi labour law say in {article_label}?",
]

CHAPTER_TEMPLATES = [
    "What does {article_label} under {chapter} say?",
    "Explain {article_label} from {chapter}.",
]

DEFINITION_TEMPLATES = [
    "How does Iraqi labour law define {term}?",
    "What is meant by {term} in Iraq labour law?",
    "Explain the legal meaning of {term}.",
]


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def strip_article_heading(text: str) -> str:
    return re.sub(r"^Article\s+\d+\s*[-–:]\s*", "", text).strip()


def load_articles(path: Path) -> List[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def extract_definition_pairs(body_text: str) -> List[Tuple[str, str]]:
    pairs: List[Tuple[str, str]] = []
    pattern = re.compile(r"\b\d+\s*[–-]\s*([^:]{1,80}):\s*([^0-9].*?)(?=\s+\d+\s*[–-]\s*[^:]{1,80}:|$)")
    for match in pattern.finditer(body_text):
        term = normalize_space(match.group(1))
        definition = normalize_space(match.group(2))
        if term and definition:
            pairs.append((term, definition))
    return pairs


def short_answer(article_label: str, body_text: str) -> str:
    sentences = re.split(r"(?<=[.!?;])\s+", body_text)
    lead = normalize_space(sentences[0] if sentences else body_text)
    if not lead:
        return f"{article_label} should be checked in the full law text."
    return f"{article_label} says that {lead[:260].rstrip(',;: ')}"


def long_answer(article_label: str, chapter: str, body_text: str) -> str:
    prefix = f"In {article_label}"
    if chapter:
        prefix += f" under {chapter}"
    prefix += ", Iraq labour law provides that "
    return f"{prefix}{body_text}"


def article_examples(article: Dict[str, object]) -> List[Dict[str, object]]:
    article_number = article.get("article_number")
    article_label = str(article.get("article_label", f"Article {article_number}"))
    chapter = normalize_space(str(article.get("chapter") or ""))
    original_text = normalize_space(str(article.get("original_text") or ""))
    body_text = normalize_space(strip_article_heading(original_text))

    if not body_text:
        return []

    examples: List[Dict[str, object]] = []

    for template in QUESTION_TEMPLATES:
        prompt = template.format(article_label=article_label)
        examples.append(
            {
                "task": "article_lookup",
                "source_article": article_number,
                "prompt": prompt,
                "answer": long_answer(article_label, chapter, body_text),
            }
        )

    if chapter:
        for template in CHAPTER_TEMPLATES:
            prompt = template.format(article_label=article_label, chapter=chapter)
            examples.append(
                {
                    "task": "chapter_lookup",
                    "source_article": article_number,
                    "prompt": prompt,
                    "answer": long_answer(article_label, chapter, body_text),
                }
            )

    examples.append(
        {
            "task": "plain_summary",
            "source_article": article_number,
            "prompt": f"Give me a short explanation of {article_label}.",
            "answer": short_answer(article_label, body_text),
        }
    )

    for term, definition in extract_definition_pairs(body_text):
        for template in DEFINITION_TEMPLATES:
            examples.append(
                {
                    "task": "definition",
                    "source_article": article_number,
                    "prompt": template.format(term=term),
                    "answer": f'In {article_label}, "{term}" means {definition}',
                }
            )

    return examples


def write_jsonl(path: Path, rows: Sequence[Dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False))
            handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a synthetic supervised Q&A dataset from Iraq labour law articles."
    )
    parser.add_argument(
        "--articles",
        default=str(DEFAULT_ARTICLES_PATH),
        help="Path to the segmented labour-law articles JSON.",
    )
    parser.add_argument(
        "--train-output",
        default=str(DEFAULT_TRAIN_PATH),
        help="Training JSONL output path.",
    )
    parser.add_argument(
        "--val-output",
        default=str(DEFAULT_VAL_PATH),
        help="Validation JSONL output path.",
    )
    parser.add_argument(
        "--metadata-output",
        default=str(DEFAULT_METADATA_PATH),
        help="Metadata JSON output path.",
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.1,
        help="Validation split ratio.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=7,
        help="Random seed for shuffling examples.",
    )
    args = parser.parse_args()

    random.seed(args.seed)
    articles = load_articles(Path(args.articles))

    rows: List[Dict[str, object]] = []
    for article in articles:
        rows.extend(article_examples(article))

    random.shuffle(rows)

    val_count = max(1, int(len(rows) * args.val_ratio))
    val_rows = rows[:val_count]
    train_rows = rows[val_count:]

    train_output = Path(args.train_output)
    val_output = Path(args.val_output)
    metadata_output = Path(args.metadata_output)

    write_jsonl(train_output, train_rows)
    write_jsonl(val_output, val_rows)

    task_counts: Dict[str, int] = {}
    for row in rows:
        task = str(row.get("task"))
        task_counts[task] = task_counts.get(task, 0) + 1

    metadata = {
        "article_count": len(articles),
        "total_examples": len(rows),
        "train_examples": len(train_rows),
        "val_examples": len(val_rows),
        "task_counts": task_counts,
        "note": "This dataset is synthetic and article-derived. Add human-written questions later for better quality.",
    }
    metadata_output.parent.mkdir(parents=True, exist_ok=True)
    metadata_output.write_text(f"{json.dumps(metadata, indent=2)}\n", encoding="utf-8")

    print(f"Wrote {len(train_rows)} training examples to {train_output}")
    print(f"Wrote {len(val_rows)} validation examples to {val_output}")
    print(f"Wrote metadata to {metadata_output}")


if __name__ == "__main__":
    main()
