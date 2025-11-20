<script setup lang="ts">
import { computed, ref } from "vue";
import { useStudentAuth } from "~/composables/use-auth";

definePageMeta({
  layout: "default",
});

const pageTitle = "Admin Intelligence Center – Zapminds Academy";

useSeoMeta({
  title: pageTitle,
  description:
    "Ops-grade view into Zapminds Academy engagement patterns, learner funnels, and course performance.",
});

type Timeframe = "24h" | "7d" | "30d";

interface TimeframeOption {
  id: Timeframe;
  label: string;
  description: string;
}

const timeframeOptions: TimeframeOption[] = [
  {
    id: "24h",
    label: "Last 24 hours",
    description: "Live pulse with incident notes",
  },
  {
    id: "7d",
    label: "Last 7 days",
    description: "Default sprint window",
  },
  {
    id: "30d",
    label: "Last 30 days",
    description: "Rolling cohort view",
  },
];

const selectedTimeframe = ref<Timeframe>("7d");

const selectTimeframe = (id: Timeframe) => {
  selectedTimeframe.value = id;
};

interface KpiCard {
  id: string;
  label: string;
  value: string;
  helper: string;
  delta: number;
  context: string;
}

const kpisByTimeframe: Record<Timeframe, KpiCard[]> = {
  "24h": [
    {
      id: "active-learners",
      label: "Active learners",
      value: "428",
      helper: "Unique logins",
      delta: 5.4,
      context: "Lunch + midnight pods drove usage.",
    },
    {
      id: "modules-cleared",
      label: "Modules cleared",
      value: "1,126",
      helper: "Modules completed",
      delta: 7.2,
      context: "Automation labs replays trending.",
    },
    {
      id: "session-length",
      label: "Avg session length",
      value: "48m",
      helper: "Median dwell time",
      delta: 3.1,
      context: "Focus loops kept dwell above target.",
    },
    {
      id: "xp-minted",
      label: "XP minted",
      value: "92k",
      helper: "XP granted",
      delta: 6.8,
      context: "Code review auto-mints 41% of XP.",
    },
    {
      id: "streak-health",
      label: "Streak health",
      value: "63%",
      helper: "Streak claims",
      delta: -2.4,
      context: "Weekend dip — queue reminders.",
    },
  ],
  "7d": [
    {
      id: "active-learners",
      label: "Active learners",
      value: "1,362",
      helper: "Unique sign-ins",
      delta: 8.9,
      context: "Cohort 19 standups lifted volume.",
    },
    {
      id: "modules-cleared",
      label: "Modules cleared",
      value: "6,842",
      helper: "Modules completed",
      delta: 9.6,
      context: "Python + agentic sprints shipped.",
    },
    {
      id: "session-length",
      label: "Avg session length",
      value: "51m",
      helper: "Median dwell time",
      delta: 2.7,
      context: "Workflow challenges held attention.",
    },
    {
      id: "xp-minted",
      label: "XP minted",
      value: "612k",
      helper: "XP granted",
      delta: 7.5,
      context: "Mentor reviews minted 38% of XP.",
    },
    {
      id: "streak-health",
      label: "Streak health",
      value: "71%",
      helper: "Streak claims",
      delta: 1.8,
      context: "Daily SMS nudges paid off.",
    },
  ],
  "30d": [
    {
      id: "active-learners",
      label: "Active learners",
      value: "4,988",
      helper: "Unique sign-ins",
      delta: 10.1,
      context: "Team spaces rollout brought squads in.",
    },
    {
      id: "modules-cleared",
      label: "Modules cleared",
      value: "27,416",
      helper: "Modules completed",
      delta: 6.3,
      context: "Capstone approvals bundled for August.",
    },
    {
      id: "session-length",
      label: "Avg session length",
      value: "49m",
      helper: "Median dwell time",
      delta: 1.1,
      context: "Steady despite mid-month holidays.",
    },
    {
      id: "xp-minted",
      label: "XP minted",
      value: "2.4M",
      helper: "XP granted",
      delta: 5.2,
      context: "Evaluation quests minted weekly spikes.",
    },
    {
      id: "streak-health",
      label: "Streak health",
      value: "68%",
      helper: "Streak claims",
      delta: -1.2,
      context: "Need automation for dormants.",
    },
  ],
};

