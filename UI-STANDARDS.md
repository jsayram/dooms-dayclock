# UI standards

## Component system

- shadcn/ui is the default component source. `components.json` records the Base Nova style, Base UI primitives, Tailwind v4, Lucide icons, and project aliases.
- Search and inspect official registry components before writing a new control. Add only the components needed by the requested feature, then review the generated source because it becomes project-owned code.
- Use shadcn composition patterns for fields, dialogs, tabs, toggle groups, progress, alerts, empty states, and feedback. Do not wrap a raw element in custom styles when the installed component already covers the behavior.
- Keep colors semantic and mapped to the midnight, amber, mint, violet, and coral Doomsday tokens in `app/globals.css`. Do not apply a neutral preset over the product palette.
- Library defaults do not waive this project's accessibility rules. Expand buttons, tabs, and other touch controls to at least 44 by 44 CSS pixels.
- Migrate existing controls gradually when a requested change touches them. Do not rewrite the stable timer UI solely to increase shadcn usage.

## Accessibility baseline

Meet WCAG 2.2 AA for all user journeys.

- Use semantic HTML before ARIA.
- Every control has an accessible name and visible label where practical.
- All actions work with keyboard only. Focus order follows the visual order.
- Show a high-contrast `:focus-visible` indicator that is not hidden by sticky content.
- Touch targets are at least 44 by 44 CSS pixels with enough spacing to prevent accidental activation.
- Normal text contrast is at least 4.5:1; large text and essential graphical objects are at least 3:1.
- Never use color, sound, position, or motion as the only way to convey status.
- Support text resize and browser zoom to 200 percent without lost content or function.
- Use live regions sparingly for task changes, timer milestones, and recoverable errors. Do not announce every second.
- Dialogs trap focus, close with Escape when safe, have a labelled title, and return focus to the trigger.

## Timer behavior

- Use a monotonic elapsed-time calculation instead of decrementing a counter once per second.
- Derive the display from timestamps so sleep, throttling, and hidden tabs do not create drift.
- Persist only the state needed to reconstruct the session. Validate and version persisted data before use.
- Display the finish line with its date when it crosses midnight.
- Require confirmation before destructive reset or replacement of an active plan.
- Preserve the active plan when optional integrations fail.

## Forms and settings

- Labels remain visible after a value is entered; placeholders are examples, not labels.
- Validate close to the field and summarize submission errors when more than one field fails.
- Do not disable the main action without explaining why.
- Provider settings state what data leaves the device and whether credentials persist.
- Secret fields use password inputs, support paste and password managers, and provide an intentional show/hide control.
- A model picker shows only models returned by or configured for the selected provider. An unavailable model does not silently fall back to a different one.
- Local LLM setup requires an explicit endpoint and a user-triggered "Test connection" action.

## Status and feedback

- Use stable labels: `Not started`, `Running`, `Paused`, `Complete`, `Overtime`, and `Connection unavailable`.
- Toasts are supplemental. Important failures remain visible near the affected control.
- Loading indicators identify the pending action and do not replace existing content if it can remain useful.
- Optimistic updates must be reversible and must not claim cloud sync before the server confirms it.
- Completion feedback never steals focus.

## Accountability pledge

- Label the feature "Optional accountability pledge" or "Optional accountability stake." Do not use gambling, wagering, betting, debt, or penalty language.
- Allow only whole-dollar choices from $1 through $5 and store the selection locally.
- Before the user opts in, state that Doomsday Clock will not charge them, store a payment method, create a debt, or limit features.
- Do not collect payment details in the app. After the sprint outcome, a secondary action may open the configured Buy Me a Coffee creator page.
- A completed sprint says that no payment is expected. An optional tip, if offered, is separate and clearly voluntary.
- A missed sprint uses warm recovery copy and keeps all controls available. Closing, declining, or ignoring the payment action requires no explanation and causes no repeated prompt.
- Provider links must identify the destination before navigation and use safe external-link behavior.

## Animation and media

- Follow the motion and sound constraints in `DESIGN.md`.
- Pause decorative animation when the page is hidden.
- Captions or text equivalents are required for instructional media.
- Music embeds have a clear play/pause state, provider label, and fallback when embedding is blocked.
- Autoplay must never be required for the timer to work.

## Responsive quality gates

Verify the core flow at:

- 320 x 568;
- 390 x 844;
- 768 x 1024;
- 1280 x 800.

Also verify keyboard navigation, 200 percent zoom, reduced motion, high contrast, muted audio, a slow network, offline reload of local state, and a session that crosses midnight.

## Copy standards

User-facing text is short, direct, and humane. Use sentence case. Buttons name the action they perform. Avoid blame, cutesy language during errors, unexplained acronyms, and claims that an integration is secure or private without describing the relevant behavior.
