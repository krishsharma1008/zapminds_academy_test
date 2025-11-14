export type LlmExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type LlmExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: LlmExerciseTest[];
};

export type LlmModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: LlmExercise;
};

export type LlmCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type LlmEngineeringCourse = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: LlmModule[];
  capstone: LlmCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const llmEngineeringCourseContent: LlmEngineeringCourse = {
  courseId: "llm-engineering",
  title: "LLM Engineering Lab",
  hero: {
    headline: "LLM Engineering Lab",
    kicker: "Advanced · Generative AI",
    description:
      "Design resilient LLM systems with deliberate prompting, retrieval, guardrails, and evaluation pipelines that stand up to production scrutiny.",
    progressPercent: 62,
  },
  modules: [
    {
      id: "llm-prompt-playbooks",
      title: "Prompt Playbooks & Pattern Libraries",
      duration: "16 min",
      difficulty: "core",
      overview:
        "Compose reusable prompt templates that separate tone, constraints, and conversation context so teams share the same building blocks.",
      learningObjectives: [
        "Wrap system tone, guardrails, and format requirements in a single prompt string",
        "Guarantee chat history ordering without mutation",
        "Surface helpful failures when inputs are malformed",
      ],
      reading: [
        {
          label: "Anthropic Prompt Library",
          url: "https://www.anthropic.com/news/prompt-library",
        },
      ],
      codeConcepts: ["string templates", "validation", "joins"],
      exercise: {
        id: "exercise-build-prompt",
        title: "Build Prompt Blueprint",
        prompt:
          "Implement build_prompt(messages, guidelines) returning a structured string with sections SYSTEM, TONE, CONSTRAINTS, HISTORY, and OUTPUT. messages is a list of dicts with role/content. guidelines may include optional tone, constraints list, and output_format.",
        starterCode: code(`
from typing import Dict, Iterable, List

Message = Dict[str, str]
Guidelines = Dict[str, object]


def build_prompt(messages: Iterable[Message], guidelines: Guidelines) -> str:
    """Return a structured prompt template for LLM calls."""
    # TODO: validate message structure and compose prompt sections
    ...
`),
        hints: [
          "Convert messages to a list so you can iterate multiple times.",
          "Raise ValueError if any message misses role or content.",
          "Join constraint strings with bullet points for readability.",
        ],
        tests: [
          {
            id: "prompt-structure",
            description: "Includes all required sections with last user turn.",
            assertion: assertion(`
def __test__():
    prompt = build_prompt(
        [
            {"role": "system", "content": "You are Zapminds Tutor."},
            {"role": "user", "content": "Explain transformers."},
        ],
        {"tone": "supportive", "constraints": ["Cite one source"]}
    )
    return all(section in prompt for section in ["SYSTEM", "TONE", "CONSTRAINTS", "HISTORY", "OUTPUT"]) and "Explain transformers." in prompt
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid-message",
            description: "Raises ValueError when message missing fields.",
            assertion: assertion(`
def __test__():
    try:
        build_prompt([{"role": "user"}], {})
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
      id: "llm-persona-systems",
      title: "Persona Systems & Guardrails",
      duration: "15 min",
      difficulty: "core",
      overview:
        "Blend personas from library fragments, preserving required guardrail directives while layering task-specific overrides.",
      learningObjectives: [
        "Merge persona dictionaries while deduplicating directives",
        "Guarantee mandatory guardrails appear first",
        "Return immutable tuples for downstream caching",
      ],
      reading: [
        {
          label: "OpenAI Prompt Engineering Guide",
          url: "https://platform.openai.com/docs/guides/prompt-engineering",
        },
      ],
      codeConcepts: ["set operations", "tuples", "ordering"],
      exercise: {
        id: "exercise-merge-persona",
        title: "Merge Persona Directives",
        prompt:
          "Implement merge_persona(base, overrides) returning a tuple (instructions, voice) where instructions is an ordered tuple of unique strings starting with any guardrails marked required=True.",
        starterCode: code(`
from typing import Dict, Iterable, List, Tuple


def merge_persona(base: Dict[str, object], overrides: Dict[str, object]) -> Tuple[Tuple[str, ...], str]:
    """Combine persona instructions without losing required guardrails."""
    # TODO: merge required guardrails first, deduplicate remaining instructions, and resolve voice preference
    ...
`),
        hints: [
          "Assume base['guardrails'] is a list of dicts with text and required keys.",
          "Overrides may provide guardrails and instructions; put required ones first.",
          "Voice preference should favour overrides when provided.",
        ],
        tests: [
          {
            id: "orders-required",
            description: "Required guardrails appear first and are unique.",
            assertion: assertion(`
def __test__():
    base = {
        "guardrails": [{"text": "Never discuss PII", "required": True}],
        "instructions": ["Be concise."],
        "voice": "calm",
    }
    overrides = {
        "guardrails": [{"text": "Cite sources", "required": True}],
        "instructions": ["Use markdown bullets.", "Be concise."],
        "voice": "playful",
    }
    instructions, voice = merge_persona(base, overrides)
    return instructions[0] == "Never discuss PII" and instructions[1] == "Cite sources" and "Use markdown bullets." in instructions and voice == "playful"
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-chunking",
      title: "Retrieval Chunk Strategy",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Slice source documents into context-aware windows that reduce drift while respecting token limits.",
      learningObjectives: [
        "Chunk text into windows with configurable overlap",
        "Avoid empty chunks and trim whitespace",
        "Provide metadata about chunk ordering",
      ],
      reading: [
        {
          label: "LangChain Chunking Best Practices",
          url: "https://python.langchain.com/docs/modules/data_connection/document_transformers/text_splitters",
        },
      ],
      codeConcepts: ["slicing", "enumerate", "strings"],
      exercise: {
        id: "exercise-smart-chunk",
        title: "Smart Text Chunker",
        prompt:
          "Implement smart_chunk(text, max_chars, overlap) returning a list of dicts with index and content keys. Chunks should be <= max_chars, use overlap characters between segments, and exclude blank entries.",
        starterCode: code(`
from typing import Dict, List


def smart_chunk(text: str, max_chars: int, overlap: int = 0) -> List[Dict[str, object]]:
    """Split text into overlapped windows suited for retrieval."""
    # TODO: iterate through text, apply overlap, and record chunk order
    ...
`),
        hints: [
          "Use range with step max_chars - overlap, ensuring step > 0.",
          "Strip each chunk and skip when empty.",
          "Store {'index': idx, 'content': chunk} entries.",
        ],
        tests: [
          {
            id: "chunk-basic",
            description: "Chunks text with overlap and trimming.",
            assertion: assertion(`
def __test__():
    text = "Zapminds builds resilient AI systems.\nWe love shipping."
    chunks = smart_chunk(text, max_chars=20, overlap=5)
    return chunks[0]["index"] == 0 and len(chunks) == 3 and all(len(chunk["content"]) <= 20 for chunk in chunks)
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-vector-ranking",
      title: "Vector Ranking Signals",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Compute cosine similarities to rank candidate passages and expose interpretable scores for downstream prompts.",
      learningObjectives: [
        "Normalise embedding vectors safely",
        "Calculate cosine similarity with zero guards",
        "Return sorted passage identifiers with scores",
      ],
      reading: [
        {
          label: "Vector Similarity Search",
          url: "https://docs.pinecone.io/docs/cosine",
        },
      ],
      codeConcepts: ["math", "lists", "sorting"],
      exercise: {
        id: "exercise-rank-passages",
        title: "Rank Retrieval Candidates",
        prompt:
          "Implement rank_passages(query_embedding, passages, limit=3) where passages is a list of dicts containing id and embedding. Return a list of (id, score) sorted descending.",
        starterCode: code(`
from math import sqrt
from typing import Dict, Iterable, List, Sequence, Tuple


def _norm(vec: Sequence[float]) -> float:
    return sqrt(sum(v * v for v in vec))


def rank_passages(query_embedding: Sequence[float], passages: Iterable[Dict[str, object]], limit: int = 3) -> List[Tuple[str, float]]:
    """Return top passages by cosine similarity."""
    # TODO: compute cosine similarity and sort safely
    ...
`),
        hints: [
          "Skip passages with zero-length or mismatched embeddings.",
          "Guard against zero norms by returning similarity 0.",
          "Slice the final sorted scores to the requested limit.",
        ],
        tests: [
          {
            id: "ranks",
            description: "Orders passages by cosine similarity.",
            assertion: assertion(`
def __test__():
    result = rank_passages(
        [1.0, 0.0],
        [
            {"id": "a", "embedding": [0.6, 0.8]},
            {"id": "b", "embedding": [1.0, 0.0]},
            {"id": "c", "embedding": [0.2, 0.2]},
        ],
        limit=2,
    )
    return result[0][0] == "b" and len(result) == 2 and result[0][1] > result[1][1]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-guardrails",
      title: "Guardrail Policies & Moderation",
      duration: "14 min",
      difficulty: "core",
      overview:
        "Create policy evaluators that scan responses for violations and emit actionable guidance for fallback flows.",
      learningObjectives: [
        "Detect keyword violations using case-insensitive search",
        "Support optional allow lists for context-specific exceptions",
        "Return structured results with severity levels",
      ],
      reading: [
        {
          label: "Production Guardrails for GenAI",
          url: "https://www.holisticai.com/blog/guardrails-for-generative-ai",
        },
      ],
      codeConcepts: ["lowercasing", "list comprehension", "filtering"],
      exercise: {
        id: "exercise-guardrails",
        title: "Evaluate Guardrail Violations",
        prompt:
          "Implement evaluate_guardrails(response, policies) where policies is a list of dicts containing keyword, severity, and optional allow list. Return a list of violations with keyword and severity.",
        starterCode: code(`
from typing import Dict, Iterable, List


def evaluate_guardrails(response: str, policies: Iterable[Dict[str, object]]) -> List[Dict[str, str]]:
    """Return guardrail violations present in the response."""
    # TODO: scan for policy keywords while respecting allow lists
    ...
`),
        hints: [
          "Normalise response and keywords to lowercase.",
          "If any allow phrase is present, skip that policy.",
          "Return dictionaries containing 'keyword' and 'severity'.",
        ],
        tests: [
          {
            id: "detects",
            description: "Finds policy match and reports severity.",
            assertion: assertion(`
def __test__():
    policies = [{"keyword": "password", "severity": "high"}]
    result = evaluate_guardrails("Never share your password with anyone.", policies)
    return result == [{"keyword": "password", "severity": "high"}]
__test__()
`),
            expected: "True",
          },
          {
            id: "allows",
            description: "Skips matches when allow phrase present.",
            assertion: assertion(`
def __test__():
    policies = [{"keyword": "export", "severity": "medium", "allow": ["data export tool"]}]
    result = evaluate_guardrails("Use the data export tool for backups.", policies)
    return result == []
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-tool-routing",
      title: "Tool Router Strategies",
      duration: "19 min",
      difficulty: "challenge",
      overview:
        "Route user intents to the right tool collections using embeddings, keywords, and guardrail tags while keeping logic explainable.",
      learningObjectives: [
        "Match intents against tool metadata tags",
        "Prioritise required tools when tags include 'required'",
        "Return sorted tool identifiers with reasons",
      ],
      reading: [
        {
          label: "Function Calling Patterns",
          url: "https://platform.openai.com/docs/guides/function-calling",
        },
      ],
      codeConcepts: ["set intersections", "sorting", "structured data"],
      exercise: {
        id: "exercise-route-tools",
        title: "Intent-Based Tool Routing",
        prompt:
          "Implement route_tools(intent_tags, registry, limit=3) where intent_tags is a set of strings and registry is a list of dicts containing id, tags, and optional priority ('required' or 'preferred'). Return list of dicts with id and reason ordered by priority then match count.",
        starterCode: code(`
from typing import Dict, Iterable, List, Sequence, Set


def route_tools(intent_tags: Set[str], registry: Iterable[Dict[str, object]], limit: int = 3) -> List[Dict[str, object]]:
    """Select tools aligned with user intent tags."""
    # TODO: score by tag intersection and prioritise required tools
    ...
`),
        hints: [
          "Compute intersection length between intent_tags and tool tags.",
          "Treat priority 'required' as highest, then 'preferred', else default.",
          "Include a reason string such as 'matched tags: foo, bar'.",
        ],
        tests: [
          {
            id: "prioritises-required",
            description: "Required tools surface first regardless of match tie.",
            assertion: assertion(`
def __test__():
    registry = [
        {"id": "search", "tags": {"lookup", "facts"}, "priority": "preferred"},
        {"id": "calendar", "tags": {"schedule"}, "priority": "required"},
    ]
    result = route_tools({"schedule", "lookup"}, registry)
    return result[0]["id"] == "calendar" and "schedule" in result[0]["reason"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-memory",
      title: "Conversation Memory Strategies",
      duration: "18 min",
      difficulty: "challenge",
      overview:
        "Blend rolling summaries with highlighted moments so agents remember commitments even across long sessions.",
      learningObjectives: [
        "Identify pinned moments that must persist",
        "Summarise residual conversation into concise bullet points",
        "Clamp total output length while retaining chronology",
      ],
      reading: [
        {
          label: "Memory Architectures for Agents",
          url: "https://eugeneyan.com/writing/llm-memory/",
        },
      ],
      codeConcepts: ["string joining", "list slicing", "filtering"],
      exercise: {
        id: "exercise-summarise-memory",
        title: "Summarise Conversation Memory",
        prompt:
          "Implement summarise_memory(messages, limit=3) where messages is a list of dicts with role, content, and optional pinned True. Return a dict with 'pinned' and 'summary' keys; pinned keeps contents of pinned messages in order, summary stores up to limit bullet lines for the rest.",
        starterCode: code(`
from typing import Dict, Iterable, List


def summarise_memory(messages: Iterable[Dict[str, object]], limit: int = 3) -> Dict[str, List[str]]:
    """Summarise chat history while preserving pinned commitments."""
    # TODO: collect pinned entries, then summarise remaining messages into bullet lines
    ...
`),
        hints: [
          "Pinned messages should appear exactly as their content.",
          "For the summary, use format '- role: content'.",
          "Respect the limit by truncating extra summary bullets.",
        ],
        tests: [
          {
            id: "captures-pinned",
            description: "Keeps pinned commitments and limited summary bullets.",
            assertion: assertion(`
def __test__():
    result = summarise_memory(
        [
            {"role": "user", "content": "Remember demo on Friday.", "pinned": True},
            {"role": "assistant", "content": "Scheduled demo reminder."},
            {"role": "user", "content": "Need slides outline."},
        ],
        limit=1,
    )
    return result["pinned"] == ["Remember demo on Friday."] and len(result["summary"]) == 1 and result["summary"][0].startswith("- assistant:")
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-evaluations",
      title: "LLM Evaluation Harnesses",
      duration: "17 min",
      difficulty: "lab",
      overview:
        "Compute rubric scores, aggregate judge notes, and pinpoint regressions automatically across experiments.",
      learningObjectives: [
        "Normalise rubric weights when unspecified",
        "Compute weighted averages across multiple dimensions",
        "Return both numeric score and failing dimensions",
      ],
      reading: [
        {
          label: "Evaluating Large Language Models",
          url: "https://arxiv.org/abs/2307.03109",
        },
      ],
      codeConcepts: ["dict processing", "averages", "list filtering"],
      exercise: {
        id: "exercise-score-evals",
        title: "Aggregate Rubric Scores",
        prompt:
          "Implement score_responses(responses, rubric) where responses is a list of dicts containing 'scores' per dimension and rubric provides optional weights. Return dict with 'average' and 'failed' (dimensions under threshold 0.7).",
        starterCode: code(`
from typing import Dict, Iterable, List


def score_responses(responses: Iterable[Dict[str, object]], rubric: Dict[str, float]) -> Dict[str, object]:
    """Aggregate per-dimension LLM evaluation scores."""
    # TODO: compute weighted mean and track failing dimensions
    ...
`),
        hints: [
          "Default weight to 1.0 when dimension missing in rubric.",
          "Average each dimension first across responses.",
          "Failed dimensions should include those with average < 0.7.",
        ],
        tests: [
          {
            id: "scores",
            description: "Computes weighted average and failing dimensions.",
            assertion: assertion(`
def __test__():
    responses = [
        {"scores": {"accuracy": 0.8, "safety": 0.6}},
        {"scores": {"accuracy": 0.9, "safety": 0.7}},
    ]
    result = score_responses(responses, {"accuracy": 2.0})
    return round(result["average"], 3) == 0.783 and result["failed"] == ["safety"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-redaction",
      title: "Safety Filters & Redaction",
      duration: "16 min",
      difficulty: "lab",
      overview:
        "Mask PII, credentials, and secrets before logging or handing off to downstream systems.",
      learningObjectives: [
        "Compile regex patterns only once",
        "Replace matches with deterministic tokens",
        "Expose metadata about which patterns triggered",
      ],
      reading: [
        {
          label: "PII Redaction Strategies",
          url: "https://cloud.google.com/dlp/docs/concepts-redaction",
        },
      ],
      codeConcepts: ["regex", "named tuples", "strings"],
      exercise: {
        id: "exercise-redact",
        title: "Redact Sensitive Text",
        prompt:
          "Implement redact_sensitive(text, patterns) where patterns is a list of dicts with name and regex. Return dict containing 'redacted' text and 'matches' listing names triggered.",
        starterCode: code(`
import re
from typing import Dict, Iterable, List


def redact_sensitive(text: str, patterns: Iterable[Dict[str, str]]) -> Dict[str, object]:
    """Redact sensitive substrings using named regex patterns."""
    # TODO: compile regexes lazily and substitute deterministic tokens
    ...
`),
        hints: [
          "Use re.compile and store named tokens like <NAME:redaction>.",
          "Ensure multiple matches don't duplicate names in metadata.",
          "Return the original text unchanged when no matches.",
        ],
        tests: [
          {
            id: "redacts",
            description: "Replaces secrets with token and records names.",
            assertion: assertion(`
def __test__():
    result = redact_sensitive("API key: sk-test-123", [{"name": "api_key", "regex": r"sk-[a-z]+-\\d+"}])
    return result["redacted"].count("<api_key:redacted>") == 1 and result["matches"] == ["api_key"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "llm-observability",
      title: "Guardrail Observability & Alerts",
      duration: "15 min",
      difficulty: "lab",
      overview:
        "Roll up violation metrics, compute trend deltas, and emit escalation levels that on-call engineers can trust.",
      learningObjectives: [
        "Aggregate counts across severity buckets",
        "Compute percentage change against baselines",
        "Classify alert levels with contextual messaging",
      ],
      reading: [
        {
          label: "Observability for GenAI Systems",
          url: "https://www.montecarlodata.com/blog/observability-for-generative-ai/",
        },
      ],
      codeConcepts: ["math", "dicts", "conditionals"],
      exercise: {
        id: "exercise-observability",
        title: "Compute Guardrail Alert Level",
        prompt:
          "Implement compute_guardrail_alert(findings, baseline) returning dict with 'level' (green/yellow/red) and 'delta' percentage. findings/baseline map severity to counts.",
        starterCode: code(`
from typing import Dict


def compute_guardrail_alert(findings: Dict[str, int], baseline: Dict[str, int]) -> Dict[str, object]:
    """Compare guardrail counts to baseline and classify alert level."""
    # TODO: sum totals, compute percentage delta, and map to alert levels
    ...
`),
        hints: [
          "Treat missing severities as zero.",
          "Delta is ((current - baseline) / max(baseline, 1)) * 100.",
          "Levels: red when delta >= 50 or high severity > baseline, yellow when delta >= 20 else green.",
        ],
        tests: [
          {
            id: "alert-level",
            description: "Produces red alert when violations spike.",
            assertion: assertion(`
def __test__():
    result = compute_guardrail_alert({"high": 10, "medium": 5}, {"high": 4, "medium": 4})
    return result["level"] == "red" and round(result["delta"], 1) == 75.0
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
  ],
  capstone: {
    id: "llm-capstone",
    title: "Production-Ready Assistant Launch",
    summary:
      "Ship an enterprise-ready assistant with retrieval, tool calling, safety guardrails, and automated evaluation loops wired together.",
    deliverables: [
      "Prompt library with personas and guardrail scripts",
      "Retrieval router benchmarking notebook",
      "Alerting dashboard summarising policy breaches and regressions",
    ],
    checkpoints: [
      "Library of reusable prompt fragments",
      "End-to-end workflow test covering tool routing",
      "Evaluation job with nightly regression reports",
    ],
  },
};