const activeKpis = computed(() => kpisByTimeframe[selectedTimeframe.value]);

const selectedTimeframeMeta = computed(() =>
  timeframeOptions.find((option) => option.id === selectedTimeframe.value)
);

const timeframeLabel = computed(
  () => selectedTimeframeMeta.value?.label ?? "Last 7 days"
);
const timeframeDescription = computed(
  () => selectedTimeframeMeta.value?.description ?? ""
);

const { profile } = useStudentAuth();
const operatorName = computed(() => profile.value.name ?? "Ops lead");

interface TrendCard {
  id: string;
  label: string;
  values: number[];
  unit: string;
  change: number;
  annotation: string;
  target?: number;
}

const trendCards: TrendCard[] = [
  {
    id: "engagement-trend",
    label: "Learning minutes / day",
    values: [48, 52, 55, 58, 62, 71, 69, 74],
    unit: "k mins",
    change: 12.4,
    annotation: "Uptick from automation lab release",
    target: 65,
  },
  {
    id: "retention-trend",
    label: "7-day retention",
    values: [68, 69, 69, 70, 72, 74, 73, 75],
    unit: "%",
    change: 3.1,
    annotation: "Cohort 18 pacing ahead of avg",
    target: 74,
  },
  {
    id: "xp-trend",
    label: "Avg XP / learner",
    values: [118, 121, 126, 131, 129, 137, 140, 144],
    unit: "XP",
    change: 6.8,
    annotation: "Code review automation driving XP",
    target: 135,
  },
];

const sparklinePoints = (values: number[]) => {
  if (!values.length) return "";
  const width = 100;
  const height = 60;
  const step = values.length === 1 ? width : width / (values.length - 1);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = Math.min(width, index * step);
      const normalized = (value - min) / range;
      const y = height - normalized * height;
      return `${x},${y}`;
    })
    .join(" ");
};

const sparklineTarget = (values: number[], target?: number) => {
  if (!values.length || typeof target === "undefined") {
    return 0;
  }

  const height = 60;
  const max = Math.max(...values, target);
  const min = Math.min(...values, target);
  const range = max - min || 1;
  const normalized = (target - min) / range;
  return height - normalized * height;
};

const lastValue = (values: number[]) => values[values.length - 1] ?? 0;

interface SegmentInsight {
  id: string;
  label: string;
  population: number;
  share: number;
  change: number;
  note: string;
}

const segmentInsights: SegmentInsight[] = [
  {
    id: "new-cohorts",
    label: "New cohorts",
    population: 287,
    share: 32,
    change: 11.4,
    note: "Orientation automation converted 82% of signups.",
  },
  {
    id: "returning-builders",
    label: "Returning builders",
    population: 512,
    share: 57,
    change: 4.1,
    note: "Avg 3.2 sessions / user with 142 min dwell time.",
  },
  {
    id: "reengaged",
    label: "Re-engaged accounts",
    population: 98,
    share: 11,
    change: -6.2,
    note: "Need concierge nudges for dormant pros.",
  },
];

interface FunnelStage {
  id: string;
  label: string;
  count: number;
  conversion: number;
  helper: string;
}

const funnelStages: FunnelStage[] = [
  {
    id: "visitors",
    label: "Visitors",
    count: 4820,
    conversion: 1,
    helper: "Landing traffic",
  },
  {
    id: "signups",
    label: "Sign-ups",
    count: 742,
    conversion: 0.154,
    helper: "Trials started",
  },
  {
    id: "activated",
    label: "Activated learners",
    count: 536,
    conversion: 0.722,
    helper: "Completed onboarding",
  },
  {
    id: "paying",
    label: "Paying teams",
    count: 202,
    conversion: 0.377,
    helper: "Seat plans",
  },
  {
    id: "power-users",
    label: "Power users",
    count: 148,
    conversion: 0.732,
    helper: "150+ XP / week",
  },
];

const maxFunnelCount = computed(() =>
  Math.max(...funnelStages.map((stage) => stage.count))
);

