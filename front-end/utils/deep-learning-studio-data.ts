export type DlExerciseTest = {
  id: string;
  description: string;
  assertion: string;
  expected?: string;
};

export type DlExercise = {
  id: string;
  title: string;
  prompt: string;
  starterCode: string;
  hints: string[];
  tests: DlExerciseTest[];
};

export type DlModule = {
  id: string;
  title: string;
  duration: string;
  difficulty: "core" | "challenge" | "lab";
  overview: string;
  learningObjectives: string[];
  reading: { label: string; url: string }[];
  codeConcepts: string[];
  exercise: DlExercise;
};

export type DlCapstone = {
  id: string;
  title: string;
  summary: string;
  deliverables: string[];
  checkpoints: string[];
};

export type DeepLearningCourse = {
  courseId: string;
  title: string;
  hero: {
    headline: string;
    kicker: string;
    description: string;
    progressPercent: number;
  };
  modules: DlModule[];
  capstone: DlCapstone;
};

const code = (snippet: string) => snippet.trim();
const assertion = (snippet: string) => `\n${snippet.trim()}\n`;

export const deepLearningStudioContent: DeepLearningCourse = {
  courseId: "deep-learning",
  title: "Deep Learning Studio",
  hero: {
    headline: "Deep Learning Studio",
    kicker: "Advanced · Neural Networks",
    description:
      "Design, optimise, and deploy neural networks that ship. Each module builds on the previous, taking you from tensor reasoning to diffusion-era techniques with hands-on, production-grade workflows.",
    progressPercent: 44,
  },
  modules: [
    {
      id: "dl-tensor-shapes",
      title: "Tensor Semantics & Shape Reasoning",
      duration: "18 min",
      difficulty: "core",
      overview:
        "Master how tensors compose. Diagnose shape mismatches before they explode mid-train, and reason about broadcasting while refactoring architectures.",
      learningObjectives: [
        "Infer tensor shapes from nested Python structures",
        "Validate consistent dimensionality across axes",
        "Raise actionable errors when tensors are ragged",
      ],
      reading: [
        {
          label: "Deep Learning Book – Notation",
          url: "https://www.deeplearningbook.org/contents/notation.html",
        },
      ],
      codeConcepts: ["recursion", "tuples", "validation"],
      exercise: {
        id: "exercise-tensor-shapes",
        title: "Infer Tensor Shape",
        prompt:
          "Implement infer_shape(tensor) returning a tuple of dimension lengths. Nested lists represent perfectly rectangular tensors; raise ValueError for ragged inputs.",
        starterCode: code(`
from typing import Any, Tuple


def infer_shape(tensor: Any) -> Tuple[int, ...]:
    """Return tensor shape from nested Python lists."""
    # TODO: inspect elements recursively, validate consistent lengths
    ...
`),
        hints: [
          "Treat non-lists as scalars with empty shape ().",
          "Length of current list becomes the first dim; recurse into the first element for the rest.",
          "Ensure every element shares the same shape; raise ValueError when mismatched.",
        ],
        tests: [
          {
            id: "matrix-shape",
            description: "Returns (2, 3) for a 2x3 tensor.",
            assertion: assertion(`
def __test__():
    tensor = [[1, 2, 3], [4, 5, 6]]
    return infer_shape(tensor) == (2, 3)
__test__()
`),
            expected: "True",
          },
          {
            id: "ragged",
            description: "Raises ValueError when rows have different lengths.",
            assertion: assertion(`
def __test__():
    try:
        infer_shape([[1, 2], [3]])
    except ValueError as exc:
        return "ragged" in str(exc).lower()
    return False
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-data-loader",
      title: "Efficient Mini-batching",
      duration: "20 min",
      difficulty: "core",
      overview:
        "Create deterministic dataloaders that honour shuffling, batch sizes, and drop-last semantics so GPU pipelines stay saturated.",
      learningObjectives: [
        "Chunk sequences into fixed-size minibatches",
        "Support optional drop-last semantics",
        "Return copies of data to prevent accidental mutation",
      ],
      reading: [
        {
          label: "PyTorch Data Loading",
          url: "https://pytorch.org/docs/stable/data.html",
        },
      ],
      codeConcepts: ["generators", "type variables", "control flow"],
      exercise: {
        id: "exercise-batch-loader",
        title: "Build a Batch Iterator",
        prompt:
          "Implement iterate_batches(data, batch_size, drop_last=False) yielding lists of elements. Ensure the last partial batch is included unless drop_last is True.",
        starterCode: code(`
from typing import Iterable, Iterator, List, Sequence, TypeVar

T = TypeVar("T")


def iterate_batches(data: Sequence[T], batch_size: int, drop_last: bool = False) -> Iterator[List[T]]:
    """Yield deterministic mini-batches from a sequence."""
    # TODO: step through the sequence and yield slices of size batch_size
    ...
`),
        hints: [
          "Iterate over start indices: range(0, len(data), batch_size).",
          "Slice the sequence to create a new list for each batch.",
          "Skip yielding the tail batch when drop_last is True and it's shorter than batch_size.",
        ],
        tests: [
          {
            id: "basic-batches",
            description: "Yields batches with final partial batch kept.",
            assertion: assertion(`
def __test__():
    batches = list(iterate_batches(list(range(7)), 3))
    return batches == [[0, 1, 2], [3, 4, 5], [6]]
__test__()
`),
            expected: "True",
          },
          {
            id: "drop-last",
            description: "Omits final incomplete batch when drop_last is True.",
            assertion: assertion(`
def __test__():
    batches = list(iterate_batches([1, 2, 3, 4, 5], 2, drop_last=True))
    return batches == [[1, 2], [3, 4]]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-forward-pass",
      title: "Designing Dense Layers",
      duration: "19 min",
      difficulty: "core",
      overview:
        "Implement forward passes that remain numerically stable. Understand how weight matrices and biases interact with activation design.",
      learningObjectives: [
        "Multiply weight matrices with activation vectors",
        "Apply bias terms per output unit",
        "Surface meaningful errors when shapes misalign",
      ],
      reading: [
        {
          label: "CS231n – Backpropagation",
          url: "http://cs231n.stanford.edu/lectures/2017/cs231n_2017_lecture4.pdf",
        },
      ],
      codeConcepts: ["matrix multiplication", "list comprehensions", "validation"],
      exercise: {
        id: "exercise-dense-forward",
        title: "Compute Dense Layer Output",
        prompt:
          "Implement dense_forward(inputs, weights, bias) returning the output vector. weights is an [out_dim x in_dim] matrix. Raise ValueError if dimensions conflict.",
        starterCode: code(`
from typing import Iterable, List


def dense_forward(inputs: Iterable[float], weights: Iterable[Iterable[float]], bias: Iterable[float]) -> List[float]:
    """Return y = Wx + b for a dense layer."""
    # TODO: validate dimensions and compute the affine transform
    ...
`),
        hints: [
          "Convert iterables to lists so you can reuse lengths.",
          "Check that every weight row matches the input length and that bias matches out_dim.",
          "Use sum(i * w for i, w in zip(inputs, row)) + bias[idx].",
        ],
        tests: [
          {
            id: "forward",
            description: "Produces correct affine output.",
            assertion: assertion(`
def __test__():
    y = dense_forward([1.0, -1.0], [[0.5, 0.5], [1.5, -0.5]], [0.1, -0.2])
    return [round(v, 2) for v in y] == [0.1, 1.2]
__test__()
`),
            expected: "True",
          },
          {
            id: "shape-error",
            description: "Raises when bias size mismatches output units.",
            assertion: assertion(`
def __test__():
    try:
        dense_forward([1.0, 2.0], [[1.0, 1.0]], [0.5, 0.2])
    except ValueError as exc:
        return "bias" in str(exc).lower()
    return False
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-losses",
      title: "Loss Functions & Calibration",
      duration: "21 min",
      difficulty: "core",
      overview:
        "Stabilise softmax outputs, compute cross-entropy precisely, and surface interpretable confidence scores.",
      learningObjectives: [
        "Apply the log-sum-exp trick for numerical stability",
        "Return both loss and calibrated probabilities",
        "Guard against invalid class targets",
      ],
      reading: [
        {
          label: "Stanford CS231n – Softmax",
          url: "https://cs231n.github.io/linear-classify/#softmax",
        },
      ],
      codeConcepts: ["math", "softmax", "error handling"],
      exercise: {
        id: "exercise-cross-entropy",
        title: "Stable Cross Entropy",
        prompt:
          "Implement categorical_cross_entropy(logits, target) returning (loss, probabilities). Use softmax with log-sum-exp for stability and raise ValueError on invalid target indices.",
        starterCode: code(`
from math import exp, log
from typing import Iterable, List, Tuple


def categorical_cross_entropy(logits: Iterable[float], target: int) -> Tuple[float, List[float]]:
    """Return cross-entropy loss and calibrated probabilities."""
    # TODO: stabilise logits, compute probabilities, then loss
    ...
`),
        hints: [
          "Convert logits to a list so they can be reused.",
          "Subtract max logit before exponentiating to avoid overflow.",
          "Loss is -log(probabilities[target]).",
        ],
        tests: [
          {
            id: "loss-probabilities",
            description: "Returns expected loss and probabilities.",
            assertion: assertion(`
def __test__():
    loss, probs = categorical_cross_entropy([2.0, 1.0, 0.1], 0)
    return round(loss, 4) == 0.417 and [round(p, 4) for p in probs] == [0.659, 0.2424, 0.0986]
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid-target",
            description: "Raises ValueError for targets outside class range.",
            assertion: assertion(`
def __test__():
    try:
        categorical_cross_entropy([0.0, 1.0], 5)
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
      id: "dl-regularisation",
      title: "Regularisation & Gradient Control",
      duration: "19 min",
      difficulty: "core",
      overview:
        "Keep training stable by constraining exploding gradients and returning reusable structures for optimiser hooks.",
      learningObjectives: [
        "Compute the global L2 norm across parameter groups",
        "Scale gradients when the global norm exceeds a threshold",
        "Return new gradient containers without mutating inputs",
      ],
      reading: [
        {
          label: "Gradient Clipping – Practical Deep Learning",
          url: "https://pytorch.org/docs/stable/generated/torch.nn.utils.clip_grad_norm_.html",
        },
      ],
      codeConcepts: ["math.sqrt", "dict comprehensions", "immutability"],
      exercise: {
        id: "exercise-clip-gradients",
        title: "Implement Gradient Clipping",
        prompt:
          "Implement clip_gradients(gradients, max_norm) returning a new dict with gradients scaled so the global norm stays below max_norm.",
        starterCode: code(`
from math import sqrt
from typing import Dict, Iterable, List


def clip_gradients(gradients: Dict[str, Iterable[float]], max_norm: float) -> Dict[str, List[float]]:
    """Return gradients scaled to respect the global max_norm."""
    # TODO: compute global norm and scale when necessary
    ...
`),
        hints: [
          "Global norm is sqrt(sum(g^2)).",
          "If norm is zero or <= max_norm, return copies of the original lists.",
          "Otherwise multiply every gradient value by max_norm / norm.",
        ],
        tests: [
          {
            id: "no-scaling",
            description: "Leaves gradients unchanged when already below the cap.",
            assertion: assertion(`
def __test__():
    clipped = clip_gradients({"w": [0.1, -0.2], "b": [0.05]}, 1.0)
    return clipped == {"w": [0.1, -0.2], "b": [0.05]}
__test__()
`),
            expected: "True",
          },
          {
            id: "scales",
            description: "Scales gradients when norm exceeds max_norm.",
            assertion: assertion(`
def __test__():
    clipped = clip_gradients({"w": [3.0, 4.0]}, 5.0)
    return round((clipped["w"][0] ** 2 + clipped["w"][1] ** 2) ** 0.5, 5) <= 5.0
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-convolutions",
      title: "Spatial Feature Extraction",
      duration: "22 min",
      difficulty: "challenge",
      overview:
        "Implement convolutional feature extractors from scratch with stride and padding controls ready for experimentation.",
      learningObjectives: [
        "Apply zero padding to spatial inputs",
        "Slide kernels to compute feature maps",
        "Support configurable stride for downsampling",
      ],
      reading: [
        {
          label: "Convolution Arithmetic",
          url: "https://arxiv.org/abs/1603.07285",
        },
      ],
      codeConcepts: ["nested loops", "padding", "stride"],
      exercise: {
        id: "exercise-conv2d",
        title: "Single-Channel Convolution",
        prompt:
          "Implement conv2d_single_channel(image, kernel, stride=1, padding=0) producing a feature map after applying zero padding.",
        starterCode: code(`
from typing import List


def conv2d_single_channel(image: List[List[float]], kernel: List[List[float]], stride: int = 1, padding: int = 0) -> List[List[float]]:
    """Convolve a single-channel image with a kernel."""
    # TODO: pad the image, then slide kernel using the provided stride
    ...
`),
        hints: [
          "Create a padded grid with extra zeros around the image.",
          "Output height = (H + 2 * padding - kH) // stride + 1.",
          "Nested loops over output positions multiply-add kernel and window values.",
        ],
        tests: [
          {
            id: "basic-convolution",
            description: "Computes valid convolution with stride 1, no padding.",
            assertion: assertion(`
def __test__():
    out = conv2d_single_channel(
        [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
        [[1, 0], [0, -1]]
    )
    return out == [[-4, -4], [-4, -4]]
__test__()
`),
            expected: "True",
          },
          {
            id: "padding-stride",
            description: "Respects padding and stride arguments.",
            assertion: assertion(`
def __test__():
    out = conv2d_single_channel([[1, 2], [3, 4]], [[1]], stride=2, padding=1)
    return out == [[0, 2], [3, 4]]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-attention",
      title: "Attention Mechanics",
      duration: "23 min",
      difficulty: "challenge",
      overview:
        "Implement scaled dot-product attention with masking so you can introspect weights before moving to multi-head variants.",
      learningObjectives: [
        "Compute attention logits with scaling",
        "Apply softmax with masking for causal flows",
        "Return both weights and context vectors",
      ],
      reading: [
        {
          label: "Attention Is All You Need",
          url: "https://arxiv.org/abs/1706.03762",
        },
      ],
      codeConcepts: ["softmax", "masking", "list operations"],
      exercise: {
        id: "exercise-attention",
        title: "Scaled Dot-Product Attention",
        prompt:
          "Implement scaled_dot_attention(query, keys, values, mask=None) returning (weights, context). mask is an optional iterable of booleans where False suppresses a position.",
        starterCode: code(`
from math import exp, sqrt
from typing import Iterable, List, Optional, Sequence, Tuple


def _softmax(logits: Sequence[float]) -> List[float]:
    max_logit = max(logits)
    exps = [exp(x - max_logit) for x in logits]
    total = sum(exps)
    return [x / total for x in exps]


def scaled_dot_attention(
    query: Sequence[float],
    keys: Sequence[Sequence[float]],
    values: Sequence[Sequence[float]],
    mask: Optional[Iterable[bool]] = None,
) -> Tuple[List[float], List[float]]:
    """Return attention weights and context vector."""
    # TODO: compute scaled dot products, apply mask, then softmax and weighted sum
    ...
`),
        hints: [
          "Scale dot products by sqrt(depth) where depth = len(query).",
          "When mask[i] is False, use a large negative number to suppress that logit.",
          "Context vector dimension equals len(values[0]); weighted sum of values using attention weights.",
        ],
        tests: [
          {
            id: "attention-weights",
            description: "Produces expected weights on simple inputs.",
            assertion: assertion(`
def __test__():
    weights, context = scaled_dot_attention(
        [1.0, 0.0],
        [[1.0, 0.0], [0.0, 1.0]],
        [[1.0, 1.0], [0.0, 2.0]]
    )
    return [round(w, 3) for w in weights] == [0.67, 0.33] and [round(c, 3) for c in context] == [0.67, 1.33]
__test__()
`),
            expected: "True",
          },
          {
            id: "masked",
            description: "Honours mask by zeroing out positions.",
            assertion: assertion(`
def __test__():
    weights, _ = scaled_dot_attention([0.0, 1.0], [[1.0, 1.0], [1.0, -1.0]], [[1.0], [2.0]], mask=[True, False])
    return [round(w, 3) for w in weights] == [1.0, 0.0]
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-optimisation",
      title: "Scheduler Design & Warmups",
      duration: "20 min",
      difficulty: "challenge",
      overview:
        "Blend linear warmups with cosine decay to keep training stable through long horizons without external libraries.",
      learningObjectives: [
        "Implement linear warmup phases",
        "Apply cosine decay after warmup completion",
        "Clamp edge cases for final learning rate",
      ],
      reading: [
        {
          label: "SGDR: Stochastic Gradient Descent with Warm Restarts",
          url: "https://arxiv.org/abs/1608.03983",
        },
      ],
      codeConcepts: ["math.cos", "clamping", "piecewise functions"],
      exercise: {
        id: "exercise-cosine-schedule",
        title: "Cosine Warmup Scheduler",
        prompt:
          "Implement cosine_warmup_lr(step, total_steps, base_lr, warmup_steps=0) returning the learning rate with linear warmup followed by cosine decay to zero.",
        starterCode: code(`
from math import cos, pi


def cosine_warmup_lr(step: int, total_steps: int, base_lr: float, warmup_steps: int = 0) -> float:
    """Return LR for a given step using linear warmup then cosine decay."""
    # TODO: handle warmup region then apply cosine decay
    ...
`),
        hints: [
          "During warmup, scale linearly: base_lr * (step + 1) / warmup_steps.",
          "After warmup, decay with 0.5 * base_lr * (1 + cos(pi * progress)).",
          "Clamp step to total_steps - 1 to avoid cosine returning negative durations.",
        ],
        tests: [
          {
            id: "warmup",
            description: "Increases linearly during warmup.",
            assertion: assertion(`
def __test__():
    return round(cosine_warmup_lr(1, 10, 0.001, warmup_steps=4), 6) == 0.0005
__test__()
`),
            expected: "True",
          },
          {
            id: "decay",
            description: "Decays toward zero after warmup.",
            assertion: assertion(`
def __test__():
    return 0.0 <= cosine_warmup_lr(9, 10, 0.01, warmup_steps=2) <= 0.005
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-training-systems",
      title: "Early Stopping Signals",
      duration: "17 min",
      difficulty: "lab",
      overview:
        "Implement early stopping logic that reacts to validation plateaus while remaining debuggable for experiment tracking.",
      learningObjectives: [
        "Track the best metric observed so far",
        "Count epochs without meaningful improvement",
        "Return boolean stop signals for trainers",
      ],
      reading: [
        {
          label: "Practical Tips for Early Stopping",
          url: "https://developers.google.com/machine-learning/crash-course/regularization-for-simplicity/loss",
        },
      ],
      codeConcepts: ["iteration", "state tracking", "floats"],
      exercise: {
        id: "exercise-early-stop",
        title: "Detect Validation Plateaus",
        prompt:
          "Implement should_stop(metric_history, patience, min_delta=0.0) returning True when the metric has not improved by at least min_delta across the last patience observations. Lower metric is better.",
        starterCode: code(`
from typing import Iterable


def should_stop(metric_history: Iterable[float], patience: int, min_delta: float = 0.0) -> bool:
    """Return True when training should stop early."""
    # TODO: iterate through history, track best value, and count stagnation
    ...
`),
        hints: [
          "Keep a running best initialised to +inf.",
          "Reset the stale counter when a new value improves best - min_delta.",
          "If stale counter reaches patience, return True.",
        ],
        tests: [
          {
            id: "continues",
            description: "Continues training when improvements happen within patience.",
            assertion: assertion(`
def __test__():
    return should_stop([0.5, 0.48, 0.47, 0.46], patience=2) is False
__test__()
`),
            expected: "True",
          },
          {
            id: "stops",
            description: "Triggers when no improvement within patience window.",
            assertion: assertion(`
def __test__():
    return should_stop([0.4, 0.39, 0.39, 0.41, 0.42], patience=2, min_delta=0.0) is True
__test__()
`),
            expected: "True",
          },
        ],
      },
    },
    {
      id: "dl-diffusion",
      title: "Diffusion Sampling Fundamentals",
      duration: "21 min",
      difficulty: "lab",
      overview:
        "Translate denoising diffusion steps into lightweight Python so you can reason about schedulers before wiring real models.",
      learningObjectives: [
        "Simulate reverse diffusion with beta schedules",
        "Combine noisy latents with model predictions",
        "Return denoised samples ready for the next step",
      ],
      reading: [
        {
          label: "DDPM Illustrated Guide",
          url: "https://theaisummer.com/diffusion-models/",
        },
      ],
      codeConcepts: ["elementwise ops", "math.sqrt", "validation"],
      exercise: {
        id: "exercise-denoise",
        title: "Single Step Denoising",
        prompt:
          "Implement denoise_step(x_t, beta, predicted_noise) returning the next latent using the simplified DDPM update: (x_t - beta * predicted_noise) / sqrt(1 - beta).",
        starterCode: code(`
from math import sqrt
from typing import Iterable, List


def denoise_step(x_t: Iterable[float], beta: float, predicted_noise: Iterable[float]) -> List[float]:
    """Return x_{t-1} using a simplified DDPM update."""
    # TODO: validate lengths and compute element-wise update
    ...
`),
        hints: [
          "Convert iterables to lists so you can zip multiple times.",
          "Ensure beta is between 0 and 1 (exclusive).",
          "Scale each component with the same denominator sqrt(1 - beta).",
        ],
        tests: [
          {
            id: "denoise",
            description: "Applies denoising formula element-wise.",
            assertion: assertion(`
def __test__():
    result = denoise_step([0.5, -0.2], 0.1, [0.05, -0.1])
    return [round(v, 4) for v in result] == [0.5218, -0.2003]
__test__()
`),
            expected: "True",
          },
          {
            id: "invalid-beta",
            description: "Rejects invalid beta values.",
            assertion: assertion(`
def __test__():
    try:
        denoise_step([0.1], 1.5, [0.0])
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
  ],
  capstone: {
    id: "dl-capstone",
    title: "Production-Ready Vision & GenAI Pipeline",
    summary:
      "Design an end-to-end deep learning system: ingest data, train convolutional backbones with attention heads, schedule experiments, and ship a monitored diffusion deployment.",
    deliverables: [
      "Tensor data contract with augmentation recipes",
      "Training harness supporting schedulers and early stopping",
      "Diffusion inference notebook with sampling diagnostics",
    ],
    checkpoints: [
      "GPU-ready dataloader with caching",
      "Experiment dashboard summarising attention weights",
      "Release checklist with drift triggers and rollback plan",
    ],
  },
};
