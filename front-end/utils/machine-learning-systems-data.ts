export type MlExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type MlExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: MlExerciseTest[];
};

export type MlModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: MlExercise;
};

export type MlCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type MachineLearningCourse = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: MlModule[];
  capstone: MlCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const machineLearningSystemsContent: MachineLearningCourse = {
  courseId: "machine-learning",
  title: "Machine Learning Systems",
  hero: {
    headline: "Machine Learning Systems",
    kicker: "Intermediate · ML Ops",
    description:
      "Architect resilient ML stacks. Move from data ingestion to deployment with production-grade workflows, experiment tracking, and monitoring baked in.",
    progressPercent: 20,
  },
  modules: [
    {
      id: "mls-data-contracts",
      title: "Data Contracts & Ingestion",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Define interfaces between upstream producers and ML platforms. Validate payloads and surface schema drift immediately.",
      learningObjectives: [
        "Model dataset schemas with optional fields and types",
        "Validate incoming payloads and raise actionable errors",
        "Collect quick stats for ingestion dashboards",
      ],
      reading: [
        {
          label: "Data contracts for ML",
          url: "https://www.tecton.ai/blog/data-contracts-in-ml/",
        },
      ],
      codeConcepts: ["TypedDict", "optional fields", "lists"],
      exercise: {
        id: "exercise-data-contracts",
        title: "Validate Course Payloads",
        prompt:
          "Implement validate_payload(payload) returning a tuple (clean, errors). clean is a dict with normalised keys when valid, otherwise None. errors lists strings describing problems.",
        starterCode: code(`
from typing import Optional, Tuple, Dict, List, Any

RequiredKeys = {
    "course_id": str,
    "version": int,
    "records": list,
}

OptionalKeys = {
    "source": str,
}


def validate_payload(payload: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """Validate incoming metadata before persisting to object storage."""
    errors: List[str] = []
    clean: Dict[str, Any] = {}

    # TODO: check required keys, validate types, coerce strings via strip/lower
    ...

    return (clean if not errors else None, errors)
`),
        hints: [
          "Loop through required keys and ensure presence and type.",
          "Normalise the course_id to lowercase with underscores.",
          "Make sure records is a list of dicts before accepting it.",
        ],
        tests: [
          {
            id: "valid-payload",
            description: "Returns clean data when schema matches.",
            assertion: assertion(`
def __test__():
    payload = {
        "course_id": "MLS-INT",
        "version": 3,
        "records": [{}],
        "source": "airflow",
    }
    clean, errors = validate_payload(payload)
    return clean["course_id"] == "mls-int" and errors == []
__test__()
`),
            expected: "True",
          },
          {
            id: "missing-field",
            description: "Missing required key produces error.",
            assertion: assertion(`
def __test__():
    payload = {"course_id": "MLS", "records": []}
    clean, errors = validate_payload(payload)
    return clean is None and any("version" in err for err in errors)
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-preprocessing",
      title: "Preprocessing Pipelines",
      duration: "20 min",
      difficulty: "core",
      overview:
        "Standardise raw features while maintaining reproducibility and logging summary statistics for downstream checks.",
      learningObjectives: [
        "Scale numeric columns and impute missing values",
        "Track preprocessing parameters for reuse",
        "Return tidy structures ready for training pipelines",
      ],
      reading: [
        {
          label: "Feature preprocessing in production",
          url: "https://www.featurestore.org/blog/preprocessing",
        },
      ],
      codeConcepts: ["mean", "population stdev", "dict"],
      exercise: {
        id: "exercise-preprocessing",
        title: "Normalise Study Metrics",
        prompt:
          "Implement fit_transform(features) that accepts a dict of numeric lists and returns (transformed, params) where values are z-scored using population standard deviation.",
        starterCode: code(`
from typing import Dict, List, Tuple
import math


def fit_transform(features: Dict[str, List[float]]) -> Tuple[Dict[str, List[float]], Dict[str, Tuple[float, float]]]:
    """Return z-scored features and (mean, stdev) params for each column."""
    transformed: Dict[str, List[float]] = {}
    params: Dict[str, Tuple[float, float]] = {}

    # TODO: compute mean/std for each column, guard against zero variance
    ...

    return transformed, params
`),
        hints: [
          "Mean is sum(column)/len(column).",
          "Population variance uses denominator len(column).",
          "If stdev is zero, return zeros for that column to avoid division errors.",
        ],
        tests: [
          {
            id: "z-score",
            description: "Produces zero-mean columns with stored params.",
            assertion: assertion(`
def __test__():
    data = {"xp": [10, 20, 30]}
    out, params = fit_transform(data)
    xp = out["xp"]
    return round(sum(xp), 6) == 0 and round(params["xp"][0], 2) == 20.0
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-feature-engineering",
      title: "Feature Engineering for Production",
      duration: "22 min",
      difficulty: "core",
      overview:
        "Design deterministic transforms that survive backfills and real-time scoring using rolling aggregates.",
      learningObjectives: [
        "Aggregate event logs into fixed windows",
        "Ensure stable ordering and idempotency",
        "Produce metadata describing feature freshness",
      ],
      reading: [
        {
          label: "Analytics Engineering for ML",
          url: "https://www.getdbt.com/blog/analytics-engineering-for-ml/",
        },
      ],
      codeConcepts: ["defaultdict", "deque", "rolling windows"],
      exercise: {
        id: "exercise-feature-engineering",
        title: "Session Rolling Counts",
        prompt:
          "Given event tuples (user_id, minutes) implement rolling_minutes(events, window) returning a dict of user_id to total minutes for the last window events per user.",
        starterCode: code(`
from collections import defaultdict, deque
from typing import Deque, Dict, Iterable, Tuple


def rolling_minutes(events: Iterable[Tuple[str, int]], window: int = 5) -> Dict[str, int]:
    """Return rolling sum of minutes per learner over the last window events."""
    buffers: Dict[str, Deque[int]] = defaultdict(lambda: deque(maxlen=window))
    totals: Dict[str, int] = defaultdict(int)

    # TODO: update buffers and totals for each event in order
    ...

    return dict(totals)
`),
        hints: [
          "Use deque with maxlen to pop older entries automatically.",
          "Subtract removed values from totals when the deque trims.",
        ],
        tests: [
          {
            id: "rolling",
            description: "Maintains only last N events per user.",
            assertion: assertion(`
def __test__():
    events = [("u1", 10), ("u1", 5), ("u1", 20), ("u1", 30)]
    totals = rolling_minutes(events, window=3)
    return totals["u1"] == 55
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-experiment-tracking",
      title: "Experiment Tracking",
      duration: "19 min",
      difficulty: "core",
      overview:
        "Instrument training runs with consistent metadata and produce summaries that analysts can compare quickly.",
      learningObjectives: [
        "Log metrics and artifacts per run",
        "Compute leaderboards from run history",
        "Filter experiments by custom criteria",
      ],
      reading: [
        {
          label: "MLflow quickstart",
          url: "https://mlflow.org/docs/latest/quickstart.html",
        },
      ],
      codeConcepts: ["dataclass", "sorted", "list comprehension"],
      exercise: {
        id: "exercise-tracking",
        title: "Rank Experiments",
        prompt:
          "Implement top_runs(runs, metric) returning the best run ids sorted by metric descending and breaking ties by lowest duration.",
        starterCode: code(`
from dataclasses import dataclass
from typing import Iterable, List


@dataclass
class Run:
    run_id: str
    metrics: dict
    duration: float


def top_runs(runs: Iterable[Run], metric: str, limit: int = 3) -> List[str]:
    """Return top run ids for a given metric."""
    # TODO: filter runs containing the metric, sort by metric desc then duration asc
    ...

    return []
`),
        hints: [
          "Use a list comprehension to keep runs with the metric key.",
          "sorted(..., key=lambda run: (-run.metrics[metric], run.duration)) handles ordering.",
        ],
        tests: [
          {
            id: "leaderboard",
            description: "Returns run ids in ranked order.",
            assertion: assertion(`
def __test__():
    runs = [
        Run("a", {"f1": 0.70}, 12.0),
        Run("b", {"f1": 0.71}, 15.0),
        Run("c", {"f1": 0.71}, 11.0),
    ]
    result = top_runs(runs, "f1", limit=2)
    return result == ["c", "b"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-evaluation",
      title: "Evaluation & Diagnostics",
      duration: "20 min",
      difficulty: "core",
      overview:
        "Summarise confusion matrices and highlight cohorts needing attention before production rollouts.",
      learningObjectives: [
        "Compute precision/recall per cohort",
        "Aggregate metrics into dashboards",
        "Generate concise textual summaries",
      ],
      reading: [
        {
          label: "Beyond accuracy: evaluation metrics",
          url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy",
        },
      ],
      codeConcepts: ["dict aggregations", "format strings"],
      exercise: {
        id: "exercise-evaluation",
        title: "Summarise Classification Metrics",
        prompt:
          "Implement cohort_report(rows) where rows are dicts containing cohort, tp, fp, fn. Return a dict mapping cohort to summary string 'precision=X recall=Y'.",
        starterCode: code(`
from typing import Dict, Iterable


def cohort_report(rows: Iterable[Dict[str, int]]) -> Dict[str, str]:
    """Return precision/recall text per cohort."""
    report: Dict[str, str] = {}

    # TODO: aggregate stats and compute precision/recall safely
    ...

    return report
`),
        hints: [
          "Precision equals tp / (tp + fp) if denominator > 0.",
          "Recall equals tp / (tp + fn).",
          "Use round(value, 2) for readability.",
        ],
        tests: [
          {
            id: "basic",
            description: "Produces formatted summary.",
            assertion: assertion(`
def __test__():
    rows = [
        {"cohort": "mobile", "tp": 8, "fp": 2, "fn": 1}
    ]
    summary = cohort_report(rows)
    return summary["mobile"] == "precision=0.8 recall=0.89"
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-feature-store",
      title: "Feature Store Operations",
      duration: "21 min",
      difficulty: "core",
      overview:
        "Manage feature definitions, backfills, and online/offline consistency with caching strategies.",
      learningObjectives: [
        "Ensure freshness windows and TTLs",
        "Detect conflicting definitions",
        "Surface metrics for feature availability",
      ],
      reading: [
        {
          label: "Feature store design patterns",
          url: "https://www.tecton.ai/blog/feature-store-design-patterns/",
        },
      ],
      codeConcepts: ["cache", "dataclass", "timedelta"],
      exercise: {
        id: "exercise-feature-store",
        title: "Cache Feature Snapshots",
        prompt:
          "Implement FeatureCache with get(feature_id) returning cached values when within TTL, otherwise invoking a loader callable and storing the result.",
        starterCode: code(`
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Callable, Dict, Tuple


@dataclass
class CacheEntry:
    value: dict
    expires_at: datetime


class FeatureCache:
    def __init__(self, loader: Callable[[str], dict], ttl_minutes: int = 10) -> None:
        self.loader = loader
        self.ttl = timedelta(minutes=ttl_minutes)
        self._cache: Dict[str, CacheEntry] = {}

    def get(self, feature_id: str) -> dict:
        """Return cached feature snapshot or fetch via loader."""
        # TODO: check existing entry expiry, refresh when needed
        ...
`),
        hints: [
          "Compare expires_at against datetime.utcnow().",
          "When refreshing, store CacheEntry(value, now + ttl).",
        ],
        tests: [
          {
            id: "caches",
            description: "Avoids calling loader when entry fresh.",
            assertion: assertion(`
from datetime import datetime


def __test__():
    calls = {"count": 0}

    def loader(fid: str) -> dict:
        calls["count"] += 1
        return {"id": fid, "ts": datetime.utcnow()}

    cache = FeatureCache(loader, ttl_minutes=5)
    first = cache.get("embeddings")
    second = cache.get("embeddings")
    return calls["count"] == 1 and first == second
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-orchestration",
      title: "Pipeline Orchestration",
      duration: "23 min",
      difficulty: "challenge",
      overview:
        "Compose training and scoring tasks with dependency graphs, ensuring correct execution order and failure isolation.",
      learningObjectives: [
        "Topologically sort DAGs of tasks",
        "Detect circular dependencies",
        "Produce execution batches for parallelism",
      ],
      reading: [
        {
          label: "Airflow concepts",
          url: "https://airflow.apache.org/docs/apache-airflow/stable/concepts.html",
        },
      ],
      codeConcepts: ["dict", "set", "topological sort"],
      exercise: {
        id: "exercise-orchestration",
        title: "Plan Execution Batches",
        prompt:
          "Implement plan_batches(graph) where graph maps task to dependencies. Return a list of batches with tasks that can run together. Raise ValueError when cycles exist.",
        starterCode: code(`
from collections import defaultdict, deque
from typing import Dict, Iterable, List


def plan_batches(graph: Dict[str, Iterable[str]]) -> List[List[str]]:
    """Return execution batches using topological sort."""
    indegree = defaultdict(int)
    adj: Dict[str, List[str]] = defaultdict(list)

    for task, deps in graph.items():
        indegree.setdefault(task, 0)
        for dep in deps:
            adj[dep].append(task)
            indegree[task] += 1
            indegree.setdefault(dep, 0)

    queue = deque([task for task, degree in indegree.items() if degree == 0])
    batches: List[List[str]] = []

    # TODO: produce batches while lowering indegree, detect cycles
    ...

    return batches
`),
        hints: [
          "Process queue in levels: collect current queue size tasks as a batch.",
          "Count processed tasks; if less than total nodes, raise ValueError.",
        ],
        tests: [
          {
            id: "topo",
            description: "Returns grouped batches",
            assertion: assertion(`
def __test__():
    batches = plan_batches({"train": ["prep"], "prep": ["fetch"], "fetch": []})
    return batches == [["fetch"], ["prep"], ["train"]]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-continuous-delivery",
      title: "Continuous Delivery Safeguards",
      duration: "18 min",
      difficulty: "lab",
      overview:
        "Gate releases behind automated quality checks and provide transparent reasons when promotions pause.",
      learningObjectives: [
        "Define quantitative release gates for model promotions",
        "Detect missing metrics and failure reasons automatically",
        "Return audit-friendly summaries for incident reviews",
      ],
      reading: [
        {
          label: "Continuous delivery for Machine Learning",
          url: "https://www.thoughtworks.com/en-us/insights/blog/continuous-delivery-machine-learning",
        },
      ],
      codeConcepts: ["thresholds", "dicts", "list comprehensions"],
      exercise: {
        id: "exercise-release-gates",
        title: "Evaluate Release Gates",
        prompt:
          "Implement evaluate_release(metrics, gates) returning a dict with status ('promote' or 'hold') and reasons describing any gate failures or missing metrics.",
        starterCode: code(`
from typing import Dict, Iterable, List, Mapping, Union


Gate = Mapping[str, Union[str, float]]


def evaluate_release(metrics: Mapping[str, float], gates: Iterable[Gate]) -> Dict[str, List[str]]:
    """Return promotion decision and reasons for holds."""
    reasons: List[str] = []

    # TODO: iterate through gates, compare min/max thresholds, capture readable reasons
    ...

    return {"status": "promote" if not reasons else "hold", "reasons": reasons}
`),
        hints: [
          "Treat missing metrics as failures so teams know what to log next.",
          "Use `gate.get(\"min\")` and `gate.get(\"max\")` to test thresholds only when present.",
          "Compose reasons such as `'accuracy below 0.92'` for clarity.",
        ],
        tests: [
          {
            id: "promotes",
            description: "Returns promote when all gates pass.",
            assertion: assertion(`
def __test__():
    gates = [
        {"metric": "accuracy", "min": 0.85},
        {"metric": "latency_ms", "max": 120},
    ]
    result = evaluate_release({"accuracy": 0.9, "latency_ms": 115}, gates)
    return result == {"status": "promote", "reasons": []}
__test__()
`),
            expected: "True",
          },
          {
            id: "holds",
            description: "Provides reasons when gates fail.",
            assertion: assertion(`
def __test__():
    gates = [
        {"metric": "accuracy", "min": 0.88},
        {"metric": "drift_score", "max": 0.2},
    ]
    result = evaluate_release({"accuracy": 0.85, "drift_score": 0.27}, gates)
    return result["status"] == "hold" and len(result["reasons"]) == 2
__test__()
`),
            expected: "True",
          },
          {
            id: "missing-metric",
            description: "Flags missing metrics as hold reasons.",
            assertion: assertion(`
def __test__():
    gates = [{"metric": "precision", "min": 0.8}]
    result = evaluate_release({"accuracy": 0.9}, gates)
    return result["status"] == "hold" and any("precision" in reason for reason in result["reasons"])
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-deployment",
      title: "Deployment & Serving",
      duration: "20 min",
      difficulty: "challenge",
      overview:
        "Serve predictions consistently using request validation, batching, and latency measurements.",
      learningObjectives: [
        "Validate incoming payloads at serving time",
        "Batch predictions for throughput",
        "Return structured responses with latency stats",
      ],
      reading: [
        {
          label: "Serving ML with FastAPI",
          url: "https://fastapi.tiangolo.com/tutorial/machine-learning/",
        },
      ],
      codeConcepts: ["time", "batching", "error handling"],
      exercise: {
        id: "exercise-serving",
        title: "Serve Batched Predictions",
        prompt:
          "Implement serve_requests(model, payloads) where model exposes predict_batch(inputs). Validate each payload has features; raise ValueError otherwise. Return dict with predictions and latency_ms.",
        starterCode: code(`
from time import perf_counter
from typing import Iterable, Dict, Any


def serve_requests(model, payloads: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate payloads, run batch prediction, and report latency."""
    inputs = []
    for payload in payloads:
        # TODO: validate payload and extract features
        ...

    start = perf_counter()
    preds = model.predict_batch(inputs)
    latency = (perf_counter() - start) * 1000
    return {"predictions": preds, "latency_ms": latency}
`),
        hints: [
          "Ensure every payload contains a features list.",
          "Collect features in the same order as payloads.",
        ],
        tests: [
          {
            id: "predicts",
            description: "Returns predictions and latency.",
            assertion: assertion(`
class Dummy:
    def predict_batch(self, xs):
        return [sum(x) for x in xs]


def __test__():
    result = serve_requests(Dummy(), [{"features": [1, 2]}, {"features": [3, 4]}])
    return result["predictions"] == [3, 7] and "latency_ms" in result
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "mls-monitoring",
      title: "Monitoring & Drift Detection",
      duration: "19 min",
      difficulty: "challenge",
      overview:
        "Detect data and performance drift by comparing live metrics to baselines and triggering alerts.",
      learningObjectives: [
        "Compute PSI-style drift scores",
        "Track moving averages for alerting",
        "Return human-readable status summaries",
      ],
      reading: [
        {
          label: "ML monitoring guide",
          url: "https://evidentlyai.com/blog/ml-monitoring-guide",
        },
      ],
      codeConcepts: ["psi", "thresholds", "math"],
      exercise: {
        id: "exercise-monitoring",
        title: "Population Stability Indicator",
        prompt:
          "Implement psi(expected, actual) returning the population stability indicator for equal-length distributions and classify drift level (low/medium/high) using thresholds 0.1 and 0.25.",
        starterCode: code(`
from typing import Iterable, Tuple
import math


def psi(expected: Iterable[float], actual: Iterable[float]) -> Tuple[float, str]:
    """Return PSI score and drift level."""
    score = 0.0

    # TODO: iterate bins, accumulate PSI, guard against zero expected counts
    ...

    level = "low"
    if score >= 0.25:
        level = "high"
    elif score >= 0.1:
        level = "medium"

    return round(score, 4), level
`),
        hints: [
          "PSI per bin equals (actual - expected) * ln(actual / expected).",
          "Skip bins where expected is zero to avoid division errors.",
        ],
        tests: [
          {
            id: "psi",
            description: "Computes drift classification.",
            assertion: assertion(`
def __test__():
    score, level = psi([0.2, 0.8], [0.4, 0.6])
    return round(score, 3) == 0.196 and level == "medium"
__test__()
`),
            expected: "True",
          },
        ],
      },
    }
  ],
  capstone: {
    id: "mls-capstone",
    title: "Production ML Control Plane",
    summary:
      "Ship an end-to-end ML system: ingest data contracts, build feature pipelines, orchestrate retraining, and monitor live performance with automated alerts.",
    deliverables: [
      "Data contract + validation CLI",
      "Training pipeline orchestrated with dependency graph",
      "Monitoring dashboard summarising drift and experiment runs",
    ],
    checkpoints: [
      "Ingestion script validating schemas",
      "Experiment tracker with comparison report",
      "Serving endpoint with monitoring hooks",
    ],
  },
};
