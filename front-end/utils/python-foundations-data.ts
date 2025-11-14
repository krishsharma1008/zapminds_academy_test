export type PythonExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type PythonExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: PythonExerciseTest[];
};

export type PythonModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "warmup" | "core" | "challenge";
  overview: string;
  learningObjectives: string[];
  reading: {
    label: string;
    url: string;
  }[];
  codeConcepts: string[];
  exercise: PythonExercise;
};

export type PythonProjectBrief = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type PythonCourseContent = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: PythonModule[];
  capstone: PythonProjectBrief;
};

export const pythonFoundationsContent: PythonCourseContent = {
  courseId: "python",
  title: "Python Foundations",
  hero: {
    headline: "Python Foundations",
    kicker: "Beginner · Programming",
    description:
      "Move from Python novice to confident practitioner. Each module builds on the previous one, combining clear explanations, curated readings, and LeetCode-style practice so you master core concepts before levelling up.",
    progressPercent: 40,
  },
  modules: [
    {
      id: "python-basics",
      title: "Language Essentials",
      duration: "15 min",
      difficulty: "warmup",
      overview:
        "Get comfortable with Python syntax, string interpolation, numeric operations, and running code in scripts or REPLs.",
      learningObjectives: [
        "Print, interpolate, and format strings idiomatically",
        "Convert basic input types and perform arithmetic safely",
        "Create simple helper functions to keep scripts tidy",
      ],
      reading: [
        {
          label: "Python tutorial – An Informal Introduction",
          url: "https://docs.python.org/3/tutorial/introduction.html",
        },
        {
          label: "f-strings in Python",
          url: "https://realpython.com/python-f-strings/",
        },
      ],
      codeConcepts: ["f-strings", "type conversion", "def", "return"],
      exercise: {
        id: "exercise-basics",
        title: "Craft Welcome Messages",
        prompt:
          "Implement `format_welcome(name: str, lessons_completed: int)` so it returns a friendly sentence with proper spacing and title-case names.",
        starterCode: `def format_welcome(name: str, lessons_completed: int) -> str:
    """Return a message welcoming the learner back."""
    # TODO: Normalise the name and build the sentence using an f-string
    ...
`,
        hints: [
          "Use `name.strip().title()` to clean up learner names.",
          "f-strings keep formatting readable: `f\"Welcome back, {value}!\"`.",
        ],
        tests: [
          {
            id: "basic-message",
            description: "Creates a correctly formatted message.",
            assertion: `
def __test__():
    return format_welcome("krish", 3) == "Welcome back, Krish! You have completed 3 lessons."
__test__()
`,
            expected: "True",
          },
          {
            id: "trims-input",
            description: "Trims whitespace before formatting.",
            assertion: `
def __test__():
    return format_welcome("  TEAM zap  ", 5) == "Welcome back, Team Zap! You have completed 5 lessons."
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-control-flow",
      title: "Control Flow & Branching",
      duration: "18 min",
      difficulty: "warmup",
      overview:
        "Master conditional logic and loops so your programs take the right branches and summarise data effortlessly.",
      learningObjectives: [
        "Use `if/elif/else` to model decision trees",
        "Iterate over sequences with `for` loops and enumerate",
        "Guard against invalid input with defensive checks",
      ],
      reading: [
        {
          label: "Python control flow tools",
          url: "https://docs.python.org/3/tutorial/controlflow.html",
        },
      ],
      codeConcepts: ["if statements", "for loops", "raise ValueError"],
      exercise: {
        id: "exercise-control-flow",
        title: "Score Band Calculator",
        prompt:
          "Implement `classify_score(score: int)` that returns 'excellent', 'on track', or 'needs practice' based on the numeric range. Values outside 0-100 should raise `ValueError`.",
        starterCode: `def classify_score(score: int) -> str:
    """Return a textual band for a progress score between 0 and 100."""
    # TODO: Validate the range then map to a label
    ...
`,
        hints: [
          "Accept only integers from 0 to 100 before branching.",
          "Consider using chained comparisons like `90 <= score <= 100`.",
        ],
        tests: [
          {
            id: "excellent",
            description: "Scores >= 90 are excellent.",
            assertion: `
def __test__():
    return classify_score(95) == "excellent"
__test__()
`,
            expected: "True",
          },
          {
            id: "middle-band",
            description: "A middle score is labelled on track.",
            assertion: `
def __test__():
    return classify_score(68) == "on track"
__test__()
`,
            expected: "True",
          },
          {
            id: "invalid",
            description: "Out-of-range scores raise ValueError.",
            assertion: `
def __test__():
    try:
        classify_score(120)
    except ValueError:
        return True
    return False
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-collections",
      title: "Working with Collections",
      duration: "22 min",
      difficulty: "core",
      overview:
        "Learn to model data with lists and dictionaries, perform aggregations, and reshape structures for downstream tasks.",
      learningObjectives: [
        "Traverse nested data with loops and comprehensions",
        "Aggregate values using dictionaries and default structures",
        "Return sorted, predictable outputs for deterministic tests",
      ],
      reading: [
        {
          label: "Built-in types — list and dict",
          url: "https://docs.python.org/3/library/stdtypes.html",
        },
        {
          label: "collections.defaultdict",
          url: "https://docs.python.org/3/library/collections.html#collections.defaultdict",
        },
      ],
      codeConcepts: ["dict", "defaultdict", "list comprehension"],
      exercise: {
        id: "exercise-collections",
        title: "Build a Topic Index",
        prompt:
          "Create `build_topic_index(records)` which takes a list of dictionaries with keys `student` and `topic`, returning a dictionary mapping each topic to an alphabetically sorted list of student names.",
        starterCode: `from collections import defaultdict
from typing import Dict, List


def build_topic_index(records: List[Dict[str, str]]) -> Dict[str, List[str]]:
    """Return a mapping of topic -> sorted learners."""
    # TODO: aggregate students per topic and return a regular dict
    ...
`,
        hints: [
          "Start with `defaultdict(list)` to append names easily.",
          "Remember to title-case names before sorting for presentation.",
        ],
        tests: [
          {
            id: "groups-and-sorts",
            description: "Groups students per topic and sorts alphabetically.",
            assertion: `
def __test__():
    records = [
        {"student": "sara", "topic": "loops"},
        {"student": "Ishaan", "topic": "loops"},
        {"student": "Maya", "topic": "testing"},
        {"student": "sara", "topic": "functions"},
    ]
    index = build_topic_index(records)
    return (
        set(index.keys()) == {"loops", "functions", "testing"}
        and index["loops"] == ["Ishaan", "Sara"]
    )
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-functions",
      title: "Functions & Composition",
      duration: "20 min",
      difficulty: "core",
      overview:
        "Break problems into reusable building blocks, pass functions as data, and compose operations like pipelines.",
      learningObjectives: [
        "Define pure functions that accept and return callables",
        "Close over state to create reusable utilities",
        "Write docstrings that clarify behaviour and edge cases",
      ],
      reading: [
        {
          label: "Higher-order functions in Python",
          url: "https://realpython.com/inner-functions-what-are-they-good-for/",
        },
      ],
      codeConcepts: ["callable", "*args", "inner functions"],
      exercise: {
        id: "exercise-functions",
        title: "Compose Study Pipelines",
        prompt:
          "Implement `make_pipeline(*steps)` which returns a function that applies each callable in order to an input value.",
        starterCode: `from collections.abc import Callable
from typing import Any


def make_pipeline(*steps: Callable[[Any], Any]) -> Callable[[Any], Any]:
    """Return a function that runs all steps sequentially."""
    # TODO: define and return a closure that iterates over the steps
    ...
`,
        hints: [
          "Define an inner function that captures `steps`.",
          "Loop through each step, updating a running value.",
        ],
        tests: [
          {
            id: "composes",
            description: "Composes two simple transformations.",
            assertion: `
def __test__():
    pipeline = make_pipeline(str.strip, str.title)
    return pipeline("  zapminds academy  ") == "Zapminds Academy"
__test__()
`,
            expected: "True",
          },
          {
            id: "handles-empty",
            description: "Pipeline returns the same value when no steps are provided.",
            assertion: `
def __test__():
    pipeline = make_pipeline()
    return pipeline({"xp": 10}) == {"xp": 10}
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-files",
      title: "Files & Context Managers",
      duration: "24 min",
      difficulty: "core",
      overview:
        "Automate reports by reading structured text, parsing records, and calculating totals with safe context managers.",
      learningObjectives: [
        "Open text resources with `with` blocks and handle encoding",
        "Split and validate CSV-style data inputs",
        "Aggregate durations or scores from raw records",
      ],
      reading: [
        {
          label: "Reading and writing files",
          url: "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files",
        },
      ],
      codeConcepts: ["with", "Path", "sum", "strip"],
      exercise: {
        id: "exercise-files",
        title: "Parse Study Log Files",
        prompt:
          "Implement `capture_minutes(log_lines)` that consumes an iterable of `student,minutes` strings and returns a dictionary of total minutes per student.",
        starterCode: `from typing import Dict, Iterable


def capture_minutes(log_lines: Iterable[str]) -> Dict[str, int]:
    """Return total study minutes per student."""
    # TODO: parse comma-separated values, ignore blank lines, and accumulate totals
    ...
`,
        hints: [
          "Skip empty lines by checking `strip()`.",
          "Convert minutes to `int` before adding to totals.",
        ],
        tests: [
          {
            id: "aggregates",
            description: "Aggregates minutes for each learner.",
            assertion: `
def __test__():
    log = [
        "Krish,15",
        "Anaya,10 ",
        "Krish, 20",
        "",
        "Mira,5"
    ]
    result = capture_minutes(log)
    return result == {"Krish": 35, "Anaya": 10, "Mira": 5}
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-iterators",
      title: "Iterables & Comprehensions",
      duration: "20 min",
      difficulty: "core",
      overview:
        "Transform sequences efficiently with comprehensions, slices, and reusable iterator helpers.",
      learningObjectives: [
        "Use generator functions to avoid loading everything into memory",
        "Implement sliding windows and batching patterns",
        "Write property-based friendly helpers that return tuples",
      ],
      reading: [
        {
          label: "Itertools — functions creating iterators",
          url: "https://docs.python.org/3/library/itertools.html",
        },
      ],
      codeConcepts: ["yield", "enumerate", "tuple"],
      exercise: {
        id: "exercise-iterators",
        title: "Create a Windowed Iterator",
        prompt:
          "Write `windowed(iterable, size, step=1)` yielding tuples representing sliding windows. Windows should advance by `step` and stop when an incomplete window would be produced.",
        starterCode: `from collections.abc import Iterable
from typing import Iterator, Tuple, TypeVar

T = TypeVar("T")


def windowed(iterable: Iterable[T], size: int, step: int = 1) -> Iterator[Tuple[T, ...]]:
    """Yield sliding windows across the iterable."""
    # TODO: materialise the input minimally and yield fixed-size tuples
    ...
`,
        hints: [
          "Consider casting to `list` once for simplicity.",
          "Use `range(0, len(items) - size + 1, step)` to decide start indices.",
        ],
        tests: [
          {
            id: "basic-window",
            description: "Generates overlapping windows.",
            assertion: `
def __test__():
    windows = list(windowed([1, 2, 3, 4], size=3))
    return windows == [(1, 2, 3), (2, 3, 4)]
__test__()
`,
            expected: "True",
          },
          {
            id: "step",
            description: "Supports custom steps.",
            assertion: `
def __test__():
    windows = list(windowed([1, 2, 3, 4, 5, 6], size=2, step=2))
    return windows == [(1, 2), (3, 4), (5, 6)]
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-oop",
      title: "Object-Oriented Patterns",
      duration: "24 min",
      difficulty: "core",
      overview:
        "Model stateful systems with classes, encapsulate behaviour, and expose clean APIs for collaborators.",
      learningObjectives: [
        "Define classes with initial state and convenience methods",
        "Enforce invariants like unique ids inside collections",
        "Expose read-only views of internal state",
      ],
      reading: [
        {
          label: "Classes in Python",
          url: "https://docs.python.org/3/tutorial/classes.html",
        },
      ],
      codeConcepts: ["__init__", "dict", "raise"],
      exercise: {
        id: "exercise-oop",
        title: "Manage a Task Board",
        prompt:
          "Implement a `TaskBoard` class that adds tasks, marks them complete, and returns outstanding tasks ordered by priority (lower numbers first).",
        starterCode: `from typing import Dict, List


class TaskBoard:
    def __init__(self) -> None:
        self._tasks: Dict[str, Dict[str, object]] = {}

    def add_task(self, name: str, *, priority: int = 3) -> None:
        """Register a new task. Raise ValueError when a duplicate is added."""
        # TODO: store task metadata
        ...

    def complete(self, name: str) -> None:
        """Mark a task as completed."""
        ...

    def pending(self) -> List[str]:
        """Return task names still open ordered by priority then name."""
        ...
`,
        hints: [
          "Use a dictionary keyed by task name for quick lookups.",
          "Represent completion with a boolean flag.",
          "`sorted` can accept a key returning `(priority, name)` tuples.",
        ],
        tests: [
          {
            id: "adds-and-orders",
            description: "Stores tasks and orders by priority then name.",
            assertion: `
def __test__():
    board = TaskBoard()
    board.add_task("Notes", priority=2)
    board.add_task("Setup IDE", priority=1)
    board.add_task("Stretch", priority=1)
    return board.pending() == ["Setup IDE", "Stretch", "Notes"]
__test__()
`,
            expected: "True",
          },
          {
            id: "complete",
            description: "Completed tasks disappear from the pending list.",
            assertion: `
def __test__():
    board = TaskBoard()
    board.add_task("Notebook")
    board.complete("Notebook")
    return board.pending() == []
__test__()
`,
            expected: "True",
          },
          {
            id: "duplicate",
            description: "Duplicate task names raise ValueError.",
            assertion: `
def __test__():
    board = TaskBoard()
    board.add_task("Notebook")
    try:
        board.add_task("Notebook")
    except ValueError:
        return True
    return False
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-dataclasses",
      title: "Dataclasses & Type Hints",
      duration: "25 min",
      difficulty: "challenge",
      overview:
        "Cut boilerplate with dataclasses, enforce invariants, and combine with static typing for confident refactors.",
      learningObjectives: [
        "Define dataclasses with generated ids and timestamps",
        "Normalise incoming data with `__post_init__`",
        "Expose rich helper methods like `add_tag` without mutating unexpectedly",
      ],
      reading: [
        {
          label: "PEP 557 – Data Classes",
          url: "https://peps.python.org/pep-0557/",
        },
        {
          label: "Typing — cheat sheet",
          url: "https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html",
        },
      ],
      codeConcepts: ["@dataclass", "default_factory", "List[str]"],
      exercise: {
        id: "exercise-dataclasses",
        title: "Annotate Learning Notes",
        prompt:
          "Design a `LearningNote` dataclass that auto-generates a unique id, normalises tags to uppercase, and records the created timestamp. Implement an `add_tag` method that avoids duplicates.",
        starterCode: `from dataclasses import dataclass, field
from datetime import datetime
from typing import List
from uuid import uuid4


@dataclass
class LearningNote:
    title: str
    body: str
    tags: List[str] = field(default_factory=list)
    # TODO: add id and created_at fields

    def __post_init__(self) -> None:
        # TODO: normalise initial tags
        ...

    def add_tag(self, tag: str) -> None:
        # TODO: implement tag normalisation and dedupe
        ...


def format_note(note: LearningNote) -> str:
    return f"{note.title} :: {', '.join(note.tags)}"
`,
        hints: [
          "Use `field(default_factory=uuid4)` to assign ids.",
          "Strip whitespace and uppercase tags before storing them.",
          "Guard against duplicates by checking membership before appending.",
        ],
        tests: [
          {
            id: "assigns-id",
            description: "LearningNote instances expose a 32-character hexadecimal id.",
            assertion: `
def __test__():
    note = LearningNote("Dataclasses", "Less boilerplate!", ["python"])
    return len(note.id) == 32
__test__()
`,
            expected: "True",
          },
          {
            id: "normalises-tags",
            description: "Repeated tags are deduplicated and uppercased.",
            assertion: `
def __test__():
    note = LearningNote("Decorators", "Great for cross-cutting")
    note.add_tag("patterns")
    note.add_tag("Patterns ")
    return format_note(note) == "Decorators :: PATTERNS"
__test__()
`,
            expected: "True",
          },
          {
            id: "records-created-at",
            description: "created_at stores a datetime instance.",
            assertion: `
import datetime as _dt

def __test__():
    note = LearningNote("Async IO", "Await!")
    return isinstance(note.created_at, _dt.datetime)
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-async",
      title: "Async IO Fundamentals",
      duration: "28 min",
      difficulty: "challenge",
      overview:
        "Build cooperative multitasking workflows with asyncio, cancellations, and structured concurrency.",
      learningObjectives: [
        "Create coroutines, gather tasks, and await results in parallel",
        "Implement graceful cancellation and timeout strategies",
        "Trace event loop behaviour with logging and instrumentation",
      ],
      reading: [
        {
          label: "Asyncio tasks and coroutines",
          url: "https://docs.python.org/3/library/asyncio-task.html",
        },
        {
          label: "Structured concurrency with TaskGroup",
          url: "https://realpython.com/python310-new-features/#exception-groups-and-taskgroup",
        },
      ],
      codeConcepts: ["async def", "create_task", "gather", "TimeoutError"],
      exercise: {
        id: "exercise-async",
        title: "Parallel Course Fetcher",
        prompt:
          "Implement `fetch_course` to simulate fetching a course module with latency. Compose `load_progress` using `asyncio.gather` so modules resolve in parallel. Apply a timeout so hung requests don’t block progress.",
        starterCode: `import asyncio
import random
from typing import Dict, List


async def fetch_course(course_id: str) -> Dict[str, str]:
    """Simulate fetching course metadata."""
    # TODO: add random latency and return a payload with the id
    ...


async def load_progress(course_ids: List[str], timeout: float = 1.0) -> List[Dict[str, str]]:
    """Return course payloads, skipping requests that exceed the timeout."""
    # TODO: schedule tasks concurrently and cancel those exceeding the timeout
    ...


async def main():
    response = await load_progress(["python", "ml", "rag"])
    print(len(response))


if __name__ == "__main__":
    asyncio.run(main())
`,
        hints: [
          "Use `asyncio.sleep` with a random delay to emulate remote latency.",
          "Wrap `asyncio.gather(..., return_exceptions=True)` so timeouts don’t crash the batch.",
          "Cancel pending tasks when `asyncio.wait_for` raises `TimeoutError`.",
        ],
        tests: [
          {
            id: "returns-length",
            description: "One course id yields one payload.",
            assertion: `
import asyncio

def __test__():
    result = asyncio.run(load_progress(["python"]))
    return len(result) == 1 and result[0]["id"] == "python"
__test__()
`,
            expected: "True",
          },
          {
            id: "parallel-execution",
            description: "Three ids complete within the timeout window.",
            assertion: `
import asyncio
import time

def __test__():
    start = time.perf_counter()
    result = asyncio.run(load_progress(["python", "ml", "rag"]))
    duration = time.perf_counter() - start
    return (len(result) == 3) and (duration < 1.5)
__test__()
`,
            expected: "True",
          },
          {
            id: "handles-timeout",
            description: "Aggressive timeout cancels pending fetches gracefully.",
            assertion: `
import asyncio

def __test__():
    result = asyncio.run(load_progress(["python"], timeout=0.01))
    return len(result) == 0
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
    {
      id: "python-tooling",
      title: "Testing & Tooling",
      duration: "22 min",
      difficulty: "challenge",
      overview:
        "Wrap up by building lightweight reports, structuring results, and preparing for automation or CI.",
      learningObjectives: [
        "Model test results with tuples and lists",
        "Calculate pass/fail counts programmatically",
        "Return human-friendly summaries ready for CLI output",
      ],
      reading: [
        {
          label: "Introduction to pytest",
          url: "https://docs.pytest.org/en/stable/how-to/usage.html",
        },
        {
          label: "Formatting strings with textwrap",
          url: "https://docs.python.org/3/library/textwrap.html",
        },
      ],
      codeConcepts: ["sum", "list comprehension", "join"],
      exercise: {
        id: "exercise-tooling",
        title: "Summarise Test Runs",
        prompt:
          "Implement `generate_status_report(results)` where `results` is a sequence of `(suite_name, checks)` tuples. Each `checks` iterable contains booleans. Return a multi-line string reporting pass counts per suite and overall success ratio.",
        starterCode: `from typing import Iterable, Sequence, Tuple


def generate_status_report(results: Sequence[Tuple[str, Iterable[bool]]]) -> str:
    """Create a human-readable report summarising checks."""
    # TODO: calculate pass / total counts per suite and overall ratios
    ...
`,
        hints: [
          "Convert `checks` to a list once so you can reuse length and sums.",
          "Track total passed/total overall to report a final line.",
        ],
        tests: [
          {
            id: "suite-summary",
            description: "Produces per-suite summaries and totals.",
            assertion: `
def __test__():
    report = generate_status_report([
        ("auth", [True, False, True]),
        ("payments", (True, True))
    ])
    lines = report.splitlines()
    return (
        lines[0].startswith("auth: 2/3")
        and lines[1].startswith("payments: 2/2")
        and lines[-1].startswith("Overall: 4/5")
    )
__test__()
`,
            expected: "True",
          },
        ],
      },
    },
  ],
  capstone: {
    id: "capstone-python-automation",
    title: "Automation Toolkit",
    summary:
      "Build a personal automation toolkit that synchronises learning notes, summarises study sessions, and publishes a weekly briefing. The project combines dataclasses, asyncio, and typed contracts.",
    deliverables: [
      "Command-line interface with progress visualisation",
      "Async pipeline that pulls notes, enriches metadata, and generates summaries",
      "Typed formatter registry feeding a Markdown or Notion export",
    ],
    checkpoints: [
      "Dataclass models wired with persistence layer",
      "Async ingestion pipeline with caching and retries",
      "End-to-end demo script and README walkthrough",
    ],
  },
};
