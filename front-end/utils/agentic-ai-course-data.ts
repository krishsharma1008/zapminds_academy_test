export type AgentExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type AgentExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: AgentExerciseTest[];
};

export type AgentModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: AgentExercise;
};

export type AgentCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type AgenticCourseContent = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: AgentModule[];
  capstone: AgentCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const agenticAiCourseContent: AgenticCourseContent = {
  courseId: "agentic-ai",
  title: "Agentic AI Applications",
  hero: {
    headline: "Agentic AI Applications",
    kicker: "Expert · Autonomous Agents",
    description:
      "Design, coordinate, and monitor autonomous AI agents that plan, delegate, and recover gracefully when reality shifts.",
    progressPercent: 39,
  },
  modules: [
    {
      id: "agent-goal-profiles",
      title: "Goal Profiles & Constraints",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Model goals with priorities, success signals, and blocking constraints so planners understand what winning looks like.",
      learningObjectives: [
        "Normalise goal metadata for downstream planners",
        "Attach priority and constraint tags",
        "Validate inputs and raise helpful errors",
      ],
      reading: [
        {
          label: "Goal-Conditioned Policies",
          url: "https://openai.com/research/instructgpt",
        },
      ],
      codeConcepts: ["dicts", "validation", "sorting"],
      exercise: {
        id: "exercise-goal-profile",
        title: "Normalise Goal Profile",
        prompt:
          "Implement build_goal_profile(goal) returning dict with name, priority (int), constraints list, and success_metrics list sorted alphabetically. Raise ValueError if required fields missing.",
        starterCode: code(`
from typing import Dict, List


def build_goal_profile(goal: Dict[str, object]) -> Dict[str, object]:
    """Normalise goal metadata for planners."""
    # TODO: validate goal and return normalised structure
    ...
`),
        hints: [
          "Expect keys: name (str), priority (int), constraints (list), success_metrics (list).",
          "Default constraints/success_metrics to empty lists when missing.",
          "Sort metric names alphabetically to keep output stable.",
        ],
        tests: [
          {
            id: "profile",
            description: "Normalises goal structure and sorts metrics.",
            assertion: assertion(`
def __test__():
    profile = build_goal_profile({
        "name": "Launch onboarding",
        "priority": 2,
        "success_metrics": ["activation-rate", "nps"],
        "constraints": ["security-review"],
    })
    return profile["name"] == "Launch onboarding" and profile["priority"] == 2 and profile["success_metrics"] == ["activation-rate", "nps"]
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid",
            description: "Rejects missing name field.",
            assertion: assertion(`
def __test__():
    try:
        build_goal_profile({"priority": 1})
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
      id: "agent-adaptive-planning",
      title: "Adaptive Goal Re-planning",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Update execution plans on the fly as reality shifts, incorporating feedback signals without losing context.",
      learningObjectives: [
        "Reprioritise steps using feedback scores",
        "Promote blockers to the front of the queue",
        "Return updated plans with change logs",
      ],
      reading: [
        {
          label: "Reflexion: Language Agents with Verbal Reinforcement",
          url: "https://arxiv.org/abs/2303.11366",
        },
      ],
      codeConcepts: ["lists", "sorting", "tuples"],
      exercise: {
        id: "exercise-replan",
        title: "Reprioritise Plan",
        prompt:
          "Implement replan(plan, feedback) returning list of steps sorted by new priority. plan is list of dicts with id, description, priority. feedback maps id to delta (negative means higher urgency).",
        starterCode: code(`
from typing import Dict, Iterable, List


def replan(plan: Iterable[Dict[str, object]], feedback: Dict[str, int]) -> List[Dict[str, object]]:
    """Apply feedback deltas to priorities and resort steps."""
    # TODO: adjust priorities and sort ascending (lower number = higher priority)
    ...
`),
        hints: [
          "Copy plan entries to avoid mutating input.",
          "New priority = old priority + feedback.get(id, 0).",
          "Sort by new priority, then by id for determinism.",
        ],
        tests: [
          {
            id: "reorders",
            description: "Moves urgent step to front.",
            assertion: assertion(`
def __test__():
    plan = [
        {"id": "write-docs", "priority": 3},
        {"id": "ship-feature", "priority": 2},
    ]
    result = replan(plan, {"write-docs": -2})
    return result[0]["id"] == "write-docs" and result[0]["priority"] == 1
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-tool-routing",
      title: "Task Delegation & Tool Selection",
      duration: "17 min",
      difficulty: "core",
      overview:
        "Route tasks to the right specialist agent or toolchain using capability tags and availability windows.",
      learningObjectives: [
        "Match required skills with available agents",
        "Consider availability windows during routing",
        "Return rationale for each assignment",
      ],
      reading: [
        {
          label: "Toolformer & Agent Frameworks",
          url: "https://arxiv.org/abs/2302.04761",
        },
      ],
      codeConcepts: ["sets", "dicts", "sorting"],
      exercise: {
        id: "exercise-assign-task",
        title: "Assign Task to Agent",
        prompt:
          "Implement assign_task(task, agents) returning dict with agent_id and reason. task has required_skills set and due_at (int). agents is list of dicts with id, skills set, available_until (int). Choose agent covering all required skills with longest available_until; break ties lexicographically by id.",
        starterCode: code(`
from typing import Dict, Iterable


def assign_task(task: Dict[str, object], agents: Iterable[Dict[str, object]]) -> Dict[str, str]:
    """Assign task to best-fit agent with clear rationale."""
    # TODO: filter by skill coverage and availability
    ...
`),
        hints: [
          "Agent must have required skills and available_until >= due_at.",
          "Select agent with max available_until.",
          "Reason can list matched skills joined by comma.",
        ],
        tests: [
          {
            id: "assigns",
            description: "Picks agent meeting skill/time requirements.",
            assertion: assertion(`
def __test__():
    task = {"required_skills": {"sql", "analysis"}, "due_at": 10}
    agents = [
        {"id": "alpha", "skills": {"sql"}, "available_until": 12},
        {"id": "beta", "skills": {"sql", "analysis"}, "available_until": 9},
        {"id": "gamma", "skills": {"sql", "analysis"}, "available_until": 15},
    ]
    result = assign_task(task, agents)
    return result["agent_id"] == "gamma" and "sql" in result["reason"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-memory",
      title: "Context Memory & Summaries",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Blend short-term scratchpad notes with persistent memory to keep agents grounded between turns.",
      learningObjectives: [
        "Persist pinned memories while rotating recent context",
        "Limit scratchpad size to avoid token blowups",
        "Return structured bundles for prompts",
      ],
      reading: [
        {
          label: "Long-term Memory for LLM Agents",
          url: "https://eugeneyan.com/writing/llm-memory/",
        },
      ],
      codeConcepts: ["lists", "filtering", "string formatting"],
      exercise: {
        id: "exercise-build-memory",
        title: "Build Memory Bundles",
        prompt:
          "Implement build_memory(messages, scratch_limit=3) returning dict with pinned and scratchpad lists. messages is list of dicts with content and optional pinned True. scratchpad should contain most recent non-pinned messages up to limit formatted as 'role: content'.",
        starterCode: code(`
from typing import Dict, Iterable, List


def build_memory(messages: Iterable[Dict[str, object]], scratch_limit: int = 3) -> Dict[str, List[str]]:
    """Separate pinned memories from rotating scratchpad."""
    # TODO: collect pinned entries and recent non-pinned formatted lines
    ...
`),
        hints: [
          "Pinned entries should preserve original content order.",
          "Scratchpad should traverse messages chronologically and take last scratch_limit non-pinned.",
          "Format scratch entries using role key (default 'user').",
        ],
        tests: [
          {
            id: "splits-memory",
            description: "Keeps pinned notes and trims scratchpad.",
            assertion: assertion(`
def __test__():
    history = [
        {"role": "user", "content": "Remember to ping finance", "pinned": True},
        {"role": "assistant", "content": "Noted."},
        {"role": "user", "content": "Draft invoice"},
        {"role": "assistant", "content": "Invoice drafted."},
    ]
    result = build_memory(history, scratch_limit=2)
    return result["pinned"] == ["Remember to ping finance"] and result["scratchpad"][0].startswith("user:")
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-scheduling",
      title: "Event Loop & Throttling",
      duration: "19 min",
      difficulty: "challenge",
      overview:
        "Schedule agent actions under concurrency limits while preventing starvation of lower-priority tasks.",
      learningObjectives: [
        "Manage queues with maximum concurrent actions",
        "Ensure lower-priority tasks eventually execute",
        "Return scheduling traces for observability",
      ],
      reading: [
        {
          label: "Async Architectures for Agents",
          url: "https://vercel.com/blog/the-rise-of-ai-agents",
        },
      ],
      codeConcepts: ["queues", "iteration", "round robin"],
      exercise: {
        id: "exercise-schedule",
        title: "Round-Robin Scheduler",
        prompt:
          "Implement schedule(actions, concurrency) returning list of execution order. actions is dict priority->list of action ids. Execute round-robin across priorities starting from lowest number until lists exhausted, respecting concurrency batch size (number executed per cycle).",
        starterCode: code(`
from collections import deque
from typing import Deque, Dict, List


def schedule(actions: Dict[int, List[str]], concurrency: int) -> List[str]:
    """Return execution order using priority-based round robin."""
    # TODO: iterate through priority queues and pop up to concurrency items each cycle
    ...
`),
        hints: [
          "Sort priorities ascending.",
          "Use deques for efficient pops from left.",
          "Continue cycling while any queue has items.",
        ],
        tests: [
          {
            id: "schedules",
            description: "Distributes actions across priorities.",
            assertion: assertion(`
def __test__():
    order = schedule({1: ["a1", "a2"], 2: ["b1"]}, concurrency=1)
    return order[:3] == ["a1", "b1", "a2"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-communication",
      title: "Multi-Agent Messaging Fabrics",
      duration: "18 min",
      difficulty: "challenge",
      overview:
        "Coordinate specialist agents with channel routing, broadcast rules, and targeted subscriptions.",
      learningObjectives: [
        "Model channels with subscriber lists",
        "Deliver messages respecting broadcast scope",
        "Track acknowledgements from recipients",
      ],
      reading: [
        {
          label: "Multi-Agent Communication Topologies",
          url: "https://arxiv.org/abs/2110.07752",
        },
      ],
      codeConcepts: ["dicts", "sets", "iteration"],
      exercise: {
        id: "exercise-route-messages",
        title: "Route Agent Messages",
        prompt:
          "Implement route_messages(channels, message) returning list of recipient ids. channels maps channel name to subscribers set. message has channel and optional targets list. When targets provided, send only to intersection of channel subscribers and targets; otherwise broadcast to all subscribers.",
        starterCode: code(`
from typing import Dict, Iterable, List, Set


def route_messages(channels: Dict[str, Set[str]], message: Dict[str, object]) -> List[str]:
    """Return ordered recipients for a routed message."""
    # TODO: compute recipients respecting optional targets and sort for determinism
    ...
`),
        hints: [
          "Raise ValueError if channel not found.",
          "Return recipients sorted alphabetically.",
          "If no recipients, return empty list (do not raise).",
        ],
        tests: [
          {
            id: "broadcast",
            description: "Broadcasts to all subscribers when no targets provided.",
            assertion: assertion(`
def __test__():
    recipients = route_messages({"ops": {"alpha", "beta"}}, {"channel": "ops"})
    return recipients == ["alpha", "beta"]
__test__()
`),
            expected: "True",
          },
          {
            id: "targets",
            description: "Restricts delivery to target subset.",
            assertion: assertion(`
def __test__():
    recipients = route_messages({"ops": {"alpha", "beta"}}, {"channel": "ops", "targets": ["beta", "gamma"]})
    return recipients == ["beta"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-risk",
      title: "Proactive Risk Monitoring",
      duration: "17 min",
      difficulty: "challenge",
      overview:
        "Scan proposed agent actions for policy violations and risk score spikes before execution.",
      learningObjectives: [
        "Evaluate actions against disallowed patterns",
        "Score risk levels with adjustable weights",
        "Return structured reports for auditors",
      ],
      reading: [
        {
          label: "Safety Considerations for Autonomous Agents",
          url: "https://openai.com/blog/function-calling-and-other-api-updates",
        },
      ],
      codeConcepts: ["list comprehension", "math", "dicts"],
      exercise: {
        id: "exercise-risk-report",
        title: "Compute Risk Report",
        prompt:
          "Implement risk_report(actions, weights) returning dict with total_score and flagged list. Each action dict has name, risk_scores dict (keys align with weights), and prohibited flag. Flag action when prohibited or total component score > 0.7.",
        starterCode: code(`
from typing import Dict, Iterable, List


def risk_report(actions: Iterable[Dict[str, object]], weights: Dict[str, float]) -> Dict[str, object]:
    """Return aggregate risk score and flagged actions."""
    # TODO: compute weighted scores and identify flagged actions
    ...
`),
        hints: [
          "Component total = sum(risk_scores[k] * weights.get(k, 1.0)).",
          "total_score should average component totals across actions.",
          "Flagged entries can include {'name': action_name, 'score': score}.",
        ],
        tests: [
          {
            id: "flags",
            description: "Flags prohibited action and computes score.",
            assertion: assertion(`
def __test__():
    report = risk_report(
        [
            {"name": "read_docs", "risk_scores": {"safety": 0.1}},
            {"name": "delete_db", "risk_scores": {"safety": 0.9}, "prohibited": True},
        ],
        {"safety": 1.0},
    )
    return any(item["name"] == "delete_db" for item in report["flagged"]) and report["total_score"] >= 0.5
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-simulation",
      title: "Scenario Simulation & Replay",
      duration: "18 min",
      difficulty: "lab",
      overview:
        "Replay sandboxes to validate policy adherence and gather training data for goal-conditioned agents.",
      learningObjectives: [
        "Step through simulation events deterministically",
        "Record state transitions for later analysis",
        "Compute summary statistics from runs",
      ],
      reading: [
        {
          label: "Simulations for Agent Evaluation",
          url: "https://arxiv.org/abs/2310.06775",
        },
      ],
      codeConcepts: ["iteration", "state machines", "statistics"],
      exercise: {
        id: "exercise-run-simulation",
        title: "Run Scenario Simulation",
        prompt:
          "Implement run_simulation(events) returning dict with final_state and steps. events is list of dicts with delta dict applied to state dict. Start from {} and merge deltas shallowly.",
        starterCode: code(`
from typing import Dict, Iterable, Tuple


def run_simulation(events: Iterable[Dict[str, Dict[str, object]]]) -> Dict[str, object]:
    """Apply deltas to state sequentially and record steps."""
    # TODO: merge each delta into state and collect snapshots
    ...
`),
        hints: [
          "Use state.copy() before updating to keep history safe.",
          "steps can be list of state snapshots after each event.",
          "Return references should not leak internal state (copy).",
        ],
        tests: [
          {
            id: "simulation",
            description: "Applies deltas sequentially.",
            assertion: assertion(`
def __test__():
    result = run_simulation([{"delta": {"energy": 10}}, {"delta": {"energy": 7, "tasks": 1}}])
    return result["final_state"] == {"energy": 7, "tasks": 1} and len(result["steps"]) == 2
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "agent-evaluation",
      title: "Agent Performance Dashboards",
      duration: "17 min",
      difficulty: "lab",
      overview:
        "Aggregate agent run metrics, compute goal attainment scores, and surface regression warnings.",
      learningObjectives: [
        "Average metrics across runs with weights",
        "Highlight regressions versus baselines",
        "Return human-readable dashboard summary",
      ],
      reading: [
        {
          label: "Eval Harnesses for Agents",
          url: "https://weightsandbiases.com/blog/evaluating-llm-agents",
        },
      ],
      codeConcepts: ["dict aggregation", "formatting", "sorting"],
      exercise: {
        id: "exercise-agent-dashboard",
        title: "Build Agent Dashboard Summary",
        prompt:
          "Implement build_dashboard(runs, baseline) returning dict with averages and regressions. runs list contains dicts with metrics dict and weight. baseline maps metric->value. Regression when average < baseline * 0.9.",
        starterCode: code(`
from typing import Dict, Iterable, List


def build_dashboard(runs: Iterable[Dict[str, object]], baseline: Dict[str, float]) -> Dict[str, object]:
    """Aggregate run metrics and detect regressions."""
    # TODO: compute weighted averages and list regressions
    ...
`),
        hints: [
          "Weighted average: sum(value * weight)/sum(weight).",
          "Store averages in dict rounded to 3 decimals.",
          "Regressions list can include metric names only.",
        ],
        tests: [
          {
            id: "averages",
            description: "Computes weighted averages and regressions.",
            assertion: assertion(`
def __test__():
    runs = [
        {"metrics": {"success": 0.8, "latency": 120}, "weight": 1},
        {"metrics": {"success": 0.9, "latency": 110}, "weight": 2},
    ]
    result = build_dashboard(runs, {"success": 0.95, "latency": 130})
    return round(result["averages"]["success"], 3) == 0.867 and "success" in result["regressions"] and "latency" not in result["regressions"]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
  ],
  capstone: {
    id: "agentic-capstone",
    title: "Autonomous Ops Command Center",
    summary:
      "Deliver an agent command center that plans, delegates, monitors risk, and evaluates impact with replayable simulations.",
    deliverables: [
      "Adaptive planner with goal profiles and routing",
      "Multi-agent comms fabric with guardrails",
      "Observability dashboard with regression alerts",
    ],
    checkpoints: [
      "Re-planning scenario demo",
      "Risk monitor incident runbook",
      "Dashboard summarising evaluation runs",
    ],
  },
};
