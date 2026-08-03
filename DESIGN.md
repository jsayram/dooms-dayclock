# Design direction

## Experience goal

The interface should feel like a focused control room at the edge of a deadline: dark, warm, energetic, and calm enough to use under pressure. Game feedback marks progress, but the timer remains the visual center.

## Visual language

- Use a deep charcoal or midnight base with warm amber, coral, and electric mint accents.
- Reserve the brightest accent for the current primary action.
- Use large, tabular numerals for time so the countdown does not shift as digits change.
- Keep surfaces simple, with clear elevation and restrained glow. Avoid glass effects that reduce contrast.
- Use rounded geometry for controls and progress markers, balanced by a precise timeline or progress rail.
- Icons support labels; they do not replace them.

Color tokens must be semantic (`surface`, `text`, `accent`, `warning`, `success`, `danger`, `focus`) and meet the contrast rules in `UI-STANDARDS.md`. Do not hard-code provider brand colors as general UI tokens.

## Page structure

### Setup mode

The first screen asks for only what is needed to begin:

1. outcome or plan name;
2. finish time;
3. tasks, entered manually or drafted with AI;
4. a primary "Start sprint" action.

Music, sign-in, provider keys, and advanced timing choices live in optional panels. They must not compete with the start action.

### Focus mode

Focus mode uses this visual order:

1. current task;
2. countdown and finish line;
3. complete-task action;
4. pause and small timing controls;
5. compact progress and optional music controls.

The next task may be previewed, but it should not look actionable until the current task is complete or skipped.

### Completion mode

Completion shows a short, sincere acknowledgement, what was finished, and any time banked. Use a brief animation and reward sound only when allowed by user settings. The next action is either "Plan another sprint" or "Keep going," based on remaining work. If the user set an accountability pledge, completion confirms that no payment is expected. A separate optional tip may appear without visual pressure.

If the finish line is missed, use warm copy such as "That one got away from you. Your work is still here." The user may rebalance the plan, end the sprint, or voluntarily open the payment option they selected. The payment action must remain visually secondary and must not imply a debt.

## Gamification

Use game mechanics to clarify momentum:

- a visible progress path for completed tasks;
- a small time-bank meter when minutes are earned;
- short completion pulses and sound cues;
- optional session streaks stored locally or in the signed-in account;
- neutral recovery language when time runs out.

Do not use shame, loss framing, fake scarcity, variable-reward loops, public ranking, or celebratory motion that blocks the next action. A missed estimate should offer "Rebalance plan" rather than imply failure.

An accountability pledge is always described as optional and voluntary. Never describe it as a wager, bet, punishment, entry fee, or amount owed. Do not use countdown pressure, red debt styling, repeated prompts, or confirmation patterns designed to make declining difficult.

## Motion

- Motion should explain a state change: task completion, time redistribution, opening a panel, or moving to the next task.
- Keep routine transitions between 120 and 240 ms. A completion celebration may run up to 900 ms but must never delay input.
- Avoid continuous background motion. Urgency may use a slow, limited pulse near the final threshold.
- Never flash more than three times per second.
- Respect `prefers-reduced-motion` by removing nonessential movement and using opacity or instant state changes.
- Animations must remain correct after pause, resume, page visibility changes, and restored state.

## Sound

Sound is off until the user starts a session or explicitly previews a cue, satisfying browser autoplay rules. Provide independent volume and mute controls.

- Use gentle cues at configurable remaining-time thresholds.
- Use a distinct, rewarding completion cue when a task finishes early.
- Do not loop alarms indefinitely.
- Pair every sound with a visible state change and accessible text.
- Duck or avoid competing cues while connected music is playing.

## Responsive behavior

Design phone-first at 320 CSS pixels and up. The timer, task name, and complete button must fit without horizontal scrolling. On wider screens, optional panels may sit beside the focus surface, but the visual hierarchy must stay the same.

Use safe-area insets for mobile browser chrome. Avoid controls that depend on hover. Test zoom to 200 percent and landscape phone layouts.

## User-facing language

Write in plain, specific language. Prefer "Finish by," "Current task," "Time banked," and "Rebalance plan." Avoid productivity jargon, scolding, exaggerated praise, and fake urgency. Errors should explain what happened, preserve the user's work, and offer one recovery action.
