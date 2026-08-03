# Doomsday Clock V2 — Technical UI Audit

Date: 2026-08-02

Post-audit note: the timer progress bar now uses shadcn/Base UI `Progress`, which supplies `progressbar` semantics and numeric ARIA values. The countdown itself still needs the non-chatty timer/status treatment described below. The original score is retained as the baseline for the next full audit.

Scope: the current Next.js web application in `app/`, including the focus timer, planner, settings dialog, music picker, cloud plans, and optional accountability pledge. This is a report-only audit; no interface fixes were made during this pass.

## Audit health score

| # | Dimension | Score | Key finding |
|---|---|---:|---|
| 1 | Accessibility | 2/4 | The core flow is semantic and keyboard-friendly, but mobile form text, timer/progress semantics, and composite-tab behavior need work. |
| 2 | Performance | 3/4 | The app is lean and builds quickly; the full dashboard still rerenders twice per second and animates progress via `width`. |
| 3 | Responsive design | 3/4 | Phone breakpoints and 44px primary controls are present, with several smaller controls and viewport/safe-area gaps. |
| 4 | Theming | 3/4 | A coherent dark token palette has strong measured contrast, though many component effects remain raw color values. |
| 5 | Implementation integrity | 2/4 | The experience is product-specific, but outcome actions do not perform what their labels promise and pledge state is not persisted. |
| **Total** |  | **13/20** | **Acceptable — significant release work remains.** |

## Implementation integrity verdict

**Pass, with material follow-up required.** The implementation clearly expresses a deadline-first focus product rather than a generic dashboard: the current task, finish line, countdown, early-completion action, task route, time redistribution, optional music, and voluntary pledge are connected to the product brief. The mechanical detector found one verified warning: the progress bar transitions the layout property `width` in `app/styles/components.css:24`.

The main integrity concern is the always-visible `1 day streak` in `app/components/FocusApp.tsx:52`. It is hard-coded rather than derived from saved activity, so it presents decorative data as if it were a real user achievement. The product roadmap allows streaks only as actual locally or account-stored session data.

## Executive summary

- Audit health score: **13/20 (Acceptable)**
- Findings: **0 P0, 3 P1, 11 P2, 2 P3**
- Release priorities: make outcome actions truthful and functional; make form controls readable without mobile auto-zoom; expose the timer and progress correctly to assistive technology; then address persistence, touch targets, and composite widgets.
- The existing visual system is unusually coherent for a first V2 pass. Its strongest qualities are clear hierarchy, high color contrast, semantic controls, restrained motion, consistent Lucide icons, and progressive disclosure of planner/settings complexity.
- Static checks passed: lint, TypeScript, production build, 34 automated tests, and production dependency audit with zero known vulnerabilities.

## Detailed findings

### P1 — Mobile form text can trigger browser zoom and is too small under pressure

- **Location:** `app/styles/components.css:56`, `app/styles/components.css:58`, `app/styles/components.css:60`, `app/styles/components.css:64`, `app/styles/components.css:73`, `app/styles/components.css:77`, `app/styles/components.css:90-94`
- **Category:** Accessibility / Responsive design
- **Impact:** Most form controls inherit a `0.76rem` or smaller font size. On iOS, text inputs below 16 CSS pixels commonly trigger automatic zoom on focus. The small helper, error, and task-detail text is also harder to read for users with low vision, ADHD, or time pressure.
- **WCAG/standard:** WCAG 1.4.4 Resize Text; mobile usability guidance recommends at least 16px for editable text.
- **Recommendation:** Keep editable controls at `1rem` minimum on phone viewports and raise critical helper/error copy to a readable type role. Verify at 200% zoom and largest text settings.
- **Suggested command:** `$impeccable typeset`

### P1 — The live timer and progress are not exposed as timer/progress semantics

- **Location:** `app/components/TimerHero.tsx:38-44`
- **Category:** Accessibility
- **Impact:** The countdown and progress are generic `div` elements with labels. Their roles, bounds, and state changes are not reliably conveyed by assistive technology, even though they are the core of the product. Announcing every half-second would be disruptive, so this needs intentional semantics rather than a broad live region.
- **WCAG/standard:** WCAG 1.3.1 Info and Relationships; WCAG 4.1.2 Name, Role, Value; WCAG 4.1.3 Status Messages.
- **Recommendation:** Give the countdown an appropriate timer/status contract with non-chatty milestone announcements. Use `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` for progress, plus an accessible text fallback.
- **Suggested command:** `$impeccable harden`

