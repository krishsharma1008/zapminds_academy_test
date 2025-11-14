export type McpExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type McpExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: McpExerciseTest[];
};

export type McpModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: McpExercise;
};

export type McpCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type McpCourseContent = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: McpModule[];
  capstone: McpCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const mcpCourseContent: McpCourseContent = {
  courseId: "mcp",
  title: "Model Context Protocol",
  hero: {
    headline: "Model Context Protocol",
    kicker: "Intermediate · AI Infrastructure",
    description:
      "Wire assistants, providers, and tools together with the Model Context Protocol. Ship capability-aware negotiators, streaming handlers, and governance hooks the whole team can trust.",
    progressPercent: 47,
  },
  modules: [
    {
      id: "mcp-handshake",
      title: "Handshake Frames & Metadata",
      duration: "15 min",
      difficulty: "core",
      overview:
        "Craft MCP handshake payloads that advertise client identity, supported protocol versions, and requested capabilities before any tool calls are made.",
      learningObjectives: [
        "Validate capability entries for required fields",
        "Attach protocol version and client metadata consistently",
        "Surface clear errors when payloads are malformed",
      ],
      reading: [
        {
          label: "MCP Specification – Handshake",
          url: "https://modelcontextprotocol.io/spec/latest",
        },
      ],
      codeConcepts: ["dict composition", "validation", "list comprehension"],
      exercise: {
        id: "exercise-build-handshake",
        title: "Build MCP Handshake",
        prompt:
          "Implement build_handshake(client_name, capabilities) returning a dict with protocol_version, client, and capabilities. Each capability must include name and version. Raise ValueError when invalid.",
        starterCode: code(`
from typing import Dict, Iterable, List


def build_handshake(client_name: str, capabilities: Iterable[Dict[str, str]]) -> Dict[str, object]:
    """Return a valid MCP handshake payload."""
    # TODO: validate capability entries and compose handshake dict
    ...
`),
        hints: [
          "protocol_version should be fixed to '1.0'.",
          "client metadata can be {\"name\": client_name}.",
          "Ensure every capability has non-empty name/version strings.",
        ],
        tests: [
          {
            id: "handshake",
            description: "Includes required fields with cleaned capabilities.",
            assertion: assertion(`
def __test__():
    payload = build_handshake("zapminds-shell", [{"name": "fs/read", "version": "1"}])
    return payload["protocol_version"] == "1.0" and payload["client"]["name"] == "zapminds-shell" and payload["capabilities"][0]["name"] == "fs/read"
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid",
            description: "Raises error for malformed capability.",
            assertion: assertion(`
def __test__():
    try:
        build_handshake("client", [{"name": "", "version": "1"}])
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
      id: "mcp-negotiation",
      title: "Capability Negotiation",
      duration: "16 min",
      difficulty: "core",
      overview:
        "Match client intents with provider features while respecting minimum versions and fallbacks.",
      learningObjectives: [
        "Intersect client-requested capabilities with provider support",
        "Respect minimum version requirements",
        "Return structured matches ordered by priority",
      ],
      reading: [
        {
          label: "Negotiating Capabilities",
          url: "https://modelcontextprotocol.io/spec/latest#capabilities",
        },
      ],
      codeConcepts: ["sets", "sorting", "tuples"],
      exercise: {
        id: "exercise-negotiate",
        title: "Match Capabilities",
        prompt:
          "Implement negotiate_capabilities(provider, requested) returning a list of tuples (name, version). provider is dict name->supported versions list. requested contains dicts with name, min_version, and priority.",
        starterCode: code(`
from typing import Dict, Iterable, List, Tuple


def negotiate_capabilities(provider: Dict[str, List[str]], requested: Iterable[Dict[str, object]]) -> List[Tuple[str, str]]:
    """Return capabilities that satisfy requested minima ordered by priority."""
    # TODO: filter supported versions and sort by priority ascending
    ...
`),
        hints: [
          "Priority 0 is highest; sort ascending.",
          "Pick the highest provider version >= min_version.",
          "Skip capabilities the provider does not expose.",
        ],
        tests: [
          {
            id: "negotiates",
            description: "Chooses compatible versions and orders by priority.",
            assertion: assertion(`
def __test__():
    provider = {"search": ["1.0", "1.1"], "fs/read": ["1.0"]}
    requested = [
        {"name": "fs/read", "min_version": "1.0", "priority": 1},
        {"name": "search", "min_version": "1.1", "priority": 0},
    ]
    result = negotiate_capabilities(provider, requested)
    return result == [("search", "1.1"), ("fs/read", "1.0")]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-manifest",
      title: "Provider Manifest Diffing",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Compare provider manifests to track new capabilities, removed tools, and version bumps for rollout reviews.",
      learningObjectives: [
        "Identify added and removed capabilities between manifests",
        "Detect version upgrades or downgrades",
        "Return structured diff for release notes",
      ],
      reading: [
        {
          label: "Manifest Structure",
          url: "https://modelcontextprotocol.io/spec/latest#manifest",
        },
      ],
      codeConcepts: ["dict comparison", "set operations", "string formatting"],
      exercise: {
        id: "exercise-manifest-diff",
        title: "Diff Provider Manifest",
        prompt:
          "Implement diff_manifest(old, new) returning dict with added, removed, and changed lists. Manifest is dict capability->version string.",
        starterCode: code(`
from typing import Dict, List


def diff_manifest(old: Dict[str, str], new: Dict[str, str]) -> Dict[str, List[str]]:
    """Return human-readable diff across manifests."""
    # TODO: build lists describing added/removed/changed capabilities
    ...
`),
        hints: [
          "added should contain strings like 'search@1.2'.",
          "changed should mention version delta e.g. 'fs/write:1.0->1.1'.",
          "Sort lists alphabetically for determinism.",
        ],
        tests: [
          {
            id: "diffs",
            description: "Detects added, removed, and changed capabilities.",
            assertion: assertion(`
def __test__():
    result = diff_manifest({"search": "1.0", "fs/read": "1.0"}, {"search": "1.1", "vector": "0.2"})
    return result == {
        "added": ["vector@0.2"],
        "removed": ["fs/read"],
        "changed": ["search:1.0->1.1"],
    }
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-resource-scope",
      title: "Resource URI Scoping",
      duration: "16 min",
      difficulty: "core",
      overview:
        "Resolve resource references safely by clamping calls inside approved scopes and preventing directory escapes.",
      learningObjectives: [
        "Join resource scopes with requested paths",
        "Prevent path traversal outside allowed prefixes",
        "Emit descriptive errors when access is denied",
      ],
      reading: [
        {
          label: "Resource Access Control",
          url: "https://modelcontextprotocol.io/spec/latest#resources",
        },
      ],
      codeConcepts: ["pathlib", "exceptions", "string operations"],
      exercise: {
        id: "exercise-resolve-resource",
        title: "Resolve Resource Path",
        prompt:
          "Implement resolve_resource(base_uri, request_path) returning normalised path string. Raise ValueError if request escapes base directory.",
        starterCode: code(`
from pathlib import Path


def resolve_resource(base_uri: str, request_path: str) -> str:
    """Resolve a resource path ensuring it stays within scope."""
    # TODO: normalise path and validate scope
    ...
`),
        hints: [
          "Convert both to Path objects and resolve.",
          "Use Path.resolve() to collapse '..'.",
          "Verify resolved path is relative to resolved base.",
        ],
        tests: [
          {
            id: "resolves",
            description: "Allows requests inside the base scope.",
            assertion: assertion(`
def __test__():
    path = resolve_resource("/workspace", "notes/summary.md")
    return path.endswith("workspace/notes/summary.md")
__test__()
`),
            expected: "True",
          },
          {
            id: "blocks-traversal",
            description: "Rejects attempts to escape the base path.",
            assertion: assertion(`
def __test__():
    try:
        resolve_resource("/workspace", "../secrets.txt")
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
      id: "mcp-routing",
      title: "Capability Routing Plans",
      duration: "18 min",
      difficulty: "challenge",
      overview:
        "Plan request routing across providers with latency targets, fallbacks, and policy controls for sensitive capabilities.",
      learningObjectives: [
        "Score providers using latency and availability metadata",
        "Respect allow lists for sensitive capabilities",
        "Return fallback chain for each capability request",
      ],
      reading: [
        {
          label: "Routing Strategies",
          url: "https://modelcontextprotocol.io/spec/latest#routing",
        },
      ],
      codeConcepts: ["sorting", "dicts", "list building"],
      exercise: {
        id: "exercise-plan-routing",
        title: "Build Routing Plan",
        prompt:
          "Implement plan_routing(requests, providers) returning dict capability->list of provider ids ordered by priority. Providers include latency_ms and allowed_capabilities.",
        starterCode: code(`
from typing import Dict, Iterable, List


def plan_routing(requests: Iterable[str], providers: Iterable[Dict[str, object]]) -> Dict[str, List[str]]:
    """Create routing lists per capability based on latency and policy."""
    # TODO: filter providers that expose the capability and sort by latency
    ...
`),
        hints: [
          "If provider lists allowed_capabilities, ensure capability present.",
          "Sort by latency_ms ascending.",
          "Include fallback providers even if latency identical.",
        ],
        tests: [
          {
            id: "routing",
            description: "Orders providers by latency respecting policies.",
            assertion: assertion(`
def __test__():
    providers = [
        {"id": "docs", "latency_ms": 80, "allowed_capabilities": ["search", "fs/read"]},
        {"id": "code", "latency_ms": 40, "allowed_capabilities": ["fs/read"]},
    ]
    plan = plan_routing(["fs/read"], providers)
    return plan["fs/read"] == ["code", "docs"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-streaming",
      title: "Streaming Message Windows",
      duration: "17 min",
      difficulty: "challenge",
      overview:
        "Group streaming tokens into manageable windows while preserving order and flush rules for clients.",
      learningObjectives: [
        "Batch streaming messages without exceeding window size",
        "Emit flush markers when forced",
        "Return latency metadata for observability",
      ],
      reading: [
        {
          label: "Streaming in MCP",
          url: "https://modelcontextprotocol.io/spec/latest#streaming",
        },
      ],
      codeConcepts: ["iteration", "list buffers", "time calculations"],
      exercise: {
        id: "exercise-window-stream",
        title: "Window Streaming Messages",
        prompt:
          "Implement window_stream(messages, window_size) yielding dicts with tokens list and flushed bool when buffer hits window_size or message['flush'] is True.",
        starterCode: code(`
from typing import Dict, Iterable, Iterator, List


def window_stream(messages: Iterable[Dict[str, object]], window_size: int = 50) -> Iterator[Dict[str, object]]:
    """Yield grouped streaming windows with flush support."""
    # TODO: accumulate tokens until flush condition then yield
    ...
`),
        hints: [
          "Each message includes token text and optional flush boolean.",
          "When flush True, emit current buffer even if empty.",
          "After yielding, reset buffer.",
        ],
        tests: [
          {
            id: "windows",
            description: "Splits messages into windows using flush flag.",
            assertion: assertion(`
def __test__():
    msgs = [
        {"token": "Hello "},
        {"token": "world", "flush": True},
        {"token": "!"}
    ]
    output = list(window_stream(msgs, window_size=2))
    return len(output) == 2 and output[0]["tokens"] == ["Hello ", "world"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-errors",
      title: "Error Normalisation",
      duration: "15 min",
      difficulty: "challenge",
      overview:
        "Translate provider exceptions into MCP-compliant error payloads with stable codes and remediation hints.",
      learningObjectives: [
        "Map exception types to error codes",
        "Include human-readable messages and details",
        "Preserve original error context when available",
      ],
      reading: [
        {
          label: "Error Handling",
          url: "https://modelcontextprotocol.io/spec/latest#errors",
        },
      ],
      codeConcepts: ["exception handling", "dicts", "type checks"],
      exercise: {
        id: "exercise-normalize-error",
        title: "Normalise Provider Errors",
        prompt:
          "Implement normalize_error(exc) returning dict with code, message, and details. Map PermissionError->'forbidden', FileNotFoundError->'not_found', default->'internal'.",
        starterCode: code(`
from typing import Dict


def normalize_error(exc: Exception) -> Dict[str, object]:
    """Convert Python exceptions to MCP error payload."""
    # TODO: map exception types to codes and include message/details
    ...
`),
        hints: [
          "Use isinstance checks in priority order.",
          "details can include the exception class name.",
          "Ensure message is str(exc) or a fallback string.",
        ],
        tests: [
          {
            id: "permission",
            description: "Maps PermissionError to forbidden code.",
            assertion: assertion(`
def __test__():
    payload = normalize_error(PermissionError("no access"))
    return payload["code"] == "forbidden" and payload["details"]["type"] == "PermissionError"
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-auth",
      title: "Auth Token Rotation",
      duration: "16 min",
      difficulty: "lab",
      overview:
        "Rotate provider tokens safely while avoiding sudden downtime and keeping consumers informed.",
      learningObjectives: [
        "Detect expired tokens relative to TTL",
        "Mark tokens pending rotation before expiry",
        "Return new/expired lists for automation workflows",
      ],
      reading: [
        {
          label: "Credential Hygiene",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Credential_Management_Cheat_Sheet.html",
        },
      ],
      codeConcepts: ["datetime", "list comprehension", "classification"],
      exercise: {
        id: "exercise-rotate-tokens",
        title: "Classify Provider Tokens",
        prompt:
          "Implement rotate_tokens(tokens, now, ttl_minutes, rotation_window=30) returning dict with active, rotate, and expired token ids based on issued_at iso strings.",
        starterCode: code(`
from datetime import datetime, timedelta
from typing import Dict, Iterable, List


def rotate_tokens(tokens: Iterable[Dict[str, str]], now: datetime, ttl_minutes: int, rotation_window: int = 30) -> Dict[str, List[str]]:
    """Classify tokens for rotation workflows."""
    # TODO: compare ages against ttl and rotation window
    ...
`),
        hints: [
          "Compute age = now - issued_at.",
          "Expired when age >= ttl.",
          "Rotate when ttl - age <= rotation_window and not expired.",
        ],
        tests: [
          {
            id: "classifies",
            description: "Separates rotate vs expired tokens.",
            assertion: assertion(`
from datetime import datetime, timedelta


def __test__():
    now = datetime.utcnow()
    tokens = [
        {"id": "fresh", "issued_at": (now - timedelta(minutes=10)).isoformat()},
        {"id": "rotate", "issued_at": (now - timedelta(minutes=80)).isoformat()},
        {"id": "expired", "issued_at": (now - timedelta(minutes=200)).isoformat()},
    ]
    result = rotate_tokens(tokens, now, ttl_minutes=180, rotation_window=60)
    return result["rotate"] == ["rotate"] and result["expired"] == ["expired"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-telemetry",
      title: "Telemetry Bundles",
      duration: "15 min",
      difficulty: "lab",
      overview:
        "Batch telemetry events for network efficiency while keeping payloads under size limits and preserving order.",
      learningObjectives: [
        "Accumulate events until size threshold hit",
        "Flush bundles when max bytes exceeded",
        "Return bundle metadata for auditing",
      ],
      reading: [
        {
          label: "Telemetry for AI Systems",
          url: "https://opentelemetry.io/docs/concepts/what-is-opentelemetry/",
        },
      ],
      codeConcepts: ["byte length", "buffering", "generators"],
      exercise: {
        id: "exercise-bundle-events",
        title: "Bundle Telemetry Events",
        prompt:
          "Implement bundle_events(events, max_bytes) yielding dicts with events list and byte_size. Each event is dict with json string at key 'payload'.",
        starterCode: code(`
from typing import Dict, Iterable, Iterator, List


def bundle_events(events: Iterable[Dict[str, str]], max_bytes: int) -> Iterator[Dict[str, object]]:
    """Yield telemetry bundles that stay under max_bytes constraint."""
    # TODO: accumulate events and flush before exceeding max_bytes
    ...
`),
        hints: [
          "Use len(payload.encode('utf-8')) for size.",
          "If single event exceeds max_bytes, emit it alone.",
          "Reset buffer after yielding.",
        ],
        tests: [
          {
            id: "bundles",
            description: "Groups events without exceeding limit.",
            assertion: assertion(`
def __test__():
    events = [{"payload": "one"}, {"payload": "two"}, {"payload": "three"}]
    bundles = list(bundle_events(events, max_bytes=7))
    return len(bundles) == 2 and sum(len(b["events"]) for b in bundles) == 3
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mcp-contract-tests",
      title: "Contract Testing Harness",
      duration: "18 min",
      difficulty: "lab",
      overview:
        "Evaluate provider endpoints against MCP contract cases to catch regressions before shipping.",
      learningObjectives: [
        "Iterate over cases and execute handler functions",
        "Collect pass/fail results with messages",
        "Return summary counts for CI pipelines",
      ],
      reading: [
        {
          label: "Contract Testing Overview",
          url: "https://martinfowler.com/articles/consumerDrivenContracts.html",
        },
      ],
      codeConcepts: ["callables", "exception handling", "statistics"],
      exercise: {
        id: "exercise-run-contracts",
        title: "Run Contract Suite",
        prompt:
          "Implement run_contracts(cases, handler) returning dict with passed, failed, and results list. Each case has id and payload. handler returns response dict or raises.",
        starterCode: code(`
from typing import Callable, Dict, Iterable, List


def run_contracts(cases: Iterable[Dict[str, object]], handler: Callable[[Dict[str, object]], Dict[str, object]]) -> Dict[str, object]:
    """Execute contract cases and record pass/fail results."""
    # TODO: call handler, capture exceptions, and build summary counts
    ...
`),
        hints: [
          "results entries can include {'id': case_id, 'status': 'passed'/'failed', 'message': str}.",
          "Increment passed/failed counters accordingly.",
          "Use try/except to capture handler exceptions.",
        ],
        tests: [
          {
            id: "contracts",
            description: "Records pass and fail outcomes.",
            assertion: assertion(`
def __test__():
    def handler(case):
        if case["payload"].get("ok"):
            return {"status": "ok"}
        raise RuntimeError("boom")

    suite = [
        {"id": "happy", "payload": {"ok": True}},
        {"id": "sad", "payload": {"ok": False}},
    ]
    summary = run_contracts(suite, handler)
    return summary["passed"] == 1 and summary["failed"] == 1 and summary["results"][1]["status"] == "failed"
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
  ],
  capstone: {
    id: "mcp-capstone",
    title: "Unified MCP Provider Gateway",
    summary:
      "Ship a gateway that negotiates capabilities, routes requests across providers, streams responses, and enforces policy with observability built-in.",
    deliverables: [
      "Capability negotiation service with routing policy DSL",
      "Streaming transport layer with telemetry hooks",
      "CI contract suite covering critical provider actions",
    ],
    checkpoints: [
      "Handshake + negotiation integration test",
      "Routing planner with latency-aware fallbacks",
      "Alerting pipeline fed by telemetry bundles",
    ],
  },
};
