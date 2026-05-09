import argparse
import json
import re
import sys
from pathlib import Path

import sentencepiece as spm
import torch

from model import LegalGPT, LegalGPTConfig


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOKENIZER_PATH = PROJECT_ROOT / "ml/artifacts/tokenizer/iraq_law_bpe.model"
DEFAULT_CHECKPOINT_PATH = PROJECT_ROOT / "ml/artifacts/checkpoints/sft_last.pt"


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def build_prompt(question: str, context: list[dict[str, str]]) -> str:
    context_lines = []

    for item in context[:2]:
        article_label = normalize_whitespace(item.get("article_label", "Article"))
        chapter = normalize_whitespace(item.get("chapter", ""))
        excerpt = normalize_whitespace(item.get("excerpt", ""))
        prefix = f"{article_label}"
        if chapter:
            prefix = f"{prefix} ({chapter})"
        context_lines.append(f"{prefix}: {excerpt}")

    context_block = "\n".join(context_lines) if context_lines else "No context provided."
    return (
        "<question> Use only the Iraq labour-law context below. "
        "Answer in simple language using two to four sentences. "
        "If the context does not clearly answer the question, say that clearly.\n"
        f"Context:\n{context_block}\n"
        f"User question: {normalize_whitespace(question)}\n"
        "<answer>"
    )


def clean_answer(generated_text: str) -> str:
    answer = generated_text

    if "<answer>" in answer:
        answer = answer.split("<answer>", 1)[1]

    answer = re.split(r"<question>", answer, maxsplit=1)[0]
    answer = answer.replace("</s>", " ")
    answer = normalize_whitespace(answer)
    return answer


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Answer an Iraq labour-law question with the local fine-tuned model."
    )
    parser.add_argument(
        "--tokenizer-model",
        default=str(DEFAULT_TOKENIZER_PATH),
        help="SentencePiece tokenizer model.",
    )
    parser.add_argument(
        "--checkpoint",
        default=str(DEFAULT_CHECKPOINT_PATH),
        help="Model checkpoint path.",
    )
    parser.add_argument("--max-new-tokens", type=int, default=96, help="Maximum new tokens.")
    args = parser.parse_args()

    payload = json.load(sys.stdin)
    question = str(payload.get("question", "")).strip()
    context = payload.get("context", [])

    if not question:
        raise ValueError("Question is required.")

    checkpoint = torch.load(Path(args.checkpoint), map_location="cpu")
    config = LegalGPTConfig(**checkpoint["config"])
    model = LegalGPT(config)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    tokenizer = spm.SentencePieceProcessor(model_file=str(Path(args.tokenizer_model)))
    prompt = build_prompt(question, context)
    prompt_ids = tokenizer.encode(prompt, out_type=int)
    input_ids = torch.tensor([prompt_ids], dtype=torch.long)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=args.max_new_tokens,
            temperature=0.2,
            top_k=1,
            eos_token_id=tokenizer.eos_id(),
        )

    generated_text = tokenizer.decode(output_ids[0].tolist())
    answer = clean_answer(generated_text)
    json.dump({"answer": answer}, sys.stdout)


if __name__ == "__main__":
    main()
