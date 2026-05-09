import argparse
import json
import math
from dataclasses import asdict
from pathlib import Path
from typing import Tuple

import sentencepiece as spm
import torch

from model import LegalGPT, LegalGPTConfig


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CORPUS_PATH = PROJECT_ROOT / "ml/data/law_corpus.txt"
DEFAULT_TOKENIZER_PATH = PROJECT_ROOT / "ml/artifacts/tokenizer/iraq_law_bpe.model"
DEFAULT_CHECKPOINT_DIR = PROJECT_ROOT / "ml/artifacts/checkpoints"


class TokenSequenceDataset:
    def __init__(self, token_ids: torch.Tensor, block_size: int) -> None:
        if token_ids.numel() <= block_size:
            raise ValueError("Not enough token ids for the chosen block size.")
        self.token_ids = token_ids
        self.block_size = block_size

    def sample_batch(self, batch_size: int, device: torch.device) -> Tuple[torch.Tensor, torch.Tensor]:
        max_start = self.token_ids.size(0) - self.block_size - 1
        starts = torch.randint(0, max_start, (batch_size,))
        inputs = torch.stack([self.token_ids[start : start + self.block_size] for start in starts])
        targets = torch.stack([self.token_ids[start + 1 : start + 1 + self.block_size] for start in starts])
        return inputs.to(device), targets.to(device)


def encode_corpus(tokenizer_model: Path, corpus_path: Path) -> torch.Tensor:
    sp = spm.SentencePieceProcessor(model_file=str(tokenizer_model))
    text = corpus_path.read_text(encoding="utf-8")
    ids = sp.encode(text, out_type=int)
    return torch.tensor(ids, dtype=torch.long)


def estimate_loss(
    model: LegalGPT,
    train_data: TokenSequenceDataset,
    val_data: TokenSequenceDataset,
    batch_size: int,
    eval_iters: int,
    device: torch.device,
) -> dict:
    out = {}
    model.eval()
    for split_name, dataset in (("train", train_data), ("val", val_data)):
        losses = torch.zeros(eval_iters)
        for iteration in range(eval_iters):
            xb, yb = dataset.sample_batch(batch_size, device)
            _, loss = model(xb, yb)
            losses[iteration] = loss.item()
        out[split_name] = losses.mean().item()
    model.train()
    return out


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pretrain a tiny decoder-only Transformer on Iraq labour law text."
    )
    parser.add_argument("--corpus", default=str(DEFAULT_CORPUS_PATH), help="Text corpus file.")
    parser.add_argument(
        "--tokenizer-model",
        default=str(DEFAULT_TOKENIZER_PATH),
        help="SentencePiece tokenizer model.",
    )
    parser.add_argument(
        "--checkpoint-dir",
        default=str(DEFAULT_CHECKPOINT_DIR),
        help="Directory for checkpoints.",
    )
    parser.add_argument("--train-steps", type=int, default=1500, help="Training iterations.")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size.")
    parser.add_argument("--block-size", type=int, default=256, help="Context length.")
    parser.add_argument("--n-layer", type=int, default=6, help="Number of transformer blocks.")
    parser.add_argument("--n-head", type=int, default=6, help="Attention heads.")
    parser.add_argument("--n-embd", type=int, default=384, help="Embedding width.")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout.")
    parser.add_argument("--learning-rate", type=float, default=3e-4, help="Learning rate.")
    parser.add_argument("--weight-decay", type=float, default=0.1, help="Weight decay.")
    parser.add_argument("--eval-interval", type=int, default=100, help="Eval interval.")
    parser.add_argument("--eval-iters", type=int, default=20, help="Eval iterations.")
    parser.add_argument("--save-interval", type=int, default=250, help="Checkpoint interval.")
    parser.add_argument("--val-ratio", type=float, default=0.1, help="Validation token split.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    corpus_path = Path(args.corpus)
    tokenizer_model = Path(args.tokenizer_model)
    checkpoint_dir = Path(args.checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    tokens = encode_corpus(tokenizer_model, corpus_path)
    split_index = int(tokens.numel() * (1 - args.val_ratio))
    train_tokens = tokens[:split_index]
    val_tokens = tokens[split_index:]

    train_data = TokenSequenceDataset(train_tokens, args.block_size)
    val_data = TokenSequenceDataset(val_tokens, args.block_size)

    vocab_size = spm.SentencePieceProcessor(model_file=str(tokenizer_model)).vocab_size()
    config = LegalGPTConfig(
        vocab_size=vocab_size,
        block_size=args.block_size,
        n_layer=args.n_layer,
        n_head=args.n_head,
        n_embd=args.n_embd,
        dropout=args.dropout,
    )
    model = LegalGPT(config).to(device)
    optimizer = model.configure_optimizers(
        weight_decay=args.weight_decay,
        learning_rate=args.learning_rate,
        betas=(0.9, 0.95),
        device_type=device.type,
    )

    print(f"Training on {device.type} with {tokens.numel()} total tokens")
    print(f"Train tokens: {train_tokens.numel()} | Val tokens: {val_tokens.numel()}")

    for step in range(1, args.train_steps + 1):
        xb, yb = train_data.sample_batch(args.batch_size, device)
        _, loss = model(xb, yb)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()

        if step % args.eval_interval == 0 or step == 1 or step == args.train_steps:
            losses = estimate_loss(
                model,
                train_data,
                val_data,
                args.batch_size,
                args.eval_iters,
                device,
            )
            print(
                f"step {step:5d} | train loss {losses['train']:.4f} | val loss {losses['val']:.4f}"
            )

        if step % args.save_interval == 0 or step == args.train_steps:
            checkpoint_path = checkpoint_dir / f"lm_step_{step}.pt"
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "config": asdict(config),
                    "step": step,
                    "loss": loss.item(),
                    "train_args": vars(args),
                },
                checkpoint_path,
            )

    final_path = checkpoint_dir / "lm_last.pt"
    torch.save(
        {
            "model_state": model.state_dict(),
            "config": asdict(config),
            "step": args.train_steps,
            "train_args": vars(args),
        },
        final_path,
    )

    summary_path = checkpoint_dir / "lm_summary.json"
    summary_path.write_text(
        json.dumps(
            {
                "device": device.type,
                "total_tokens": int(tokens.numel()),
                "train_tokens": int(train_tokens.numel()),
                "val_tokens": int(val_tokens.numel()),
                "parameter_count": sum(p.numel() for p in model.parameters()),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"Saved final LM checkpoint to {final_path}")
    print(f"Saved training summary to {summary_path}")


if __name__ == "__main__":
    main()
