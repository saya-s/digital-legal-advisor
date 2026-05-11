import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTICLES_PATH = PROJECT_ROOT / "data/processed_laws/iraq_labour_law_articles.json"
DEFAULT_CLEAN_TEXT_PATH = PROJECT_ROOT / "data/processed_laws/iraq_labour_law_cleaned.txt"
DEFAULT_REFERENCE_TEXTS_DIR = PROJECT_ROOT / "data/processed_laws/reference_texts"
DEFAULT_OUTPUT_PATH = PROJECT_ROOT / "ml/data/law_corpus.txt"
DEFAULT_METADATA_PATH = PROJECT_ROOT / "ml/data/corpus_metadata.json"


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def strip_article_heading(text: str) -> str:
    return re.sub(r"^Article\s+\d+\s*[-–:]\s*", "", text).strip()


def load_articles(path: Path) -> List[Dict[str, object]]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_reference_texts(directory: Path) -> List[Dict[str, str]]:
    if not directory.exists():
        return []

    reference_texts: List[Dict[str, str]] = []

    for file_path in sorted(directory.glob("*.txt")):
        text = file_path.read_text(encoding="utf-8").strip()
        if not text:
            continue

        reference_texts.append(
            {
                "name": file_path.stem,
                "path": str(file_path),
                "text": text,
            }
        )

    return reference_texts


def build_article_sections(article: Dict[str, object]) -> Iterable[str]:
    article_number = article.get("article_number")
    article_label = str(article.get("article_label", f"Article {article_number}"))
    chapter = normalize_space(str(article.get("chapter") or ""))
    original_text = normalize_space(str(article.get("original_text") or ""))
    plain_body = normalize_space(strip_article_heading(original_text))

    if not original_text:
        return

    yield article_label
    yield original_text

    if chapter:
        yield f"{chapter}\n{original_text}"

    if plain_body:
        yield f"{article_label} means: {plain_body}"
        yield f"Question: What does {article_label} say?\nAnswer: {plain_body}"

    if chapter and plain_body:
        yield (
            f"Question: What is covered in {article_label} of {chapter}?\n"
            f"Answer: {plain_body}"
        )


def build_reference_sections(reference_text: Dict[str, str]) -> Iterable[str]:
    title = normalize_space(reference_text["name"].replace("-", " "))
    body = reference_text["text"]

    yield body
    yield f"Reference law: {title}\n{body}"
    yield f"Question: What does {title} cover?\nAnswer: {normalize_space(body[:1600])}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a raw text corpus for experimental local legal-model training."
    )
    parser.add_argument(
        "--articles",
        default=str(DEFAULT_ARTICLES_PATH),
        help="Path to an article-style legal dataset JSON. Defaults to the legacy labour-law export for compatibility.",
    )
    parser.add_argument(
        "--clean-text",
        default=str(DEFAULT_CLEAN_TEXT_PATH),
        help="Optional path to a cleaned full-law text file.",
    )
    parser.add_argument(
        "--reference-texts-dir",
        default=str(DEFAULT_REFERENCE_TEXTS_DIR),
        help="Optional directory of extra processed law text files to include.",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_PATH),
        help="Output corpus text file.",
    )
    parser.add_argument(
        "--metadata-output",
        default=str(DEFAULT_METADATA_PATH),
        help="Output metadata JSON file.",
    )
    args = parser.parse_args()

    articles_path = Path(args.articles)
    clean_text_path = Path(args.clean_text)
    reference_texts_dir = Path(args.reference_texts_dir)
    output_path = Path(args.output)
    metadata_path = Path(args.metadata_output)

    articles = load_articles(articles_path)
    reference_texts = load_reference_texts(reference_texts_dir)
    corpus_sections: List[str] = []

    clean_text = ""
    if clean_text_path.exists():
        clean_text = clean_text_path.read_text(encoding="utf-8").strip()
        if clean_text:
            corpus_sections.append(clean_text)

    for article in articles:
        corpus_sections.extend(build_article_sections(article))

    included_reference_texts = []
    for reference_text in reference_texts:
        if clean_text and normalize_space(reference_text["text"]) == normalize_space(clean_text):
            continue

        included_reference_texts.append(reference_text)
        corpus_sections.extend(build_reference_sections(reference_text))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)

    corpus_text = "\n\n".join(section for section in corpus_sections if section).strip()
    output_path.write_text(f"{corpus_text}\n", encoding="utf-8")

    metadata = {
        "source_articles_path": str(articles_path),
        "source_clean_text_path": str(clean_text_path),
        "reference_texts_dir": str(reference_texts_dir),
        "article_count": len(articles),
        "reference_document_count": len(included_reference_texts),
        "reference_documents_discovered": len(reference_texts),
        "section_count": len(corpus_sections),
        "character_count": len(corpus_text),
        "tokenizer_hint": "Train a tokenizer after this step with ml/train_tokenizer.py",
    }
    metadata_path.write_text(f"{json.dumps(metadata, indent=2)}\n", encoding="utf-8")

    print(f"Wrote corpus to {output_path}")
    print(f"Wrote metadata to {metadata_path}")
    print(f"Corpus characters: {metadata['character_count']}")


if __name__ == "__main__":
    main()
