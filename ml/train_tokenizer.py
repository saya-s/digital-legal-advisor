import argparse
import json
import tempfile
from pathlib import Path
from typing import Iterable, List

import sentencepiece as spm


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CORPUS_PATH = PROJECT_ROOT / "ml/data/law_corpus.txt"
DEFAULT_QA_TRAIN_PATH = PROJECT_ROOT / "ml/data/legal_qa_train.jsonl"
DEFAULT_QA_VAL_PATH = PROJECT_ROOT / "ml/data/legal_qa_val.jsonl"
DEFAULT_MODEL_PREFIX = PROJECT_ROOT / "ml/artifacts/tokenizer/iraq_law_bpe"


def load_jsonl_texts(path: Path) -> List[str]:
    if not path.exists():
        return []

    lines: List[str] = []
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            record = json.loads(raw_line)
            prompt = str(record.get("prompt", "")).strip()
            answer = str(record.get("answer", "")).strip()
            if prompt:
                lines.append(prompt)
            if answer:
                lines.append(answer)
    return lines


def iter_training_texts(corpus_path: Path, qa_paths: Iterable[Path]) -> List[str]:
    texts: List[str] = []

    if corpus_path.exists():
        texts.append(corpus_path.read_text(encoding="utf-8"))

    for qa_path in qa_paths:
        texts.extend(load_jsonl_texts(qa_path))

    return [text for text in texts if text.strip()]


def chunk_text(text: str, max_chars: int = 1800) -> List[str]:
    normalized_lines = [line.strip() for line in text.splitlines() if line.strip()]
    chunks: List[str] = []
    current = ""

    for line in normalized_lines:
        if len(line) > max_chars:
            words = line.split()
            partial = ""
            for word in words:
                candidate = f"{partial} {word}".strip()
                if partial and len(candidate) > max_chars:
                    chunks.append(partial)
                    partial = word
                else:
                    partial = candidate
            if partial:
                if current:
                    chunks.append(current)
                    current = ""
                chunks.append(partial)
            continue

        candidate = f"{current} {line}".strip()
        if current and len(candidate) > max_chars:
            chunks.append(current)
            current = line
        else:
            current = candidate

    if current:
        chunks.append(current)

    return chunks


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train a SentencePiece BPE tokenizer from scratch for Iraq labour law."
    )
    parser.add_argument(
        "--corpus",
        default=str(DEFAULT_CORPUS_PATH),
        help="Main corpus text file.",
    )
    parser.add_argument(
        "--qa-train",
        default=str(DEFAULT_QA_TRAIN_PATH),
        help="Training QA JSONL file to include in tokenizer training.",
    )
    parser.add_argument(
        "--qa-val",
        default=str(DEFAULT_QA_VAL_PATH),
        help="Validation QA JSONL file to include in tokenizer training.",
    )
    parser.add_argument(
        "--model-prefix",
        default=str(DEFAULT_MODEL_PREFIX),
        help="Tokenizer output prefix.",
    )
    parser.add_argument(
        "--vocab-size",
        type=int,
        default=2048,
        help="Vocabulary size for the tokenizer.",
    )
    args = parser.parse_args()

    corpus_path = Path(args.corpus)
    qa_paths = [Path(args.qa_train), Path(args.qa_val)]
    model_prefix = Path(args.model_prefix)
    model_prefix.parent.mkdir(parents=True, exist_ok=True)

    training_texts = iter_training_texts(corpus_path, qa_paths)
    if not training_texts:
        raise FileNotFoundError(
            "No tokenizer training text found. Run build_corpus.py and build_qa_dataset.py first."
        )

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
        for text in training_texts:
            for chunk in chunk_text(text):
                handle.write(chunk)
                handle.write("\n")
        temp_input_path = handle.name

    spm.SentencePieceTrainer.train(
        input=temp_input_path,
        model_prefix=str(model_prefix),
        model_type="bpe",
        vocab_size=args.vocab_size,
        character_coverage=1.0,
        bos_id=1,
        eos_id=2,
        pad_id=3,
        unk_id=0,
        user_defined_symbols=["<question>", "<answer>", "<cite>"],
        normalization_rule_name="nmt_nfkc",
        input_sentence_size=0,
        shuffle_input_sentence=True,
    )

    print(f"Tokenizer model written to {model_prefix}.model")
    print(f"Tokenizer vocab written to {model_prefix}.vocab")


if __name__ == "__main__":
    main()