### P1 — Outcome actions do not perform the action they promise

- **Location:** `app/components/OutcomeDialog.tsx:29`; `app/components/FocusApp.tsx:92`
- **Category:** Implementation integrity
- **Impact:** “Plan another sprint” and “Rebalance my plan” both only close the dialog. A user who misses the finish line is returned to the same screen without the planner opening, and a completed user does not receive a new sprint. This breaks the primary recovery path at the most important transition.
- **Recommendation:** Give each outcome an explicit callback: missed should open the planner with preserved work, while completed should reset or open a clearly defined new-sprint flow. Return focus to that destination.
- **Suggested command:** `$impeccable clarify`

### P2 — Several optional controls fall below the 44px touch-target target

- **Location:** `app/styles/components.css:35`, `app/styles/components.css:58`, `app/styles/components.css:73-78`; `app/components/AccountabilityCard.tsx:16-21`
- **Category:** Accessibility / Responsive design
- **Impact:** Provider tabs and pledge amount buttons are 38px high, the Remove action is 36px high, and the policy link has no expanded hit area. They meet WCAG 2.5.8's 24px minimum but miss the project's 44px touch target standard, increasing mis-taps on phones.
- **WCAG/standard:** Project `UI-STANDARDS.md`; Apple 44pt touch guidance; WCAG 2.5.8 Target Size (Minimum) is still met.
- **Recommendation:** Expand the interactive area to at least 44×44px while preserving the compact visual appearance.
- **Suggested command:** `$impeccable adapt`

### P2 — The music service tabs implement only part of the ARIA tabs pattern

- **Location:** `app/components/MusicPanel.tsx:31-40`
- **Category:** Accessibility
- **Impact:** Buttons declare `role="tab"`, but there is no associated `tabpanel`, `aria-controls`, roving `tabIndex`, or arrow-key navigation. Screen-reader and keyboard users receive the expectation of a standard tabs widget without its expected behavior.
- **WCAG/standard:** WAI-ARIA Authoring Practices tabs pattern; WCAG 4.1.2 Name, Role, Value.
- **Recommendation:** Complete the tabs pattern, or remove the ARIA tab roles and present the controls as a simple pressed-button service picker.
- **Suggested command:** `$impeccable harden`

### P2 — The entire dashboard rerenders every 500 milliseconds

- **Location:** `app/hooks/useFocusSession.ts:57-60`, `app/hooks/useFocusSession.ts:87-100`; `app/components/FocusApp.tsx:30-93`
- **Category:** Performance
- **Impact:** Updating `now` twice per second rerenders the timer plus the planner, task lane, music, cloud, pledge, and settings subtrees. The current page is small, so this is not blocking, but it creates unnecessary work and makes future integrations more likely to stutter.
- **Recommendation:** Isolate ticking state inside the timer display, memoize stable side panels where useful, and update only as frequently as the visible precision requires.
- **Suggested command:** `$impeccable optimize`

### P2 — Progress animates a layout property on every tick

- **Location:** `app/components/TimerHero.tsx:43-44`; `app/styles/components.css:24`
- **Category:** Performance
- **Impact:** The mechanical detector verified `transition: width`. Repeated width changes require layout/paint work and can become janky on lower-end devices.
- **Recommendation:** Keep the track dimensions stable and animate a transform such as `scaleX`, with the transform origin at the leading edge and an immediate reduced-motion alternative.
- **Suggested command:** `$impeccable optimize`

### P2 — Mobile viewport and safe-area handling is incomplete

- **Location:** `app/styles/shell.css:1`, `app/styles/dialogs.css:1`
- **Category:** Responsive design
- **Impact:** The shell uses `100vh`, dialogs use `100vh`, and only bottom safe-area padding is applied. Mobile browser chrome, landscape mode, and notched devices can produce extra space or crowd content near the top edge.
- **Recommendation:** Prefer dynamic viewport units (`dvh`) with fallbacks and account for both top and bottom safe-area insets where controls can approach device chrome.
- **Suggested command:** `$impeccable adapt`

