# Doomsday Clock V2

## Product purpose

Doomsday Clock helps people who are procrastinating, overwhelmed, or prone to time blindness turn a deadline into one clear next action. The product should feel encouraging and game-like without becoming another source of distraction.

The timer is useful without an account. Signing in adds continuity, not permission to focus.

## Product principles

- Show one current task, one countdown, and one primary action.
- Make starting easier than configuring.
- Reward progress without punishing a missed estimate.
- Keep the finish line stable while redistributing available time across unfinished work.
- Collect as little personal data as possible.
- Explain external services before asking the user to connect one.
- Keep core timing usable when authentication, AI, or music is unavailable.

## Primary users

- A person with a hard deadline who needs a workable plan now.
- A person with ADHD or time blindness who benefits from visible urgency and small wins.
- A procrastinator who needs a low-friction first step, not a complex project manager.

This is a focus aid, not medical treatment, diagnostic software, or an emergency service.

## V2 scope

### Guest focus timer

A guest can:

- enter or generate a task list;
- choose a finish time;
- let the app distribute the available time across unfinished tasks;
- start, pause, resume, restart, add time, complete a task, and move to the next task;
- keep progress locally on the device;
- receive optional, adjustable countdown and completion sounds;
- finish the session without creating an account.

Early completion banks unused time and redistributes it across unfinished tasks without moving the chosen finish line. The app must handle overdue work, a finish time after midnight, refresh recovery, and an invalid or already-passed deadline without losing the task list.

### Optional account

Clerk provides authentication. Google is the first enabled sign-in method. The architecture must allow more Clerk-supported identity providers later without changing the timer domain model.

Sign-in is required only for cloud-saved plans, cross-device synchronization, and protected account actions. A guest must be able to export or keep local work without signing in. Account linking and migration of guest data require clear user confirmation.

### Music

The service picker presents YouTube first. Spotify and Apple Music use the same adapter contract and may remain unavailable until their platform requirements are met. The UI must call the first service "YouTube," not "YouTube Music."

Music is optional. The timer must continue if playback is blocked, disconnected, paused, or unsupported. Connecting a provider must explain whether an account, subscription, popup, or additional consent is required.

### AI task creation

AI turns a plain-language goal into an editable task plan. The user reviews the plan before it changes the timer.

Supported connection paths:

- session-only bring-your-own-key for OpenAI and Anthropic;
- an extensible provider and model picker for additional providers;
- explicit connection testing for a local Ollama or LM Studio instance.

The app must not scan the local network or probe ports automatically. Cloud-provider keys remain in memory for the current browser session and disappear on refresh, sign-out, or tab close. The product must say this plainly near the key field.

### Optional accountability pledge

A user may set a voluntary accountability pledge of $1 to $5 for a sprint. The amount and pledge state stay on the device. This is a personal commitment prompt, not a wager, bet, prize, entry fee, debt, or condition of using the product.

The app never charges automatically, stores a payment method, locks a feature, or creates an amount owed. Only after the outcome is known may the user choose to open the configured Buy Me a Coffee creator page outside the app. Completing the sprint means no payment is requested, though the completion screen may offer a separate optional coffee. Missing the finish line receives warm, neutral language and the same access to every feature whether or not the user follows through.

The feature stays disabled in production until current provider policies and applicable legal requirements have been reviewed. The setup screen must clearly explain that the pledge is optional, voluntary, and not processed by Doomsday Clock.

## Core journey

1. The user names the outcome and chooses a finish time.
2. They add tasks manually or ask a connected model for a draft.
3. They review and edit the plan.
4. They start the sprint and see only the current task, remaining time, and primary controls.
5. Optional music and sound cues support the session without blocking it.
6. Completing a task gives immediate feedback and recalculates the remaining plan.
7. At the end, the app summarizes completed work and offers a clear next step.

## Success criteria

- A first-time guest can start a timer without documentation or sign-in.
- The timer and saved local progress survive a refresh.
- The current task and finish time are understandable at a glance on a phone.
- Keyboard-only and screen-reader users can complete the full timer flow.
- Reduced-motion and muted-sound preferences are honored.
- A failed auth, AI, or music request never destroys the active plan.
- Declining or ignoring an accountability pledge never limits the product or creates a balance due.
- No secret is bundled into client code, logs, analytics, source control, or deployment artifacts.

## Out of scope for the first working V2

- Social feeds, public profiles, leaderboards, or competitive streaks.
- Advertising, subscriptions, behavioral tracking, or selling user data.
- Background local-network discovery.
- Storing third-party AI keys in the database or browser storage.
- Automatic pledge collection, stored payment methods, prizes, entry fees, debt tracking, or enforcement.
- Claiming Spotify or Apple Music playback works before an official integration is implemented and verified.
- Replacing the stable V1 app or its published URL.
