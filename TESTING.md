# Testing Guide - Zapminds Academy XP System

## Overview

This document provides a comprehensive testing checklist for the XP System implementation. Follow these steps to ensure all features work correctly.

## Prerequisites

- Local development environment running (`npm run dev`)
- Supabase project configured with all migrations applied
- Test user account created
- Database seeded with course content

---

## 1. Authentication Testing

### Sign Up
- [ ] Navigate to `/signup`
- [ ] Fill in all required fields (name, email, password)
- [ ] Select a preferred track
- [ ] Accept honor code
- [ ] Click "Create Account"
- [ ] Verify email confirmation message appears
- [ ] Check email for confirmation link
- [ ] Click confirmation link
- [ ] Verify redirect to dashboard

### Sign In
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] Verify redirect to dashboard
- [ ] Check that user profile displays correctly

### Sign Out
- [ ] Click sign out button on dashboard
- [ ] Verify redirect to login page
- [ ] Attempt to access protected route (e.g., `/dashboard`)
- [ ] Verify redirect back to login

### OAuth Providers
- [ ] Test Google sign-in
- [ ] Test GitHub sign-in (if configured)
- [ ] Test Microsoft sign-in (if configured)
- [ ] Verify profile creation for OAuth users

---

## 2. Dashboard Testing

### Hero Section
- [ ] Verify current tier badge displays correctly
- [ ] Check XP total is accurate
- [ ] Verify tier progress bar shows correct percentage
- [ ] Check "Next tier at X XP" message
- [ ] Verify "Solved today" count
- [ ] Check "Review queue" count

### Stats Cards
- [ ] Verify weekly goal progress displays correctly
- [ ] Check percentage calculation
- [ ] Verify module count (completed / total)
- [ ] Check XP progress ring animation

### Course Cards
- [ ] Verify all courses display
- [ ] Check progress percentage for each course
- [ ] Verify earned XP displays
- [ ] Check "Next up" module information
- [ ] Verify course tags display
- [ ] Test course card click navigation

### Actions
- [ ] Test "Continue Learning" button
- [ ] Test "Sign Out" button
- [ ] Test "View Leaderboard" link
- [ ] Test "Daily Streak Quest" link

---

## 3. Course Pages Testing

### Python Foundations
- [ ] Navigate to `/courses/python`
- [ ] Verify course progress percentage
- [ ] Check earned XP / total XP display
- [ ] Verify module list displays
- [ ] Check module XP badges (75, 125, or 175 XP)
- [ ] Verify module difficulty labels
- [ ] Test module selection
- [ ] Check active module highlighting

### Other Courses
- [ ] Test Machine Learning course page
- [ ] Test Deep Learning course page
- [ ] Test LLM Engineering course page
- [ ] Test Agentic AI course page
- [ ] Test RAG course page
- [ ] Test MCP course page

### Module Details
- [ ] Verify learning objectives display
- [ ] Check suggested reading links
- [ ] Verify exercise prompt displays
- [ ] Check code playground loads

---

## 4. Code Playground Testing

### Basic Functionality
- [ ] Verify Monaco editor loads
- [ ] Test code editing
- [ ] Check syntax highlighting
- [ ] Test "Run Tests" button
- [ ] Verify test results display

### XP Award Flow (First Completion)
- [ ] Complete a warmup module (75 XP)
  - [ ] Verify all tests pass
  - [ ] Check XP animation appears
  - [ ] Verify XP amount is correct (75 XP)
  - [ ] Check dashboard XP updates
- [ ] Complete a core module (125 XP)
  - [ ] Verify XP award
  - [ ] Check animation
- [ ] Complete a challenge module (175 XP)
  - [ ] Verify XP award
  - [ ] Check animation

### Tier Change
- [ ] Earn enough XP to reach next tier
- [ ] Verify tier up modal appears
- [ ] Check new tier icon and name
- [ ] Verify tier badge awarded
- [ ] Check dashboard tier updates

### Re-completion
- [ ] Re-attempt a completed module
- [ ] Verify no XP is awarded
- [ ] Check that tests still run
- [ ] Verify module remains marked as completed

---

## 5. Daily Streak Testing

### First Claim
- [ ] Navigate to `/daily-streak`
- [ ] Verify current streak displays (0 or current)
- [ ] Check XP reward calculation (120 + streak × 8)
- [ ] Click "Claim Streak"
- [ ] Verify XP animation
- [ ] Check streak increments to 1
- [ ] Verify XP awarded correctly

### Consecutive Days
- [ ] Wait 24 hours (or adjust system time for testing)
- [ ] Claim streak again
- [ ] Verify streak increments
- [ ] Check XP reward increases

### Streak Milestones
- [ ] Reach 3-day streak
  - [ ] Verify "Consistent Learner" badge awarded
  - [ ] Check badge modal appears