const heatmapBuckets = [
  "6-9a",
  "9a-12p",
  "12-3p",
  "3-6p",
  "6-9p",
  "9p-1a",
] as const;

interface HeatmapRow {
  day: string;
  values: number[];
  highlight: string;
}

const usageHeatmap: HeatmapRow[] = [
  {
    day: "Mon",
    values: [20, 58, 46, 42, 28, 12],
    highlight: "Sprint kickoff traffic",
  },
  {
    day: "Tue",
    values: [24, 62, 44, 36, 26, 14],
    highlight: "Ops review mid-morning",
  },
  {
    day: "Wed",
    values: [18, 55, 49, 38, 31, 18],
    highlight: "Most code reviews shipped",
  },
  {
    day: "Thu",
    values: [22, 66, 52, 41, 27, 12],
    highlight: "Capstone labs run",
  },
  {
    day: "Fri",
    values: [30, 71, 58, 46, 38, 20],
    highlight: "Automation lab launch",
  },
  {
    day: "Sat",
    values: [14, 32, 41, 36, 24, 16],
    highlight: "Weekend grind sessions",
  },
  {
    day: "Sun",
    values: [12, 24, 36, 30, 22, 14],
    highlight: "Prep for Monday sprint",
  },
];

interface ActionItem {
  id: string;
  label: string;
  share: number;
  change: number;
  note: string;
}

const topActions: ActionItem[] = [
  {
    id: "code-reviews",
    label: "AI code reviews",
    share: 28,
    change: 9.2,
    note: "Became default workflow for Cohort 18.",
  },
  {
    id: "course-replays",
    label: "Course replays",
    share: 21,
    change: 4.3,
    note: "Primarily used on weekends.",
  },
  {
    id: "xp-rush",
    label: "XP rush quests",
    share: 17,
    change: -3.6,
    note: "Need fresh challenge inventory.",
  },
  {
    id: "team-dashboards",
    label: "Team dashboards",
    share: 11,
    change: 6.1,
    note: "Adopted by enterprise pilot.",
  },
];

interface CoursePulse {
  id: string;
  title: string;
  enrollment: number;
  completionRate: number;
  completionChange: number;
  satisfaction: number;
  xpShare: number;
  watchPoint: string;
}

const coursePulse: CoursePulse[] = [
  {
    id: "agentic",
    title: "Agentic AI Systems",
    enrollment: 482,
    completionRate: 76,
    completionChange: 4.2,
    satisfaction: 4.8,
    xpShare: 34,
    watchPoint: "Drop-off around research ops sprint.",
  },
  {
    id: "ml-systems",
    title: "ML Systems Reliability",
    enrollment: 368,
    completionRate: 68,
    completionChange: -2.1,
    satisfaction: 4.5,
    xpShare: 27,
    watchPoint: "Latency lab rewrite in progress.",
  },
  {
    id: "python-automation",
    title: "Python Automation Program",
    enrollment: 552,
    completionRate: 81,
    completionChange: 3.5,
    satisfaction: 4.9,
    xpShare: 29,
    watchPoint: "Scale mentor hours for August sprint.",
  },
];

interface CourseMilestone {
  id: string;
  title: string;
  owner: string;
  status: string;
  eta: string;
  impact: "High" | "Medium" | "Low";
}

const courseMilestones: CourseMilestone[] = [
  {
    id: "genai-support",
    title: "GenAI for Support Engineers",
    owner: "Curriculum",
    status: "Beta pilot ready",
    eta: "Aug 12",
    impact: "High",
  },
  {
    id: "agents-lab",
    title: "Autonomous Agents Ops Lab",
    owner: "R&D Studio",
    status: "Design freeze",
    eta: "Aug 26",
    impact: "Medium",
  },
  {
    id: "mlops-refresh",
    title: "MLOps Reliability Refresh",
    owner: "Content Studio",
    status: "QA + localization",
    eta: "Jul 30",
    impact: "High",
  },
];

interface AdminTodo {
  id: string;
  title: string;
  detail: string;
  owner: string;
  due: string;
  status: "Blocked" | "In progress" | "Review";
  impact: "High" | "Medium" | "Low";
}

