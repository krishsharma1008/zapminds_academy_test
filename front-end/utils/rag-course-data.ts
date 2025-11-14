export type RagExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type RagExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: RagExerciseTest[];
};

export type RagModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: RagExercise;
};

export type RagCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type RagCourse = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: RagModule[];
  capstone: RagCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const ragCourseContent: RagCourse = {
  courseId: "rag",
  title: "Retrieval Augmented Generation",
  hero: {
    headline: "Retrieval Augmented Generation",
    kicker: "Expert · Knowledge Systems",
    description:
      "Architect RAG stacks that stay fresh, cite sources, and withstand production traffic. Work through ingestion, chunking, ranking, and evaluation with code you can ship.",
    progressPercent: 51,
  },
  modules: [
    {
      id: "rag-ingestion-contracts",
      title: "Ingestion Contracts & Source Registry",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Define structured source registries so ingestion workers know freshness guarantees, auth scopes, and retry policies before syncing content.",
      learningObjectives: [
        "Model ingestion sources with freshness and credential metadata",
        "Validate configuration fields and provide sensible defaults",
        "Surface actionable errors when required fields missing",
      ],
      reading: [
        {
          label: "Designing RAG Pipelines",
          url: "https://www.pinecone.io/learn/rag/",
        },
      ],
      codeConcepts: ["dataclasses", "type validation", "defaults"],
      exercise: {
        id: "exercise-source-registry",
        title: "Validate Source Registry",
        prompt:
          "Implement build_source(entry) returning a normalised dict with keys id, type, refresh_minutes, and auth. Reject entries missing id/type or invalid refresh_minutes.",
        starterCode: code(`
from dataclasses import dataclass
from typing import Any, Dict


def build_source(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and normalise ingestion source entries."""
    # TODO: ensure required fields and normalise refresh/auth defaults
    ...
`),
        hints: [
          "Require entry['id'] and entry['type'] as non-empty strings.",
          "Default refresh_minutes to 1440 when unspecified.",
          "Auth can default to {} but ensure it is a dict when provided.",
        ],
        tests: [
          {
            id: "normalises",
            description: "Returns normalised payload with defaults.",
            assertion: assertion(`
def __test__():
    result = build_source({"id": "docs", "type": "notion"})
    return result == {"id": "docs", "type": "notion", "refresh_minutes": 1440, "auth": {}}
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid",
            description: "Rejects sources without required fields.",
            assertion: assertion(`
def __test__():
    try:
        build_source({"type": "drive"})
    except ValueError:
        return True
    return False
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-deduping",
      title: "Document Deduping & Canonicalisation",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Normalise documents across sources by removing near duplicates and tracking canonical fingerprints for reprocessing.",
      learningObjectives: [
        "Compute stable fingerprints from document payloads",
        "Filter duplicates while preserving newest revision",
        "Return metadata describing replacements",
      ],
      reading: [
        {
          label: "Semantic Deduplication Strategies",
          url: "https://www.elastic.co/blog/near-duplicate-detection-elasticsearch",
        },
      ],
      codeConcepts: ["hashlib", "sorting", "dicts"],
      exercise: {
        id: "exercise-dedupe",
        title: "Canonicalise Documents",
        prompt:
          "Implement dedupe_documents(documents) returning (unique_docs, replacements). unique_docs is list of dicts with canonical=True for retained doc. replacements maps duplicate id to kept id.",
        starterCode: code(`
import hashlib
from typing import Dict, Iterable, List, Tuple


def _fingerprint(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def dedupe_documents(documents: Iterable[Dict[str, str]]) -> Tuple[List[Dict[str, str]], Dict[str, str]]:
    """Return canonical documents and map of duplicates to canonical ids."""
    # TODO: keep latest revision per fingerprint and mark canonical flag
    ...
`),
        hints: [
          "Use document['updated_at'] to pick the newest duplicate.",
          "Add canonical key to retained docs: True for kept, False otherwise.",
          "Record replacements[duplicate_id] = kept_id.",
        ],
        tests: [
          {
            id: "dedupes",
            description: "Keeps latest duplicate and records mapping.",
            assertion: assertion(`
def __test__():
    docs = [
        {"id": "a1", "content": "Hello", "updated_at": "2024-01-01"},
        {"id": "a2", "content": "Hello", "updated_at": "2024-02-01"},
    ]
    uniques, replacements = dedupe_documents(docs)
    return len(uniques) == 1 and uniques[0]["id"] == "a2" and replacements == {"a1": "a2"}
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-chunking-strategy",
      title: "Adaptive Chunk Sizes",
      duration: "16 min",
      difficulty: "core",
      overview:
        "Implement sliding window chunking that adapts to headings and code blocks while meeting token limits.",
      learningObjectives: [
        "Split documents by paragraph while respecting max tokens",
        "Apply overlap for smooth retrieval context",
        "Annotate chunks with parent identifiers",
      ],
      reading: [
        {
          label: "Chunking Practices for RAG",
          url: "https://docs.langchain.com/docs/best-practices/chunking",
        },
      ],
      codeConcepts: ["text processing", "enumerate", "math.ceil"],
      exercise: {
        id: "exercise-adaptive-chunks",
        title: "Adaptive Chunker",
        prompt:
          "Implement adaptive_chunks(paragraphs, max_tokens, overlap_tokens) returning list of dicts with 'content', 'start', and 'end' indices using paragraph lengths as token proxies.",
        starterCode: code(`
from typing import Dict, Iterable, List


def adaptive_chunks(paragraphs: Iterable[str], max_tokens: int, overlap_tokens: int = 0) -> List[Dict[str, int | str]]:
    """Slice paragraphs into overlapped windows by token count."""
    # TODO: accumulate paragraph lengths, apply overlap, and record positions
    ...
`),
        hints: [
          "Use len(paragraph.split()) as token proxy.",
          "Advance pointer by chunk_size - overlap_tokens.",
          "Combine paragraphs into single string separated by newline.",
        ],
        tests: [
          {
            id: "chunk-flow",
            description: "Produces overlapped windows with metadata.",
            assertion: assertion(`
def __test__():
    paras = ["Intro", "Architecture details", "Evaluation checklist"]
    chunks = adaptive_chunks(paras, max_tokens=4, overlap_tokens=1)
    return len(chunks) == 2 and chunks[0]["start"] == 0 and chunks[1]["start"] == 2
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-vectorisation",
      title: "Vectorisation Pipelines",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Build embedding pipelines with batching, retry logic, and metadata tagging for provenance.",
      learningObjectives: [
        "Batch inputs for embedding endpoints",
        "Retry failed batches with exponential backoff",
        "Attach metadata linking chunk ids to embeddings",
      ],
      reading: [
        {
          label: "Building Vector Pipelines",
          url: "https://platform.openai.com/docs/guides/embeddings",
        },
      ],
      codeConcepts: ["asyncio", "retry logic", "typing"],
      exercise: {
        id: "exercise-embed-batch",
        title: "Batch Embedding Runner",
        prompt:
          "Implement embed_batches(chunks, embed_fn, batch_size=32, max_retries=3) returning list of dicts {id, embedding}. chunks is iterable of dicts with id/content.",
        starterCode: code(`
from typing import Awaitable, Callable, Dict, Iterable, List, Sequence


async def embed_batches(
    chunks: Iterable[Dict[str, str]],
    embed_fn: Callable[[Sequence[str]], Awaitable[Sequence[Sequence[float]]]],
    batch_size: int = 32,
    max_retries: int = 3,
) -> List[Dict[str, object]]:
    """Generate embeddings for chunks in resilient batches."""
    # TODO: batch inputs, retry failures, and pair embeddings with ids
    ...
`),
        hints: [
          "Group chunks into lists of size batch_size.",
          "On exception, retry with exponential backoff (2**attempt).",
          "Return embeddings as plain Python lists to avoid coroutine leakage.",
        ],
        tests: [
          {
            id: "embeds",
            description: "Produces embeddings paired with ids.",
            assertion: assertion(`
import asyncio


class Dummy:
    def __init__(self):
        self.calls = 0

    async def __call__(self, payload):
        self.calls += 1
        return [[float(len(text))] for text in payload]


def __test__():
    dummy = Dummy()
    chunks = [{"id": "c1", "content": "hello"}, {"id": "c2", "content": "zap"}]
    result = asyncio.run(embed_batches(chunks, dummy, batch_size=1))
    return result[0]["embedding"] == [5.0] and dummy.calls == 2
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-storage",
      title: "Index Storage & TTL Policies",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Manage vector storage with TTLs, upserts, and soft deletes that keep retrieval fast without stale content.",
      learningObjectives: [
        "Identify expired vectors by timestamp",
        "Batch deletions and upserts",
        "Return summary statistics for observability",
      ],
      reading: [
        {
          label: "Managing Vector Databases",
          url: "https://qdrant.tech/articles/vector-database-operations/",
        },
      ],
      codeConcepts: ["datetime", "list operations", "aggregation"],
      exercise: {
        id: "exercise-index-maintenance",
        title: "Index Maintenance Planner",
        prompt:
          "Implement plan_index_operations(entries, ttl_minutes) returning dict with keys delete and upsert listing ids to remove or refresh based on `updated_at` iso timestamps.",
        starterCode: code(`
from datetime import datetime, timedelta
from typing import Dict, Iterable, List


def plan_index_operations(entries: Iterable[Dict[str, str]], ttl_minutes: int) -> Dict[str, List[str]]:
    """Plan index deletes and upserts respecting TTL."""
    # TODO: compare timestamps with now and bucket into delete/upsert lists
    ...
`),
        hints: [
          "Use datetime.utcnow() for now.",
          "If now - updated_at > ttl, schedule delete; else upsert.",
          "Skip entries missing timestamps but include them in upserts for safety.",
        ],
        tests: [
          {
            id: "plan",
            description: "Splits entries into delete vs upsert.",
            assertion: assertion(`
from datetime import datetime, timedelta


def __test__():
    now = datetime.utcnow()
    entries = [
        {"id": "fresh", "updated_at": (now.isoformat())},
        {"id": "stale", "updated_at": (now - timedelta(minutes=120)).isoformat()},
    ]
    plan = plan_index_operations(entries, ttl_minutes=60)
    return plan["delete"] == ["stale"] and plan["upsert"] == ["fresh"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-ranking",
      title: "Hybrid Ranking & Signals",
      duration: "19 min",
      difficulty: "challenge",
      overview:
        "Blend dense scores, BM25, and freshness weights into a combined ranker that stays explainable.",
      learningObjectives: [
        "Normalise heterogeneous scores into comparable ranges",
        "Combine weights using configurable coefficients",
        "Return ranked items with component breakdown",
      ],
      reading: [
        {
          label: "Hybrid Search Techniques",
          url: "https://www.zilliz.com/blog/hybrid-search-milvus",
        },
      ],
      codeConcepts: ["math", "sorting", "dict manipulation"],
      exercise: {
        id: "exercise-hybrid-rank",
        title: "Hybrid Reranker",
        prompt:
          "Implement hybrid_rank(query_scores) returning list of dicts sorted by final score. query_scores maps doc id to dict with dense, sparse, freshness, and weights for each signal.",
        starterCode: code(`
from typing import Dict, List


def hybrid_rank(query_scores: Dict[str, Dict[str, float]]) -> List[Dict[str, float]]:
    """Return ranked docs with combined hybrid scores."""
    # TODO: normalise and combine component scores safely
    ...
`),
        hints: [
          "Each entry contains dense_score, sparse_score, freshness_score, and weights dense_weight, sparse_weight, freshness_weight.",
          "Final score is weighted sum; clamp to 0..1.",
          "Include breakdown in output for transparency.",
        ],
        tests: [
          {
            id: "rank",
            description: "Orders docs by weighted score.",
            assertion: assertion(`
def __test__():
    result = hybrid_rank({
        "a": {"dense_score": 0.9, "sparse_score": 0.5, "freshness_score": 0.2, "dense_weight": 0.6, "sparse_weight": 0.3, "freshness_weight": 0.1},
        "b": {"dense_score": 0.7, "sparse_score": 0.7, "freshness_score": 0.6, "dense_weight": 0.6, "sparse_weight": 0.3, "freshness_weight": 0.1},
    })
    return result[0]["id"] == "a" and result[0]["score"] >= result[1]["score"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-context-window",
      title: "Context Window Orchestration",
      duration: "18 min",
      difficulty: "challenge",
      overview:
        "Select final context payloads that respect token budgets while balancing relevance, diversity, and citations.",
      learningObjectives: [
        "Greedily add chunks until token budget reached",
        "Avoid selecting multiple chunks from same parent when diversity flag enabled",
        "Return citation references for selected chunks",
      ],
      reading: [
        {
          label: "Prompt Engineering for RAG Context",
          url: "https://www.promptingguide.ai/techniques/rag",
        },
      ],
      codeConcepts: ["greedy algorithms", "sets", "metadata"],
      exercise: {
        id: "exercise-select-context",
        title: "Select Context Payload",
        prompt:
          "Implement select_context(candidates, budget, enforce_diversity=True) returning dict with 'chunks' and 'total_tokens'. candidates contain id, parent_id, tokens, and score.",
        starterCode: code(`
from typing import Dict, Iterable, List


def select_context(candidates: Iterable[Dict[str, object]], budget: int, enforce_diversity: bool = True) -> Dict[str, object]:
    """Pick the best scoring chunks within token budget."""
    # TODO: sort by score, respect diversity, and sum tokens
    ...
`),
        hints: [
          "Sort candidates by score descending.",
          "When enforce_diversity is True, skip chunks sharing parent_id already selected.",
          "Stop when adding a chunk would exceed budget.",
        ],
        tests: [
          {
            id: "diversity",
            description: "Skips duplicates when enforcing diversity.",
            assertion: assertion(`
def __test__():
    chunks = [
        {"id": "a1", "parent_id": "docA", "tokens": 50, "score": 0.9},
        {"id": "a2", "parent_id": "docA", "tokens": 40, "score": 0.8},
        {"id": "b1", "parent_id": "docB", "tokens": 30, "score": 0.7},
    ]
    result = select_context(chunks, budget=90, enforce_diversity=True)
    return len(result["chunks"]) == 2 and all(chunk["parent_id"] in {"docA", "docB"} for chunk in result["chunks"])
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-generation",
      title: "Grounded Response Generation",
      duration: "17 min",
      difficulty: "lab",
      overview:
        "Craft prompt payloads that weave citations, instructions, and fallback behaviours to keep answers grounded.",
      learningObjectives: [
        "Format context snippets with citation markers",
        "Inject guardrails reminding the model to cite sources",
        "Return response template ready for LLM invocation",
      ],
      reading: [
        {
          label: "Grounded Generation Guidelines",
          url: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/use-rag",
        },
      ],
      codeConcepts: ["string formatting", "list join", "validation"],
      exercise: {
        id: "exercise-build-payload",
        title: "Assemble Grounded Prompt",
        prompt:
          "Implement build_grounded_prompt(question, context_chunks) returning dict with keys system_prompt and user_prompt. Include citations like [1], [2] referencing chunk order.",
        starterCode: code(`
from typing import Iterable, List, Dict


def build_grounded_prompt(question: str, context_chunks: Iterable[Dict[str, str]]) -> Dict[str, str]:
    """Create prompt payload instructing model to cite sources."""
    # TODO: build system message about citations and compose user prompt with numbered references
    ...
`),
        hints: [
          "System prompt should remind the assistant to cite sources from provided chunks.",
          "Number chunks sequentially and include '[[n]]' markers next to each snippet.",
          "Join citations at the end of user prompt for clarity.",
        ],
        tests: [
          {
            id: "includes-citations",
            description: "Formats context with numbered citations.",
            assertion: assertion(`
def __test__():
    payload = build_grounded_prompt("Explain RAG.", [{"content": "RAG retrieves documents."}])
    return "[1]" in payload["user_prompt"] and "cite sources" in payload["system_prompt"].lower()
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "rag-evaluation",
      title: "RAG Evaluation & Alerting",
      duration: "18 min",
      difficulty: "lab",
      overview:
        "Score responses for faithfulness, latency, and coverage; generate alerts when regressions arise.",
      learningObjectives: [
        "Aggregate metric results across evaluation suites",
        "Flag regressions above configurable thresholds",
        "Return summaries for observability dashboards",
      ],
      reading: [
        {
          label: "Evaluating RAG Systems",
          url: "https://www.promptingguide.ai/introduction/rag-evaluation",
        },
      ],
      codeConcepts: ["dict aggregation", "thresholds", "formatting"],
      exercise: {
        id: "exercise-eval-regressions",
        title: "Detect RAG Regressions",
        prompt:
          "Implement detect_regressions(results, thresholds) returning dict with failing_metrics and summary. results maps metric name to dict with baseline and current.",
        starterCode: code(`
from typing import Dict, List


def detect_regressions(results: Dict[str, Dict[str, float]], thresholds: Dict[str, float]) -> Dict[str, object]:
    """Flag RAG metrics that regress beyond thresholds."""
    # TODO: compare current/baseline, compute delta, and build summary strings
    ...
`),
        hints: [
          "Positive delta indicates regression when higher is worse; use thresholds.get(metric, 0.05) as default.",
          "Include strings like 'faithfulness -12.5%' in summary.",
          "Sort failing metrics descending by absolute delta.",
        ],
        tests: [
          {
            id: "regressions",
            description: "Flags metrics beyond threshold.",
            assertion: assertion(`
def __test__():
    result = detect_regressions({"faithfulness": {"baseline": 0.8, "current": 0.65}}, {"faithfulness": 0.1})
    return result["failing_metrics"] == ["faithfulness"] and "-18.75%" in result["summary"][0]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
  ],
  capstone: {
    id: "rag-capstone",
    title: "Continuously Learning Knowledge Platform",
    summary:
      "Ship a production-grade RAG platform: ingest sources on schedule, deduplicate, chunk intelligently, rerank context, ground answers, and monitor regressions in real time.",
    deliverables: [
      "Ingestion orchestrator with source registry",
      "Hybrid ranker deployment with explainability report",
      "Evaluation dashboard with automated alerts",
    ],
    checkpoints: [
      "Source registry and TTL maintenance plan",
      "Chunking + embedding pipeline integration test",
      "Evaluation notebook highlighting regressions",
    ],
  },
};