- [ ] Reach 7-day streak
  - [ ] Verify "Week Warrior" badge awarded
- [ ] Reach 30-day streak
  - [ ] Verify "Monthly Master" badge awarded
- [ ] Reach 100-day streak
  - [ ] Verify "Century Champion" badge awarded

### Streak Reset
- [ ] Miss a day (don't claim for 48+ hours)
- [ ] Claim streak
- [ ] Verify streak resets to 1
- [ ] Check "wasReset" message displays
- [ ] Verify longest streak is preserved

### Already Claimed
- [ ] Claim streak
- [ ] Try to claim again same day
- [ ] Verify error message
- [ ] Check countdown timer displays

---

## 6. Leaderboard Testing

### Basic Display
- [ ] Navigate to `/leaderboard`
- [ ] Verify leaderboard entries display
- [ ] Check rankings are in order (highest XP first)
- [ ] Verify tier badges display correctly
- [ ] Check XP totals are accurate
- [ ] Verify current user is highlighted

### Top 3 Recognition
- [ ] Check top 3 users have medal icons
  - [ ] 1st place: 🥇
  - [ ] 2nd place: 🥈
  - [ ] 3rd place: 🥉

### Tier Filtering
- [ ] Click "All Tiers" filter
- [ ] Verify all users display
- [ ] Click "Bronze" filter
- [ ] Verify only Bronze users display
- [ ] Test each tier filter
- [ ] Verify filter button highlights active tier

### Search
- [ ] Enter a student name in search box
- [ ] Verify filtered results
- [ ] Test partial name matching
- [ ] Clear search
- [ ] Verify all results return

### Clear Filters
- [ ] Apply tier filter and search
- [ ] Click "Clear Filters"
- [ ] Verify all filters reset
- [ ] Check all users display again

---

## 7. XP Transaction History

### Access
- [ ] Navigate to dashboard
- [ ] Find and click "View XP History" (if implemented)
- [ ] Or access via API endpoint

### Display
- [ ] Verify transactions display in reverse chronological order
- [ ] Check transaction sources (module, daily, bonus, etc.)
- [ ] Verify XP deltas display correctly (+/-)
- [ ] Check timestamps are accurate
- [ ] Verify notes/descriptions display

---

## 8. Badge System Testing

### Tier Badges
- [ ] Reach Silver tier (1,000 XP)
  - [ ] Verify "Silver Scholar" badge awarded
- [ ] Reach Gold tier (3,000 XP)
  - [ ] Verify "Gold Graduate" badge awarded
- [ ] Continue for other tiers

### Badge Display
- [ ] Navigate to profile/badges page (if implemented)
- [ ] Verify all earned badges display
- [ ] Check badge icons render correctly
- [ ] Verify earned dates are accurate
- [ ] Check badge descriptions

---

## 9. Progress Tracking

### Module Completion
- [ ] Complete a module
- [ ] Check `module_completions` table in Supabase
- [ ] Verify record created with correct XP
- [ ] Check `xp_transactions` table
- [ ] Verify transaction recorded

### Course Progress
- [ ] Complete multiple modules in a course
- [ ] Check course progress percentage updates
- [ ] Verify earned XP accumulates
- [ ] Test progress API endpoint

### Profile Updates
- [ ] Earn XP
- [ ] Check `profiles` table in Supabase
- [ ] Verify `xp_total` updated
- [ ] Check `current_tier` updates when threshold reached
- [ ] Verify `tier_updated_at` timestamp

---

## 10. Edge Cases & Error Handling

### Network Errors
- [ ] Disable network
- [ ] Attempt to claim streak
- [ ] Verify error message displays
- [ ] Re-enable network
- [ ] Verify retry works

### Invalid Data
- [ ] Submit exercise with invalid module ID
- [ ] Verify error handling
- [ ] Check no XP awarded

### Concurrent Requests
- [ ] Open two browser tabs
- [ ] Claim streak in both simultaneously
- [ ] Verify only one claim succeeds
- [ ] Check database consistency

### Session Expiry
- [ ] Let session expire
- [ ] Attempt protected action
- [ ] Verify redirect to login
- [ ] Sign in again
- [ ] Verify state restored

---

## 11. Performance Testing

### Page Load Times
- [ ] Measure dashboard load time
- [ ] Check course page load time
- [ ] Verify leaderboard loads quickly
- [ ] Test with slow 3G throttling

### API Response Times
- [ ] Measure `/api/user/stats` response time
- [ ] Check `/api/leaderboard/current` response time
- [ ] Verify `/api/exercises/submit` responds quickly
- [ ] Test under load (multiple concurrent users)

### Animation Performance
- [ ] Check XP float animation is smooth
- [ ] Verify tier glow doesn't cause lag
- [ ] Test badge reveal animation
- [ ] Check progress ring animation

---

## 12. Mobile Responsiveness

### Dashboard
- [ ] Test on mobile viewport (375px width)
- [ ] Verify layout adapts correctly
- [ ] Check touch interactions work
- [ ] Test scrolling

### Course Pages
- [ ] Test module list on mobile
- [ ] Verify code playground is usable
- [ ] Check module selection works

### Leaderboard
- [ ] Test leaderboard table on mobile
- [ ] Verify filters work on touch
- [ ] Check search box is accessible

### Daily Streak
- [ ] Test streak page on mobile
- [ ] Verify claim button is accessible
- [ ] Check countdown timer displays correctly

---

## 13. Browser Compatibility

### Chrome
- [ ] Test all features in Chrome
- [ ] Verify animations work
- [ ] Check console for errors

### Firefox
- [ ] Test all features in Firefox
- [ ] Verify CSS compatibility
- [ ] Check for any rendering issues

### Safari
- [ ] Test on Safari (macOS/iOS)
- [ ] Verify WebKit-specific features
- [ ] Check for any compatibility issues

### Edge
- [ ] Test on Microsoft Edge
- [ ] Verify Chromium compatibility

---

## 14. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through dashboard
- [ ] Verify focus indicators
- [ ] Test keyboard shortcuts
- [ ] Check modal keyboard trapping

### Screen Reader
- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Verify ARIA labels
- [ ] Check heading hierarchy
- [ ] Test form labels

### Color Contrast
- [ ] Verify text meets WCAG AA standards
- [ ] Check tier colors are distinguishable
- [ ] Test with color blindness simulator

---

## 15. Database Integrity

### Constraints
- [ ] Attempt to create duplicate module completion
- [ ] Verify unique constraint enforced
- [ ] Test foreign key constraints
- [ ] Check NOT NULL constraints

### Triggers
- [ ] Award XP to user
- [ ] Verify tier update trigger fires
- [ ] Check `tier_updated_at` timestamp
- [ ] Verify tier badge awarded

### Transactions
- [ ] Check XP transactions are atomic
- [ ] Verify rollback on error
- [ ] Test concurrent XP awards

---

## 16. Security Testing

### Authentication
- [ ] Attempt to access protected routes without auth
- [ ] Verify redirect to login
- [ ] Test token expiry handling
- [ ] Check refresh token flow

### Authorization
- [ ] Attempt to claim another user's streak
- [ ] Verify request is rejected
- [ ] Test accessing other user's data
- [ ] Check API authorization

### Input Validation
- [ ] Submit malformed data to APIs
- [ ] Verify validation errors
- [ ] Test SQL injection attempts
- [ ] Check XSS prevention

---

## 17. Regression Testing

After any code changes, verify:
- [ ] Existing modules still award correct XP
- [ ] Tier progression still works
- [ ] Badges are still awarded correctly
- [ ] Leaderboard still updates
- [ ] Daily streaks still function
- [ ] No new console errors
- [ ] No broken links
- [ ] All animations still work

---

## 18. User Experience Testing

### First-Time User
- [ ] Sign up as new user
- [ ] Complete onboarding (if implemented)
- [ ] Complete first module
- [ ] Verify XP award is clear
- [ ] Check guidance is helpful

### Returning User
- [ ] Sign in as existing user
- [ ] Verify progress is preserved
- [ ] Check streak status
- [ ] Test continuing from last module

### Power User
- [ ] Test with user at high tier
- [ ] Verify leaderboard position
- [ ] Check badge collection
- [ ] Test multiple course progress

---

## Automated Testing (Future)

### Unit Tests
- [ ] Test XP calculation functions
- [ ] Test tier determination logic
- [ ] Test badge criteria checking
- [ ] Test streak calculation

### Integration Tests
- [ ] Test API endpoints
- [ ] Test database operations
- [ ] Test authentication flow
- [ ] Test XP award flow

### E2E Tests
- [ ] Test complete user journey
- [ ] Test module completion flow
- [ ] Test streak claiming flow
- [ ] Test leaderboard updates

---

## Bug Reporting

When you find a bug, report it with:
1. **Description**: What happened?
2. **Expected**: What should have happened?
3. **Steps to Reproduce**: How to trigger the bug?
4. **Environment**: Browser, OS, viewport size
5. **Screenshots**: Visual evidence
6. **Console Logs**: Any errors in console
7. **Network**: Any failed API requests

---

## Sign-Off Checklist

Before marking testing complete:
- [ ] All critical paths tested
- [ ] No blocking bugs found
- [ ] Performance is acceptable
- [ ] Mobile experience is good
- [ ] Accessibility standards met
- [ ] Security vulnerabilities addressed
- [ ] Documentation is accurate
- [ ] Stakeholders have approved

---

**Testing Completed By**: ___________________

**Date**: ___________________

**Sign-Off**: ___________________