### P2 — Some validation and disclosure relationships are visual only

- **Location:** `app/components/MusicPanel.tsx:35-38`; `app/components/PlannerPanel.tsx:47-59`; `app/components/SettingsDialog.tsx:37-42`
- **Category:** Accessibility
- **Impact:** The YouTube error is not announced, planner errors are not tied to the invalid field or focused, and privacy/help copy is not associated with its input through `aria-describedby`. Users may know that something failed without knowing which field needs attention.
- **WCAG/standard:** WCAG 3.3.1 Error Identification; WCAG 3.3.3 Error Suggestion; WCAG 4.1.3 Status Messages.
- **Recommendation:** Add stable IDs, `aria-invalid`, `aria-describedby`, and focus the first invalid control after submission. Announce the YouTube error without validating noisily on every keystroke.
- **Suggested command:** `$impeccable clarify`

### P2 — A fake streak is presented as real progress

- **Location:** `app/components/FocusApp.tsx:52`
- **Category:** Implementation integrity
- **Impact:** Every user sees a one-day streak regardless of activity. Gamification loses motivational value when rewards are not earned and can reduce trust in other saved progress.
- **Recommendation:** Derive streaks from durable session history, label a truthful first-session state, or remove the stat until persistence exists.
- **Suggested command:** `$impeccable clarify`

### P2 — Task completion and current-task state are primarily visual

- **Location:** `app/components/TaskLane.tsx:16-19`; `app/styles/components.css:41-43`
- **Category:** Accessibility
- **Impact:** Completed rows rely on opacity, line-through, and an icon hidden from assistive technology. The active row relies on border/background color. Screen-reader users are not told which task is current or completed.
- **WCAG/standard:** WCAG 1.3.1 Info and Relationships; WCAG 1.4.1 Use of Color.
- **Recommendation:** Add programmatic state such as `aria-current="step"` and accessible completed text while retaining the visual styling.
- **Suggested command:** `$impeccable harden`

### P2 — The optional pledge does not survive a refresh

- **Location:** `app/components/FocusApp.tsx:35`; `app/hooks/useFocusSession.ts:81-85`
- **Category:** Implementation integrity
- **Impact:** The timer session persists locally, but its voluntary pledge is held only in component state. Refreshing during a sprint silently removes the commitment, contrary to the product requirement that pledge amount and state stay on the device.
- **Recommendation:** Persist only the bounded pledge amount and active flag alongside the local sprint, with the same safe parsing and reset behavior as other guest state.
- **Suggested command:** `$impeccable harden`

### P2 — Overtime work is still labeled “Done early”

- **Location:** `app/components/FocusApp.tsx:68`; `app/components/TimerHero.tsx:51-52`
- **Category:** Implementation integrity
- **Impact:** Once a task is overtime, the completion control still says “Done early.” The mismatch can confuse users and makes the reward language feel unearned.
- **Recommendation:** Pass overtime state to the hero and change the action to neutral “Complete task” wording after the allocation expires.
- **Suggested command:** `$impeccable clarify`

### P2 — YouTube synchronization can run before the player is ready

- **Location:** `app/components/MusicPanel.tsx:24-27`, `app/components/MusicPanel.tsx:39`
- **Category:** Implementation integrity / Performance
- **Impact:** When a YouTube URL is loaded during an active timer, the play command is sent immediately after the iframe is mounted. There is no player-ready handshake or load callback to resend it, so playback may remain paused even though the UI says music follows the timer.
- **Recommendation:** Use the documented YouTube player-ready event before synchronizing state and expose a clear blocked-playback recovery action.
- **Suggested command:** `$impeccable harden`

### P3 — The token system stops at the component-effect layer

- **Location:** `app/styles/shell.css:4,11,20,26`; `app/styles/components.css:3-18,28-30,41,52,59,66,79`; `app/styles/dialogs.css:2,23-24`
- **Category:** Theming
- **Impact:** Core colors are semantic tokens, but translucent fills, shadows, and gradients repeatedly hard-code RGB values. This is manageable with one dark theme, but makes future theme tuning inconsistent.
- **Recommendation:** Add semantic alpha/elevation tokens for accent wash, success wash, card gradient, scrim, and glow. Keep provider brand colors separate from general tokens.
- **Suggested command:** `$impeccable colorize`

