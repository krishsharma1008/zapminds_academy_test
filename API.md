# Zapminds Academy API Documentation

## Overview

This document provides comprehensive documentation for all XP System and Badge API endpoints in the Zapminds Academy platform.

## Table of Contents

1. [Authentication](#authentication)
2. [User Endpoints](#user-endpoints)
3. [Course Progress Endpoints](#course-progress-endpoints)
4. [Exercise Submission Endpoints](#exercise-submission-endpoints)
5. [Badge Endpoints](#badge-endpoints)
6. [Leaderboard Endpoints](#leaderboard-endpoints)
7. [Daily Streak Endpoints](#daily-streak-endpoints)
8. [Error Handling](#error-handling)

---

## Authentication

All API endpoints require authentication using a Bearer token obtained from Supabase Auth.

### Headers

```
Authorization: Bearer <your_access_token>
```

### Getting an Access Token

Access tokens are automatically managed by the Supabase client. In the frontend, use the `useStudentAuth()` composable to access the authenticated user's token.

---

## User Endpoints

### Initialize User Profile

**POST** `/api/user/initialize`

Creates or initializes a user's profile and streak records upon first login or signup.

**Request Body:**
```json
{
  // No body required - user ID extracted from token
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "user_id": "uuid",
    "display_name": "Student Name",
    "xp_total": 0,
    "level": 1,
    "current_tier": "Bronze"
  },
  "streak": {
    "user_id": "uuid",
    "current_streak": 0,
    "longest_streak": 0,
    "last_completed_date": null
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (missing or invalid token)
- `500`: Server error

---

### Get User Stats

**GET** `/api/user/stats`

Retrieves aggregated user statistics for the dashboard, including XP, tier, streaks, and activity metrics.

**Response:**
```json
{
  "xp": {
    "total": 1500,
    "tier": "Silver",
    "nextTier": "Gold",
    "xpIntoTier": 500,
    "xpToNextTier": 1500,
    "xpNeededForNextTier": 3000,
    "percentToNextTier": 0.25
  },
  "streak": {
    "current": 5,
    "longest": 12,
    "lastCompletedDate": "2025-11-09"
  },
  "submissionsToday": 3,
  "reviewQueueCount": 2,
  "recentBadges": [
    {
      "badge_key": "streak_3_days",
      "badge_name": "Consistent Learner",
      "badge_icon": "🥉",
      "earned_at": "2025-11-07T10:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Get XP Transaction History

**GET** `/api/user/xp-transactions`

Retrieves a user's complete XP transaction history, ordered by most recent first.

**Response:**
```json
[
  {
    "id": 123,
    "user_id": "uuid",
    "source": "module",
    "source_id": 45,
    "delta": 125,
    "created_at": "2025-11-09T14:30:00Z",
    "note": "python-variables"
  },
  {
    "id": 122,
    "user_id": "uuid",
    "source": "daily",
    "source_id": null,
    "delta": 128,
    "created_at": "2025-11-09T08:00:00Z",
    "note": "Daily streak day 1"
  }
]
```

**XP Sources:**
- `module`: Module completion
- `course`: Course completion bonus
- `daily`: Daily streak claim
- `bonus`: Special bonuses
- `admin_adjustment`: Manual admin adjustment

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

## Course Progress Endpoints

### Get Course Progress

**GET** `/api/courses/:courseId/progress`

Retrieves a user's progress for a specific course, including module completions and earned XP.

**Parameters:**
- `courseId` (path): Course slug (e.g., "python", "machine-learning")

**Response:**
```json
{
  "courseId": "python",
  "courseTitle": "Python Foundations",
  "completionPercent": 60,
  "earnedXp": 750,
  "totalXp": 1250,
  "completedModules": 6,
  "totalModules": 10,
  "modules": [
    {
      "moduleId": 1,
      "isCompleted": true,
      "earnedXp": 125
    },
    {
      "moduleId": 2,
      "isCompleted": false,
      "earnedXp": 0
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Course not found
- `500`: Server error

---

## Exercise Submission Endpoints

### Submit Exercise

**POST** `/api/exercises/submit`

Handles exercise submissions. Awards XP on first successful completion, checks for tier changes, and awards badges.

**Request Body:**
```json
{
  "moduleId": 45,
  "passed": true,
  "code": "def hello():\n    print('Hello, World!')"
}
```

**Response (First Completion):**
```json
{
  "awarded": true,
  "moduleId": 45,
  "xpAwarded": 125,
  "xpResult": {
    "newXpTotal": 1625,
    "tierChanged": false,
    "newTier": null
  },
  "tierBadge": null
}
```

**Response (Tier Change):**
```json
{
  "awarded": true,
  "moduleId": 45,
  "xpAwarded": 125,
  "xpResult": {
    "newXpTotal": 3000,
    "tierChanged": true,
    "newTier": {
      "name": "Gold",
      "icon": "🥇"
    }
  },
  "tierBadge": {
    "name": "Gold Graduate",
    "icon": "🥇"
  }
}
```

**Response (Already Completed):**
```json
{
  "awarded": false,
  "reason": "Module already completed"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request (missing moduleId or passed=false)
- `401`: Unauthorized
- `404`: Module not found
- `500`: Server error

---

## Badge Endpoints

### Get User Badges

**GET** `/api/user/badges`

Retrieves all badges earned by the user.

**Response:**
```json
[
  {
    "id": 1,
    "badge_key": "tier_silver",
    "badge_name": "Silver Scholar",
    "badge_description": "Reached Silver tier",
    "badge_icon": "🥈",
    "badge_category": "tier",
    "earned_at": "2025-11-05T12:00:00Z",
    "is_displayed": true
  },
  {
    "id": 2,
    "badge_key": "streak_7_days",
    "badge_name": "Week Warrior",
    "badge_description": "Maintained a 7-day learning streak",
    "badge_icon": "🥈",
    "badge_category": "streak",
    "earned_at": "2025-11-08T09:00:00Z",
    "is_displayed": true
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Award Badge (Manual)

**POST** `/api/user/badges/award`

Manually awards a badge to a user. Typically used by admins or for special events.

**Request Body:**
```json
{
  "badgeKey": "special_event_2025",
  "isDisplayed": true
}
```

**Response:**
```json
{
  "awarded": true,
  "badge": {
    "name": "Special Event 2025",
    "icon": "🎉"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid badge key or user already has badge
- `401`: Unauthorized
- `404`: Badge definition not found
- `500`: Server error

---

### Check and Award Badges

**POST** `/api/user/badges/check`

Checks user's activity and automatically awards newly earned badges based on criteria.

**Response:**
```json
{
  "checked": true,
  "newlyAwarded": [
    {
      "name": "Course Completion: Python",
      "icon": "🐍"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

## Leaderboard Endpoints

### Get Leaderboard

**GET** `/api/leaderboard/:seasonId`

Retrieves ranked leaderboard entries for a specific season, including user tier information.

**Parameters:**
- `seasonId` (path): Season ID or "current" for active season

**Response:**
```json
{
  "season": {
    "id": 1,
    "name": "Zap Season · Wave 04",
    "starts_at": "2025-11-01T00:00:00Z",
    "ends_at": null
  },
  "entries": [
    {
      "user_id": "uuid-1",
      "rank": 1,
      "display_name": "Top Student",
      "xp_total": 15000,
      "tier": "Diamond",
      "tier_icon": "💠",
      "is_current_user": false
    },
    {
      "user_id": "uuid-2",
      "rank": 2,
      "display_name": "Second Place",
      "xp_total": 12000,
      "tier": "Platinum",
      "tier_icon": "💎",
      "is_current_user": true
    }
  ],
  "userEntry": {
    "user_id": "uuid-2",
    "rank": 2,
    "display_name": "Second Place",
    "xp_total": 12000,
    "tier": "Platinum",
    "tier_icon": "💎",
    "is_current_user": true
  }
}
```

**Status Codes:**
- `200`: Success
- `404`: Season not found
- `500`: Server error

---

### Update Leaderboard

**POST** `/api/leaderboard/update`

Triggers a recalculation of leaderboard rankings. Typically called by a cron job or admin action.

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard recalculation initiated."
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (requires admin or system role)
- `500`: Server error

---

## Daily Streak Endpoints

### Get Streak Status

**GET** `/api/daily-streak/status`

Retrieves the user's current streak status and claim eligibility.

**Response:**
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "lastCompletedDate": "2025-11-08",
  "claimedToday": false,
  "canClaimToday": true,
  "nextStreakDay": 6,
  "xpReward": 168,
  "timeUntilNextClaim": {
    "hours": 6,
    "minutes": 30,
    "seconds": 45
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Claim Daily Streak

**POST** `/api/daily-streak/claim`

Claims the daily streak and awards XP. Can only be claimed once per day.

**Response (Success):**
```json
{
  "success": true,
  "streak": {
    "current": 6,
    "longest": 12,
    "wasReset": false
  },
  "xpAwarded": 168,
  "xpResult": {
    "newXpTotal": 2168,
    "tierChanged": false,
    "newTier": null
  },
  "badges": {
    "tierBadge": null,
    "streakBadge": null
  }
}
```

**Response (Streak Milestone):**
```json
{
  "success": true,
  "streak": {
    "current": 7,
    "longest": 12,
    "wasReset": false
  },
  "xpAwarded": 176,
  "xpResult": {
    "newXpTotal": 2344,
    "tierChanged": false,
    "newTier": null
  },
  "badges": {
    "tierBadge": null,
    "streakBadge": {
      "name": "Week Warrior",
      "icon": "🥈"
    }
  }
}
```

**Response (Streak Reset):**
```json
{
  "success": true,
  "streak": {
    "current": 1,
    "longest": 12,
    "wasReset": true
  },
  "xpAwarded": 128,
  "xpResult": {
    "newXpTotal": 2472,
    "tierChanged": false,
    "newTier": null
  },
  "badges": {
    "tierBadge": null,
    "streakBadge": null
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Already claimed today
- `401`: Unauthorized
- `500`: Server error

---

## Error Handling

### Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "statusCode": 400,
  "statusMessage": "Invalid request",
  "message": "Detailed error message here"
}
```

### Common Status Codes

- `200`: Success
- `400`: Bad Request (invalid parameters, validation errors)
- `401`: Unauthorized (missing or invalid authentication token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (unexpected server error)

### Error Handling Best Practices

1. **Always check status codes** before processing responses
2. **Display user-friendly messages** from `statusMessage` or `message`
3. **Log errors** for debugging purposes
4. **Implement retry logic** for transient errors (500, 503)
5. **Handle authentication errors** by redirecting to login

---

## Rate Limiting

Currently, there are no rate limits enforced. However, please be respectful of the API and avoid excessive requests.

**Recommended practices:**
- Cache responses when appropriate
- Debounce user input before making API calls
- Use pagination for large datasets
- Implement exponential backoff for retries

---

## Versioning

The API is currently at version 1.0. Future versions will be introduced with backward compatibility in mind.

**Version Header (Future):**
```
X-API-Version: 1.0
```

---

## Support

For API-related questions or issues:

- **Email**: api-support@zapminds.academy
- **Discord**: #api-help channel
- **GitHub**: Open an issue in the repository

---

**Last Updated: November 2025**

