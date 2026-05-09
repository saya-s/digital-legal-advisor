import argparse
from pathlib import Path

import sentencepiece as spm
import torch

from model import LegalGPT, LegalGPTConfig


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOKENIZER_PATH = PROJECT_ROOT / "ml/artifacts/tokenizer/iraq_law_bpe.model"
DEFAULT_CHECKPOINT_PATH = PROJECT_ROOT / "ml/artifacts/checkpoints/sft_last.pt"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate text with the local Iraq labour-law model.")
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
    parser.add_argument(
        "--prompt",
        required=True,
        help='Prompt text, for example: "<question> What is Article 7? <answer>"',
    )
    parser.add_argument("--max-new-tokens", type=int, default=80, help="Maximum new tokens.")
    parser.add_argument("--temperature", type=float, default=0.8, help="Sampling temperature.")
    parser.add_argument("--top-k", type=int, default=20, help="Top-k sampling.")
    args = parser.parse_args()

    checkpoint = torch.load(Path(args.checkpoint), map_location="cpu")
    config = LegalGPTConfig(**checkpoint["config"])
    model = LegalGPT(config)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    tokenizer = spm.SentencePieceProcessor(model_file=str(Path(args.tokenizer_model)))
    prompt_ids = tokenizer.encode(args.prompt, out_type=int)
    input_ids = torch.tensor([prompt_ids], dtype=torch.long)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_new_tokens=args.max_new_tokens,
            temperature=args.temperature,
            top_k=args.top_k,
            eos_token_id=tokenizer.eos_id(),
        )

    text = tokenizer.decode(output_ids[0].tolist())
    print(text)


if __name__ == "__main__":
    main()
