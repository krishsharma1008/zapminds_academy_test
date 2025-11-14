import type { GithubContribution } from "~/server/api/github";

export const UIElements = {
  common: {
    loading: "Loading",
    noData: "No data available",
  },
  header: {
    sourceCode: "Source code repository",
    themeSwitcher: (alternateTheme: Theme = "light") =>
      `Switch to ${alternateTheme} theme`,
    colorPaletteButton: "New color palette",
  },
  game: {
    complete: (percentComplete: number = 0) => `${percentComplete}% complete`,
    unlocked: (current: number = 0, max: number = 0) =>
      `Unlocked: ${current}/${max}`,
    currentXPPoints: (points: number = 0) =>
      `Current experience points: ${points}`,
    nextLevel: (pointsNeeded: number = 0) =>
      `Next level in ${pointsNeeded} ${pointsNeeded > 1 ? "points" : "point"}.`,
    guideline:
      "Interact with the site to gain experience points and unlock new contents and features!",
    contents: {
      title: "Contents",
      completed: "New content unlocked!",
    },
    features: {
      title: "Features",
      completed: "New feature unlocked!",
    },
    scrollToContinue: "Scroll to continue",
    skip: {
      disclaimer: "Don't want to play the game? Too bad!",
      button: "Unlock everything",
    },
  },
  hero: {
    guideline: "Slide to begin",
  },
  projects: {
    hoverTitle: "Click!",
  },
  years: {
    guideline: "Drag left",
  },
  invoices: {
    guideline: "Click & hold",
    completed: "Well done!!",
  },
  openSource: {
    guideline: "Draw a line",
    completed: "Excellent!!",
    githubLabels: (type: GithubContribution["type"] = "star"): string => {
      return (() => {
        switch (type) {
          case "star":
            return "Earned stars";
          case "commit":
            return "Number of commits";
          case "follower":
            return "Number of followers";
          case "pr":
            return "Number of pull requests";
          case "issue":
            return "Number of issues closed";
        }
      })();
    },
  },
  auth: {
    portalLabel: "Student portal",
    title: "Welcome back",
    subtitle: "Sign in to continue building with Zapminds Academy.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    rememberMe: "Keep me signed in",
    forgotPassword: "Forgot password?",
    primaryCta: "Log in",
    dashboardCta: "Open dashboard",
    logoutCta: "Sign out",
    secondaryTitle: "Other ways to access",
    ssoProviders: {
      google: "Continue with Google",
      github: "Continue with GitHub",
      microsoft: "Continue with Microsoft",
    },
    createAccountPrompt: "New to Zapminds Academy?",
    createAccountCta: "Create an account",
    supportNote:
      "Need help? Reach out to support@zapminds.academy and we'll get you unstuck.",
  },
  dashboard: {
    greeting: (name: string) => `Welcome back, ${name}`,
    headline: "Keep pushing your problem-solving superpowers.",
    activeDayStreak: (days: number) => `${days}-day streak`,
    xpLabel: (points: number) => `${points} XP`,
    continueCta: "Resume last session",
    coursesTitle: "Active courses",
    courseProgressLabel: (completed: number, total: number) =>
      `${completed}/${total} modules`,
    nextUpLabel: "Next up",
    difficultyLabels: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert",
    },
    courseAction: "Open course",
    insightsTitle: "Learning insights",
    insights: {
      solvedToday: (count: number) =>
        `${count} challenge${count === 1 ? "" : "s"} solved today`,
      weeklyGoal: "Weekly goal",
      reviewQueue: (count: number) =>
        `${count} problem${count === 1 ? "" : "s"} ready for review`,
    },
    topicsTitle: "Course outline",
    topicStatus: {
      completed: "Completed",
      inProgress: "In progress",
      locked: "Locked",
    },
    codePreviewLabel: (language: string) => `${language} snippet`,
    leaderboardTitle: "Leaderboard",
    leaderboardUpdated: "Updated in real-time",
    leaderboardCta: "View full leaderboard",
  },
};
