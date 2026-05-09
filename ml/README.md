# Iraq Labour Law Model

This folder is the starting point for a small legal language model trained from
zero on Iraq labour law materials already in this repository.

The workflow is intentionally split into small steps:

1. Extract reusable plain text from all source law files.
2. Build a text corpus from the processed law dataset.
3. Build a supervised question/answer dataset from the articles.
4. Train a tokenizer from scratch.
5. Pretrain a tiny decoder-only Transformer with next-token prediction.
6. Fine-tune the same model on legal Q&A prompts.
7. Run generation locally for experiments.

This is a learning and prototyping stack, not a production-ready legal model.
The current law dataset is still very small, so early generations will be
limited and may memorize heavily.

## Project layout

```text
ml/
  artifacts/              # generated tokenizer models, checkpoints, logs
  data/                   # generated corpus and QA datasets
  build_corpus.py         # creates raw LM corpus from Iraq labour law data
  build_qa_dataset.py     # creates synthetic supervised Q&A pairs
  train_tokenizer.py      # trains a BPE tokenizer from scratch
  model.py                # tiny GPT-style model implementation
  train_lm.py             # next-token pretraining
  train_sft.py            # supervised fine-tuning on legal QA pairs
  generate.py             # local text generation script
  requirements.txt
```

## Install

Create a Python environment and install the dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
```

## Step 1: Build the corpus

Before building the corpus, extract text from all files in `data/raw_laws/`:

```bash
node backend/scripts/buildLegalReferenceTexts.js
```

Default outputs:

- `data/processed_laws/reference_texts/*.txt`
- `data/processed_laws/reference_texts/metadata.json`

## Step 2: Build the corpus

```bash
python3 ml/build_corpus.py
```

Default outputs:

- `ml/data/law_corpus.txt`
- `ml/data/corpus_metadata.json`

The corpus builder now includes:

- the segmented Iraq labour law articles
- the cleaned full labour-law text
- any extra processed legal reference texts under `data/processed_laws/reference_texts/`

## Step 3: Build supervised legal Q&A data

```bash
python3 ml/build_qa_dataset.py
```

Default outputs:

- `ml/data/legal_qa_train.jsonl`
- `ml/data/legal_qa_val.jsonl`
- `ml/data/legal_qa_metadata.json`

## Step 4: Train a tokenizer from scratch

```bash
python3 ml/train_tokenizer.py --vocab-size 2048
```

Default outputs:

- `ml/artifacts/tokenizer/iraq_law_bpe.model`
- `ml/artifacts/tokenizer/iraq_law_bpe.vocab`

## Step 5: Pretrain the language model

```bash
python3 ml/train_lm.py \
  --tokenizer-model ml/artifacts/tokenizer/iraq_law_bpe.model \
  --train-steps 1500 \
  --batch-size 16
```

This stage teaches the model the shape of the law text itself.

## Step 6: Fine-tune for question answering

```bash
python3 ml/train_sft.py \
  --tokenizer-model ml/artifacts/tokenizer/iraq_law_bpe.model \
  --init-checkpoint ml/artifacts/checkpoints/lm_last.pt \
  --train-steps 800
```

This stage teaches the model how to map prompts to plain-language answers.

## Step 7: Generate answers

```bash
python3 ml/generate.py \
  --tokenizer-model ml/artifacts/tokenizer/iraq_law_bpe.model \
  --checkpoint ml/artifacts/checkpoints/sft_last.pt \
  --prompt "<question> What is the minimum working age in Iraq? <answer>"
```

## Recommended first experiments

- Keep the model small at first: `6` layers, `384` hidden size, `6` heads.
- Use a short context window like `256` or `384`.
- Start with `2048` vocabulary because the dataset is still small.
- Expect weak generations at first. The important milestone is a working end to
  end training loop with your own tokenizer and random-initialized weights.

## Important limitations

- `171` labour-law articles are not enough for a strong foundation model.
- The model may memorize text instead of learning deeper generalization.
- Legal answers must still be checked against source articles.
- For a real product, you will likely want retrieval plus citations even after
  training your own model.