### P3 — Reduced-motion preference silently disables sound

- **Location:** `lib/timer/sounds.ts:25`; `app/hooks/useFocusSession.ts:51-56`
- **Category:** Accessibility / Implementation integrity
- **Impact:** Visual-motion and audio preferences are independent. A user who requests reduced motion can see sounds marked enabled while hearing nothing, with no explanation.
- **Recommendation:** Keep reduced-motion and sound preferences separate. Honor explicit mute/volume controls and offer a separately labeled reduced-sensory setting if desired.
- **Suggested command:** `$impeccable clarify`

## Patterns and systemic issues

- Compact secondary UI repeatedly uses 11–13px text and sub-44px interaction heights. This is the main responsive/accessibility system gap.
- ARIA is used thoughtfully on icon buttons and landmarks, but composite widgets and dynamic timer values need complete interaction contracts, not labels alone.
- The timer tick currently sits at the application-state level, coupling the entire interface to a twice-per-second render cycle.
- The semantic palette is strong; raw colors mainly appear in alpha effects and elevation rather than primary text/surface pairs.
- Several labels overpromise their implemented state: outcome recovery actions do not navigate, “Done early” remains after overtime, and music-following behavior lacks a player-ready handshake.

## Positive findings

- Primary and muted text token pairs measured well above AA contrast: primary text ranges from 12.97:1 to 17.83:1 and muted text from 6.78:1 to 9.32:1 across the defined dark surfaces.
- Native buttons, inputs, labels, sections, headings, `main`, `aside`, and `dialog` elements are used instead of click handlers on generic containers.
- Icon-only controls have accessible labels, decorative Lucide icons are hidden from assistive technology, and focus-visible outlines are high contrast.
- Main controls are 44px high, layouts collapse at 980px and 720px, the timer uses tabular figures, and the page allows browser zoom.
- Motion is restrained and tied to timer state. A reduced-motion rule exists, although a future pass should replace the global `0.01ms` kill switch with intentional state-preserving alternatives.
- AI keys are session-memory only, the Buy Me a Coffee link is strictly validated, and the accountability feature explicitly avoids automatic charges, debt, or feature locks.
- The design-taste review found no generic landing-page structure, fake testimonials, decorative pricing, or interchangeable marketing copy. The dark control-room direction is consistent with the product brief.

## Recommended actions

1. **P1 — `$impeccable typeset`:** Raise mobile form and critical helper text to readable sizes and verify 200% zoom.
2. **P1 — `$impeccable clarify`:** Make completion and missed-deadline actions perform the recovery they promise.
3. **P1 — `$impeccable harden`:** Add complete timer/progress/task semantics, persist pledge state, and fix the music picker contracts.
4. **P2 — `$impeccable adapt`:** Normalize touch targets, dynamic viewport units, and safe-area behavior.
5. **P2 — `$impeccable optimize`:** Isolate timer renders and replace width animation with a transform.
6. **P2 — `$impeccable clarify`:** Connect errors/help to fields, use truthful overtime copy, and remove or implement the hard-coded streak.
7. **P3 — `$impeccable colorize`:** Extend semantic tokens to alpha fills, glows, gradients, and scrims.
8. **Final — `$impeccable polish`:** Recheck state feedback, focus order, text scaling, reduced motion, and visual consistency after functional fixes.

You can ask me to run these one at a time, all at once, or in any order you prefer.

Re-run `$impeccable audit` after fixes to see your score improve.

## Validation notes

- Passed: ESLint, TypeScript, production build, 34/34 automated tests, and `npm audit --omit=dev` with zero known vulnerabilities.
- The rendered production client comprises roughly 468 KB of uncompressed JavaScript and 20 KB of CSS before transfer compression; no performance budget is currently enforced.
- Browser automation was not available to this task, so 375px, landscape, 200% text zoom, keyboard traversal, and reduced-motion behavior remain manual release checks. Findings above are verified against source and deterministic tooling, not screenshots.
