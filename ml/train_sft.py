import argparse
import json
from dataclasses import asdict
from pathlib import Path
from typing import Dict, List, Tuple

import sentencepiece as spm
import torch

from model import LegalGPT, LegalGPTConfig


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRAIN_PATH = PROJECT_ROOT / "ml/data/legal_qa_train.jsonl"
DEFAULT_VAL_PATH = PROJECT_ROOT / "ml/data/legal_qa_val.jsonl"
DEFAULT_TOKENIZER_PATH = PROJECT_ROOT / "ml/artifacts/tokenizer/iraq_law_bpe.model"
DEFAULT_CHECKPOINT_DIR = PROJECT_ROOT / "ml/artifacts/checkpoints"


class SupervisedExampleDataset:
    def __init__(
        self,
        rows: List[Dict[str, object]],
        tokenizer: spm.SentencePieceProcessor,
        block_size: int,
    ) -> None:
        self.rows = rows
        self.tokenizer = tokenizer
        self.block_size = block_size
        self.examples = [self.encode_row(row) for row in rows]

    def encode_row(self, row: Dict[str, object]) -> Dict[str, torch.Tensor]:
        prompt = str(row.get("prompt", "")).strip()
        answer = str(row.get("answer", "")).strip()

        prompt_text = f"<question> {prompt} <answer>"
        full_text = f"{prompt_text} {answer}"

        prompt_ids = self.tokenizer.encode(prompt_text, out_type=int)
        full_ids = self.tokenizer.encode(full_text, out_type=int)
        eos_id = self.tokenizer.eos_id()
        if eos_id >= 0:
            full_ids.append(eos_id)

        full_ids = full_ids[: self.block_size + 1]
        input_ids = full_ids[:-1]
        target_ids = full_ids[1:]

        loss_mask = []
        answer_start = max(0, len(prompt_ids) - 1)
        for index in range(len(target_ids)):
            loss_mask.append(1 if index >= answer_start else 0)

        pad_id = self.tokenizer.pad_id()
        if pad_id < 0:
            pad_id = self.tokenizer.eos_id()

        while len(input_ids) < self.block_size:
            input_ids.append(pad_id)
            target_ids.append(-1)
            loss_mask.append(0)

        return {
            "input_ids": torch.tensor(input_ids[: self.block_size], dtype=torch.long),
            "target_ids": torch.tensor(target_ids[: self.block_size], dtype=torch.long),
            "loss_mask": torch.tensor(loss_mask[: self.block_size], dtype=torch.long),
        }

    def sample_batch(
        self, batch_size: int, device: torch.device
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        indices = torch.randint(0, len(self.examples), (batch_size,))
        batch = [self.examples[i] for i in indices.tolist()]
        input_ids = torch.stack([item["input_ids"] for item in batch]).to(device)
        target_ids = torch.stack([item["target_ids"] for item in batch]).to(device)
        loss_mask = torch.stack([item["loss_mask"] for item in batch]).to(device)
        return input_ids, target_ids, loss_mask


def load_jsonl(path: Path) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    with path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            rows.append(json.loads(raw_line))
    return rows


def estimate_loss(
    model: LegalGPT,
    train_data: SupervisedExampleDataset,
    val_data: SupervisedExampleDataset,
    batch_size: int,
    eval_iters: int,
    device: torch.device,
) -> dict:
    out = {}
    model.eval()
    for split_name, dataset in (("train", train_data), ("val", val_data)):
        losses = torch.zeros(eval_iters)
        for iteration in range(eval_iters):
            xb, yb, mask = dataset.sample_batch(batch_size, device)
            _, loss = model(xb, yb, loss_mask=mask)
            losses[iteration] = loss.item()
        out[split_name] = losses.mean().item()
    model.train()
    return out


def build_model(args: argparse.Namespace, tokenizer: spm.SentencePieceProcessor) -> LegalGPT:
    if args.init_checkpoint:
        checkpoint = torch.load(args.init_checkpoint, map_location="cpu")
        config = LegalGPTConfig(**checkpoint["config"])
        model = LegalGPT(config)
        model.load_state_dict(checkpoint["model_state"])
        return model

    return LegalGPT(
        LegalGPTConfig(
            vocab_size=tokenizer.vocab_size(),
            block_size=args.block_size,
            n_layer=args.n_layer,
            n_head=args.n_head,
            n_embd=args.n_embd,
            dropout=args.dropout,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Supervised fine-tuning for Iraq labour-law legal Q&A."
    )
    parser.add_argument("--train-data", default=str(DEFAULT_TRAIN_PATH), help="Training JSONL file.")
    parser.add_argument("--val-data", default=str(DEFAULT_VAL_PATH), help="Validation JSONL file.")
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
    parser.add_argument(
        "--init-checkpoint",
        default="",
        help="Optional pretrained LM checkpoint to load before fine-tuning.",
    )
    parser.add_argument("--train-steps", type=int, default=800, help="Training iterations.")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size.")
    parser.add_argument("--block-size", type=int, default=256, help="Context length.")
    parser.add_argument("--n-layer", type=int, default=6, help="Number of transformer blocks.")
    parser.add_argument("--n-head", type=int, default=6, help="Attention heads.")
    parser.add_argument("--n-embd", type=int, default=384, help="Embedding width.")
    parser.add_argument("--dropout", type=float, default=0.1, help="Dropout.")
    parser.add_argument("--learning-rate", type=float, default=2e-4, help="Learning rate.")
    parser.add_argument("--weight-decay", type=float, default=0.05, help="Weight decay.")
    parser.add_argument("--eval-interval", type=int, default=100, help="Eval interval.")
    parser.add_argument("--eval-iters", type=int, default=20, help="Eval iterations.")
    parser.add_argument("--save-interval", type=int, default=200, help="Checkpoint interval.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer = spm.SentencePieceProcessor(model_file=str(Path(args.tokenizer_model)))
    train_rows = load_jsonl(Path(args.train_data))
    val_rows = load_jsonl(Path(args.val_data))

    train_data = SupervisedExampleDataset(train_rows, tokenizer, args.block_size)
    val_data = SupervisedExampleDataset(val_rows, tokenizer, args.block_size)

    model = build_model(args, tokenizer).to(device)
    optimizer = model.configure_optimizers(
        weight_decay=args.weight_decay,
        learning_rate=args.learning_rate,
        betas=(0.9, 0.95),
        device_type=device.type,
    )

    checkpoint_dir = Path(args.checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    for step in range(1, args.train_steps + 1):
        xb, yb, mask = train_data.sample_batch(args.batch_size, device)
        _, loss = model(xb, yb, loss_mask=mask)
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
            checkpoint_path = checkpoint_dir / f"sft_step_{step}.pt"
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "config": asdict(model.config),
                    "step": step,
                    "loss": loss.item(),
                    "train_args": vars(args),
                },
                checkpoint_path,
            )

    final_path = checkpoint_dir / "sft_last.pt"
    torch.save(
        {
            "model_state": model.state_dict(),
            "config": asdict(model.config),
            "step": args.train_steps,
            "train_args": vars(args),
        },
        final_path,
    )
    print(f"Saved final SFT checkpoint to {final_path}")


if __name__ == "__main__":
    main()
