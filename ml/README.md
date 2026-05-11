# Experimental Local Legal QA Model

This folder contains an experimental local legal-language-model workflow for
the Digital Legal Advisor project.

Important context:

- The live app is now broader than a single labour-law dataset.
- The production legal Q&A flow is retrieval-first and grounded in the loaded
  law library, with citations returned from backend search.
- This `ml/` directory is a research and prototyping area for local model
  experiments. It is not the main source of truth for what the app currently
  knows.

Today, the application-level legal search is driven by processed law data under
`data/processed_laws/`, including the multi-law chunk index used by the
backend. These ML scripts are still most useful when you have an article-style
JSON dataset for supervised experiments.

The workflow is intentionally split into small steps:

1. Extract reusable plain text from all source law files.
2. Build a text corpus from processed legal texts.
3. Build a supervised question/answer dataset from article-style legal records.
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
  build_corpus.py         # creates a raw LM corpus from processed legal texts
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

- the article-style dataset passed to `--articles`
- the optional cleaned full-law text passed to `--clean-text`
- any extra processed legal reference texts under `data/processed_laws/reference_texts/`

Note: the default script inputs still point to the older labour-law article
files for backward compatibility. If you want broader ML experiments, point the
scripts at a wider article-style dataset export.

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
  --prompt "<question> What does Article 14 say? <answer>"
```

## Recommended first experiments

- Keep the model small at first: `6` layers, `384` hidden size, `6` heads.
- Use a short context window like `256` or `384`.
- Start with `2048` vocabulary because the dataset is still small.
- Expect weak generations at first. The important milestone is a working end to
  end training loop with your own tokenizer and random-initialized weights.

## Important limitations

- The default legacy article dataset is still narrow unless you replace it with
  a broader article-style export.
- The model may memorize text instead of learning deeper generalization.
- Legal answers must still be checked against source articles.
- The current app still relies on retrieval plus citations even when local model
  generation is available.
- Contract-aware upload analysis and contract-specific Q&A are handled in the
  application layer and are not fully trained in this folder.