const adminTodos: AdminTodo[] = [
  {
    id: "audit-seats",
    title: "Audit enterprise seat usage",
    detail: "Match Zapminds Enterprise seats with learners active in the last 7d.",
    owner: "Learning Ops",
    due: "Today",
    status: "In progress",
    impact: "High",
  },
  {
    id: "retention-experiment",
    title: "Ship churn rescue experiment",
    detail: "Launch concierge nudges to dormant Zapminds engineers.",
    owner: "Lifecycle",
    due: "Tomorrow",
    status: "Blocked",
    impact: "High",
  },
  {
    id: "mentor-staffing",
    title: "Staff mentor rotations",
    detail: "Fill 14 mentor slots for August AI sprint.",
    owner: "Student Success",
    due: "Friday",
    status: "Review",
    impact: "Medium",
  },
];

type RiskSeverity = "low" | "medium" | "high";

interface RiskAlert {
  id: string;
  title: string;
  severity: RiskSeverity;
  indicator: string;
  detail: string;
  owner: string;
}

const riskAlerts: RiskAlert[] = [
  {
    id: "support-sla",
    title: "Support SLA < 2h",
    severity: "medium",
    indicator: "92%",
    detail: "Need 95%+ to protect mentor satisfaction + NPS.",
    owner: "Support",
  },
  {
    id: "infra-costs",
    title: "GPU lab utilization",
    severity: "high",
    indicator: "78%",
    detail: "Ops target <70% to keep lab queues under 5 min.",
    owner: "Infra",
  },
  {
    id: "cohort-drop",
    title: "Cohort 17 drop-off",
    severity: "low",
    indicator: "-3.2%",
    detail: "Within guardrails but trending downward.",
    owner: "Programs",
  },
];

interface ManagementBrief {
  id: string;
  label: string;
  value: string;
  note: string;
}

const managementBrief: ManagementBrief[] = [
  {
    id: "streaks",
    label: "Streak keepers",
    value: "71%",
    note: "Need >70% to keep the XP multiplier unlocked.",
  },
  {
    id: "minutes",
    label: "Avg minutes / learner",
    value: "142m",
    note: "Matches the Zapminds automation sprint target.",
  },
  {
    id: "reviews",
    label: "Review loop SLA",
    value: "2.1h",
    note: "92% of submissions cleared inside the 2h promise.",
  },
];

