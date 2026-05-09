from dataclasses import dataclass
from typing import Optional, Tuple

import torch
import torch.nn.functional as F
from torch import nn


@dataclass
class LegalGPTConfig:
    vocab_size: int
    block_size: int = 256
    n_layer: int = 6
    n_head: int = 6
    n_embd: int = 384
    dropout: float = 0.1
    bias: bool = True


class CausalSelfAttention(nn.Module):
    def __init__(self, config: LegalGPTConfig) -> None:
        super().__init__()
        if config.n_embd % config.n_head != 0:
            raise ValueError("n_embd must be divisible by n_head")

        self.n_head = config.n_head
        self.head_dim = config.n_embd // config.n_head
        self.dropout = config.dropout
        self.c_attn = nn.Linear(config.n_embd, 3 * config.n_embd, bias=config.bias)
        self.c_proj = nn.Linear(config.n_embd, config.n_embd, bias=config.bias)
        self.attn_dropout = nn.Dropout(config.dropout)
        self.resid_dropout = nn.Dropout(config.dropout)
        self.register_buffer(
            "bias_mask",
            torch.tril(torch.ones(config.block_size, config.block_size)).view(
                1, 1, config.block_size, config.block_size
            ),
            persistent=False,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch_size, seq_len, channels = x.size()
        q, k, v = self.c_attn(x).split(channels, dim=2)

        q = q.view(batch_size, seq_len, self.n_head, self.head_dim).transpose(1, 2)
        k = k.view(batch_size, seq_len, self.n_head, self.head_dim).transpose(1, 2)
        v = v.view(batch_size, seq_len, self.n_head, self.head_dim).transpose(1, 2)

        if hasattr(F, "scaled_dot_product_attention"):
            y = F.scaled_dot_product_attention(
                q,
                k,
                v,
                attn_mask=None,
                dropout_p=self.dropout if self.training else 0.0,
                is_causal=True,
            )
        else:
            att = (q @ k.transpose(-2, -1)) / (self.head_dim ** 0.5)
            att = att.masked_fill(self.bias_mask[:, :, :seq_len, :seq_len] == 0, float("-inf"))
            att = F.softmax(att, dim=-1)
            att = self.attn_dropout(att)
            y = att @ v

        y = y.transpose(1, 2).contiguous().view(batch_size, seq_len, channels)
        y = self.resid_dropout(self.c_proj(y))
        return y


class MLP(nn.Module):
    def __init__(self, config: LegalGPTConfig) -> None:
        super().__init__()
        self.c_fc = nn.Linear(config.n_embd, 4 * config.n_embd, bias=config.bias)
        self.gelu = nn.GELU()
        self.c_proj = nn.Linear(4 * config.n_embd, config.n_embd, bias=config.bias)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.c_fc(x)
        x = self.gelu(x)
        x = self.c_proj(x)
        x = self.dropout(x)
        return x


class Block(nn.Module):
    def __init__(self, config: LegalGPTConfig) -> None:
        super().__init__()
        self.ln_1 = nn.LayerNorm(config.n_embd, bias=config.bias)
        self.attn = CausalSelfAttention(config)
        self.ln_2 = nn.LayerNorm(config.n_embd, bias=config.bias)
        self.mlp = MLP(config)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.ln_1(x))
        x = x + self.mlp(self.ln_2(x))
        return x


class LegalGPT(nn.Module):
    def __init__(self, config: LegalGPTConfig) -> None:
        super().__init__()
        self.config = config

        self.transformer = nn.ModuleDict(
            {
                "wte": nn.Embedding(config.vocab_size, config.n_embd),
                "wpe": nn.Embedding(config.block_size, config.n_embd),
                "drop": nn.Dropout(config.dropout),
                "h": nn.ModuleList([Block(config) for _ in range(config.n_layer)]),
                "ln_f": nn.LayerNorm(config.n_embd, bias=config.bias),
            }
        )
        self.lm_head = nn.Linear(config.n_embd, config.vocab_size, bias=False)
        self.transformer["wte"].weight = self.lm_head.weight

        self.apply(self._init_weights)
        for name, parameter in self.named_parameters():
            if name.endswith("c_proj.weight"):
                nn.init.normal_(
                    parameter,
                    mean=0.0,
                    std=0.02 / (2 * config.n_layer) ** 0.5,
                )

    def _init_weights(self, module: nn.Module) -> None:
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(
        self,
        idx: torch.Tensor,
        targets: Optional[torch.Tensor] = None,
        loss_mask: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        batch_size, seq_len = idx.size()
        if seq_len > self.config.block_size:
            raise ValueError(
                f"Sequence length {seq_len} exceeds block size {self.config.block_size}"
            )

        pos = torch.arange(0, seq_len, dtype=torch.long, device=idx.device)
        tok_emb = self.transformer["wte"](idx)
        pos_emb = self.transformer["wpe"](pos)
        x = self.transformer["drop"](tok_emb + pos_emb)

        for block in self.transformer["h"]:
            x = block(x)

        x = self.transformer["ln_f"](x)
        logits = self.lm_head(x)

        loss = None
        if targets is not None:
            flat_logits = logits.view(-1, logits.size(-1))
            flat_targets = targets.view(-1)
            token_loss = F.cross_entropy(
                flat_logits,
                flat_targets,
                reduction="none",
                ignore_index=-1,
            )

            if loss_mask is not None:
                flat_mask = loss_mask.view(-1).float()
                denom = flat_mask.sum().clamp(min=1.0)
                loss = (token_loss * flat_mask).sum() / denom
            else:
                valid = (flat_targets != -1).float()
                denom = valid.sum().clamp(min=1.0)
                loss = (token_loss * valid).sum() / denom

        return logits, loss

    @torch.no_grad()
    def generate(
        self,
        idx: torch.Tensor,
        max_new_tokens: int,
        temperature: float = 1.0,
        top_k: Optional[int] = None,
        eos_token_id: Optional[int] = None,
    ) -> torch.Tensor:
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.config.block_size :]
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / max(temperature, 1e-5)

            if top_k is not None:
                values, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < values[:, [-1]]] = float("-inf")

            probs = F.softmax(logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)
            idx = torch.cat((idx, next_token), dim=1)

            if eos_token_id is not None and torch.all(next_token == eos_token_id):
                break

        return idx

    def configure_optimizers(
        self,
        weight_decay: float,
        learning_rate: float,
        betas: Tuple[float, float],
        device_type: str,
    ) -> torch.optim.Optimizer:
        param_dict = {name: param for name, param in self.named_parameters() if param.requires_grad}
        decay_params = [param for name, param in param_dict.items() if param.dim() >= 2]
        nodecay_params = [param for name, param in param_dict.items() if param.dim() < 2]

        optim_groups = [
            {"params": decay_params, "weight_decay": weight_decay},
            {"params": nodecay_params, "weight_decay": 0.0},
        ]

        fused_available = device_type == "cuda" and "fused" in torch.optim.AdamW.__init__.__code__.co_varnames
        extra_args = {"fused": True} if fused_available else {}
        return torch.optim.AdamW(
            optim_groups,
            lr=learning_rate,
            betas=betas,
            **extra_args,
        )