const formatDelta = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  const absValue = Math.abs(value);
  const digits = absValue >= 10 ? 0 : 1;
  const formatted = absValue.toFixed(digits).replace(/\.0$/, "");
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatted}%`;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatConversion = (value: number) =>
  `${Math.round(value * 100)}% step-through`;

const getHeatColor = (value: number) => {
  const normalized = Math.min(1, Math.max(0, value / 80));
  const hue = 190 - normalized * 60;
  const alpha = 0.18 + normalized * 0.6;
  return `hsla(${hue}, 80%, 55%, ${alpha.toFixed(2)})`;
};

const statusToClass = (status: AdminTodo["status"]) =>
  status.toLowerCase().replace(/\s+/g, "-");

const impactToClass = (impact: AdminTodo["impact"] | CourseMilestone["impact"]) =>
  impact.toLowerCase();
</script>

<template>
  <section :class="$style.page">
    <div class="container">
      <header :class="$style.hero">
        <div :class="$style['hero-copy']">
          <p :class="$style.eyebrow">
            Admin control · {{ timeframeLabel }} · {{ timeframeDescription }}
          </p>
          <h1>Admin intelligence center</h1>
          <p>
            Monitor learner engagement, usage rhythms, and curriculum velocity across Zapminds Academy.
            {{ operatorName }} can steer experiments faster with this signal.
          </p>
          <div :class="$style['hero-operator']">
            <span>Operator</span>
            <strong>{{ operatorName }}</strong>
          </div>
        </div>

        <ul :class="$style['hero-brief']">
          <li v-for="item in managementBrief" :key="item.id">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.note }}</p>
          </li>
        </ul>
        <span :class="$style['hero-glow']"></span>
      </header>

      <div :class="$style['timeframe-switcher']">
        <button
          v-for="option in timeframeOptions"
          :key="option.id"
          type="button"
          :class="[
            $style['timeframe-switcher__button'],
            option.id === selectedTimeframe && $style['timeframe-switcher__button--active'],
          ]"
          @click="selectTimeframe(option.id)"
        >
          <span>{{ option.label }}</span>
          <small>{{ option.description }}</small>
        </button>
      </div>

      <section :class="$style['kpi-grid']">
        <article v-for="kpi in activeKpis" :key="kpi.id" :class="[$style.panel, $style['kpi-card']]">
          <header>
            <span>{{ kpi.label }}</span>
            <small>{{ kpi.helper }}</small>
          </header>
          <strong>{{ kpi.value }}</strong>
          <div
            :class="[
              $style['kpi-delta'],
              kpi.delta >= 0 ? $style['kpi-delta--up'] : $style['kpi-delta--down'],
            ]"
          >
            <span>{{ formatDelta(kpi.delta) }}</span>
            <small>{{ kpi.context }}</small>
          </div>
        </article>
      </section>

      <section :class="$style['grid-two-up']">
        <article :class="[$style.panel, $style.trends]">
          <header>
            <div>
              <h2>Engagement trajectory</h2>
              <p>Usage flow for {{ timeframeLabel }} window.</p>
            </div>
            <span :class="$style.badge">Ops view</span>
          </header>
          <div :class="$style['trend-grid']">
            <div v-for="trend in trendCards" :key="trend.id" :class="$style['trend-card']">
              <div :class="$style['trend-header']">
                <div>
                  <span>{{ trend.label }}</span>
                  <strong>{{ lastValue(trend.values) }} {{ trend.unit }}</strong>
                </div>
                <span
                  :class="[
                    $style['kpi-delta'],
                    trend.change >= 0 ? $style['kpi-delta--up'] : $style['kpi-delta--down'],
                  ]"
                >
                  {{ formatDelta(trend.change) }}
                </span>
              </div>
              <svg viewBox="0 0 100 60" preserveAspectRatio="none" :class="$style.sparkline">
                <polyline :points="sparklinePoints(trend.values)" />
                <line
                  v-if="typeof trend.target !== 'undefined'"
                  x1="0"
                  x2="100"
                  :y1="sparklineTarget(trend.values, trend.target)"
                  :y2="sparklineTarget(trend.values, trend.target)"
                />
              </svg>
              <p>{{ trend.annotation }}</p>
            </div>
          </div>
        </article>

        <article :class="[$style.panel, $style.segments]">
          <header>
            <h2>Segment health</h2>
            <p>Blend of new, returning, and reactivated learners.</p>
          </header>
          <ul>
            <li v-for="segment in segmentInsights" :key="segment.id">
              <div>
                <strong>{{ segment.label }}</strong>
                <span>{{ formatCount(segment.population) }} learners</span>
              </div>
              <div>
                <span>{{ segment.share }}% of actives</span>
                <span
                  :class="[
                    $style['kpi-delta'],
                    segment.change >= 0 ? $style['kpi-delta--up'] : $style['kpi-delta--down'],
                  ]"
                >
                  {{ formatDelta(segment.change) }}
                </span>
              </div>
              <p>{{ segment.note }}</p>
            </li>
          </ul>
        </article>
      </section>

      <section :class="$style['grid-two-up']">
        <article :class="[$style.panel, $style.funnel]">
          <header>
            <h2>Lifecycle funnel</h2>
            <p>Conversion path from visitor to power user.</p>
          </header>
          <ul>
            <li v-for="stage in funnelStages" :key="stage.id">
              <div>
                <strong>{{ stage.label }}</strong>
                <span>{{ formatCount(stage.count) }} people</span>
              </div>
              <div :class="$style['funnel-bar']">
                <span :style="{ '--progress': stage.count / maxFunnelCount }"></span>
              </div>
              <div>
                <span>{{ formatConversion(stage.conversion) }}</span>
                <small>{{ stage.helper }}</small>
              </div>
            </li>
          </ul>
        </article>

        <article :class="[$style.panel, $style.usage]">
          <header>
            <div>
              <h2>Usage rhythms</h2>
              <p>Hourly density (UTC).</p>
            </div>
            <span :class="$style.badge">Demand map</span>
          </header>

          <div :class="$style['heatmap-grid']">
            <div :class="$style['heatmap-grid__header']">
              <span></span>
              <span v-for="bucket in heatmapBuckets" :key="bucket">{{ bucket }}</span>
              <span>Notes</span>
            </div>
            <div v-for="row in usageHeatmap" :key="row.day" :class="$style['heatmap-row']">
              <span>{{ row.day }}</span>
              <div
                v-for="(value, index) in row.values"
                :key="`${row.day}-${index}`"
                :class="$style['heat-cell']"
                :style="{ backgroundColor: getHeatColor(value) }"
              >
                {{ value }}%
              </div>
              <span :class="$style['heat-note']">{{ row.highlight }}</span>
            </div>
          </div>

          <ul :class="$style['actions-list']">
            <li v-for="action in topActions" :key="action.id">
              <div>
                <strong>{{ action.label }}</strong>
                <p>{{ action.note }}</p>
              </div>
              <div>
                <span>{{ action.share }}% of sessions</span>
                <span
                  :class="[
                    $style['kpi-delta'],
                    action.change >= 0 ? $style['kpi-delta--up'] : $style['kpi-delta--down'],
                  ]"
                >
                  {{ formatDelta(action.change) }}
                </span>
              </div>
            </li>
          </ul>
        </article>
      </section>

      <section :class="$style['grid-two-up']">
        <article :class="[$style.panel, $style.courses]">
          <header>
            <h2>Course intelligence</h2>
            <p>Enrollment, completion, and XP contribution.</p>
          </header>
          <div :class="$style['course-grid']">
            <article v-for="course in coursePulse" :key="course.id" :class="$style['course-card']">
              <div>
                <h3>{{ course.title }}</h3>
                <p>{{ course.watchPoint }}</p>
              </div>
              <dl>
                <div>
                  <dt>Enrollment</dt>
                  <dd>{{ formatCount(course.enrollment) }}</dd>
                </div>
                <div>
                  <dt>XP share</dt>
                  <dd>{{ course.xpShare }}%</dd>
                </div>
                <div>
                  <dt>Satisfaction</dt>
                  <dd>{{ course.satisfaction.toFixed(1) }}/5</dd>
                </div>
              </dl>
              <div :class="$style['course-progress']">
                <div>
                  <span>Completion</span>
                  <strong>{{ course.completionRate }}%</strong>
                </div>
                <div>
                  <span :style="{ '--progress': course.completionRate / 100 }"></span>
                  <span
                    :class="[
                      $style['kpi-delta'],
                      course.completionChange >= 0
                        ? $style['kpi-delta--up']
                        : $style['kpi-delta--down'],
                    ]"
                  >
                    {{ formatDelta(course.completionChange) }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </article>

        <article :class="[$style.panel, $style.pipeline]">
          <header>
            <h2>Curriculum roadmap</h2>
            <p>Upcoming launches and refreshes.</p>
          </header>
          <ul>
            <li v-for="milestone in courseMilestones" :key="milestone.id">
              <div>
                <strong>{{ milestone.title }}</strong>
                <p>{{ milestone.status }}</p>
              </div>
              <div>
                <span>{{ milestone.owner }}</span>
                <span>{{ milestone.eta }}</span>
                <span
                  :class="[
                    $style['impact-tag'],
                    $style[`impact-tag--${impactToClass(milestone.impact)}`],
                  ]"
                >
                  {{ milestone.impact }} impact
                </span>
              </div>
            </li>
          </ul>
        </article>
      </section>

      <section :class="$style['grid-two-up']">
        <article :class="[$style.panel, $style.todos]">
          <header>
            <h2>Operational TODOs</h2>
            <p>High-leverage items to unblock.</p>
          </header>
          <ul>
            <li v-for="todo in adminTodos" :key="todo.id">
              <div>
                <strong>{{ todo.title }}</strong>
                <p>{{ todo.detail }}</p>
              </div>
              <div :class="$style['todo-meta']">
                <span>{{ todo.owner }}</span>
                <span>Due {{ todo.due }}</span>
                <span
                  :class="[
                    $style['todo-chip'],
                    $style[`todo-chip--${statusToClass(todo.status)}`],
                  ]"
                >
                  {{ todo.status }}
                </span>
                <span
                  :class="[
                    $style['impact-tag'],
                    $style[`impact-tag--${impactToClass(todo.impact)}`],
                  ]"
                >
                  {{ todo.impact }} impact
                </span>
              </div>
            </li>
          </ul>
        </article>

        <article :class="[$style.panel, $style.risks]">
          <header>
            <h2>Risk & alert radar</h2>
            <p>Flags needing exec attention.</p>
          </header>
          <ul>
            <li v-for="risk in riskAlerts" :key="risk.id">
              <div>
                <span
                  :class="[
                    $style['risk-dot'],
                    $style[`risk-dot--${risk.severity}`],
                  ]"
                ></span>
                <div>
                  <strong>{{ risk.title }}</strong>
                  <p>{{ risk.detail }}</p>
                </div>
              </div>
              <div>
                <strong>{{ risk.indicator }}</strong>
                <small>{{ risk.owner }}</small>
              </div>
            </li>
          </ul>
        </article>
      </section>
    </div>
  </section>
</template>

<style module lang="scss">
.page {
  padding: calc(var(--height-space) * 0.35) 0 var(--height-space);
}

.panel {
  border-radius: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  background: color-mix(in srgb, var(--background-color) 90%, transparent);
  box-shadow: 0 30px 70px color-mix(in srgb, #000 18%, transparent);
  padding: 1.75rem;
}

.hero {
  position: relative;
  margin-bottom: 2.5rem;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  padding: 2.5rem;
  border-radius: 2rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 20%, transparent);
  background:
    color-mix(in srgb, var(--background-color) 50%, transparent),
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--color-palette-4, #00f0ff) 20%, transparent) 0%, transparent 55%);
  overflow: hidden;
  isolation: isolate;
}

.hero-copy h1 {
  font-size: clamp(2rem, 3vw, 2.8rem);
  margin: 0.35rem 0 0.65rem 0;
}

.hero-copy p {
  max-width: 38ch;
}

.hero-operator {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 14%, transparent);
  background: color-mix(in srgb, var(--background-color) 40%, transparent);
  font-size: 0.9rem;
}

.hero-brief {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.hero-brief li {
  border-radius: 1.2rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 18%, transparent);
  background: color-mix(in srgb, var(--background-color) 80%, transparent);
  padding: 1rem;
}

.hero-brief span {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.hero-brief strong {
  display: block;
  font-size: 1.6rem;
  margin-top: 0.35rem;
}

.hero-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--accent-color, #ffd454) 20%, transparent) 0%, transparent 55%),
    radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--color-palette-2, #0b66ff) 20%, transparent) 0%, transparent 50%);
  opacity: 0.4;
  filter: blur(20px);
  pointer-events: none;
  z-index: -1;
}

.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}

.timeframe-switcher {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.timeframe-switcher__button {
  border-radius: 1.2rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  background: color-mix(in srgb, var(--background-color) 80%, transparent);
  padding: 1rem 1.2rem;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: border 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.timeframe-switcher__button small {
  display: block;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.timeframe-switcher__button--active {
  border-color: color-mix(in srgb, var(--color-palette-2, #0b66ff) 50%, transparent);
  background: color-mix(in srgb, var(--color-palette-2, #0b66ff) 12%, var(--background-color));
  transform: translateY(-2px);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.kpi-card header {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.kpi-card strong {
  font-size: 2rem;
}

.kpi-delta {
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  font-size: 0.95rem;
  font-family: var(--mono-font);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kpi-delta small {
  font-family: var(--text-font);
  text-transform: none;
  letter-spacing: normal;
}

.kpi-delta--up {
  color: #1ec28b;
}

.kpi-delta--down {
  color: #ff6b6b;
}

.grid-two-up {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.trends header,
.segments header,
.funnel header,
.usage header,
.courses header,
.pipeline header,
.todos header,
.risks header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.badge {
  display: inline-flex;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  text-transform: uppercase;
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.1rem;
}

.trend-card {
  border-radius: 1rem;
  border: 1px dashed color-mix(in srgb, var(--foreground-color) 20%, transparent);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sparkline {
  width: 100%;
  height: 80px;
}

.sparkline polyline {
  fill: none;
  stroke: color-mix(in srgb, var(--color-palette-2, #0b66ff) 80%, transparent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sparkline line {
  stroke: color-mix(in srgb, var(--accent-color, #ffd454) 60%, transparent);
  stroke-width: 1;
  stroke-dasharray: 4;
}

.segments ul,
.funnel ul,
.pipeline ul,
.todos ul,
.risks ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.segments li,
.funnel li,
.pipeline li,
.todos li,
.risks li {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
}

.segments li:last-child,
.funnel li:last-child,
.pipeline li:last-child,
.todos li:last-child,
.risks li:last-child {
  border-bottom: none;
}

.funnel-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground-color) 10%, transparent);
}

.funnel-bar span {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #0b66ff, #00f0ff);
  transform-origin: left center;
  transform: scaleX(var(--progress));
}

.usage {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.heatmap-grid {
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  overflow: hidden;
}

.heatmap-grid__header,
.heatmap-row {
  display: grid;
  grid-template-columns: 50px repeat(6, minmax(40px, 1fr)) minmax(140px, 1fr);
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
}

.heatmap-grid__header {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.7;
}

.heatmap-row:nth-child(even) {
  background: color-mix(in srgb, var(--foreground-color) 6%, transparent);
}

.heat-cell {
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-family: var(--mono-font);
}

.heat-note {
  font-size: 0.85rem;
  opacity: 0.85;
}

.actions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.actions-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--foreground-color) 10%, transparent);
}

.actions-list li:last-child {
  border-bottom: none;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.course-card {
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: color-mix(in srgb, var(--background-color) 80%, transparent);
}

.course-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.course-card dt {
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.course-card dd {
  margin: 0;
  font-weight: 600;
}

.course-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.course-progress > div:nth-child(2) {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.course-progress span {
  font-size: 0.85rem;
}

.course-progress [style*="--progress"] {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
  overflow: hidden;
  position: relative;
}

.course-progress [style*="--progress"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #1ec28b, #00bcd4);
  transform-origin: left center;
  transform: scaleX(var(--progress));
}

.pipeline li > div:last-child,
.todos li > div:last-child,
.risks li > div:last-child {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.impact-tag {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.impact-tag--high {
  border-color: color-mix(in srgb, #ff6b6b 60%, transparent);
  color: #ff6b6b;
}

.impact-tag--medium {
  border-color: color-mix(in srgb, #ffd454 60%, transparent);
  color: #ffd454;
}

.impact-tag--low {
  border-color: color-mix(in srgb, var(--foreground-color) 30%, transparent);
}

.todo-meta {
  font-size: 0.9rem;
}

.todo-chip {
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  border: 1px solid;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.todo-chip--in-progress {
  border-color: color-mix(in srgb, var(--color-palette-2, #0b66ff) 40%, transparent);
  color: var(--color-palette-2, #0b66ff);
}

.todo-chip--blocked {
  border-color: color-mix(in srgb, #ff6b6b 60%, transparent);
  color: #ff6b6b;
}

.todo-chip--review {
  border-color: color-mix(in srgb, var(--accent-color, #ffd454) 50%, transparent);
  color: var(--accent-color, #ffd454);
}

.risks li {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.risks li > div:first-child {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.risk-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  margin-top: 0.3rem;
}

.risk-dot--high {
  background: #ff6b6b;
}

.risk-dot--medium {
  background: #ffd454;
}

.risk-dot--low {
  background: #1ec28b;
}

@media (max-width: 768px) {
  .heatmap-grid {
    overflow-x: auto;
  }

  .heatmap-grid__header,
  .heatmap-row {
    min-width: 640px;
  }

  .course-card dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
