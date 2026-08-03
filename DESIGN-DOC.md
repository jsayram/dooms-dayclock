# Doomsday Clock V2 design and architecture

Status snapshot: August 2, 2026

This document is the engineering handoff for V2. It describes the product that exists in this repository, the boundaries that protect user data, and the work still required before every optional integration can be called production-ready. The stable V1 project is separate and must remain untouched.

## System at a glance

```text
                                      DOOMSDAY CLOCK V2

  +--------------------------- Browser / user-controlled device ---------------------------+
  |                                                                                         |
  |  +------------------+       +----------------------+       +-------------------------+  |
  |  | Setup / planner  | ----> | Focus screen         | ----> | Outcome screen          |  |
  |  |                  |       |                      |       |                         |  |
  |  | - goal and tasks |       | - current task       |       | - finish / recover      |  |
  |  | - finish time    |       | - countdown          |       | - voluntary pledge link |  |
  |  | - AI draft       |       | - complete / pause   |       |   only when enabled     |  |
  |  +--------+---------+       | - add time / restart |       +------------+------------+  |
  |           |                 +----------+-----------+                    |               |
  |           v                            |                                v               |
  |  +------------------+                  v                   +-------------------------+  |
  |  | Settings         |       +----------------------+       | Buy Me a Coffee        |  |
  |  |                  |       | Timer domain engine  |       | creator page           |  |
  |  | - AI provider    |       | fixed finish line,   |       | voluntary external page |  |
  |  | - model picker   |       | weighted allocation, |       +-------------------------+  |
  |  | - session key    |       | early-time banking   |                                    |
  |  | - local LLM test |       +----------+-----------+       +-------------------------+  |
  |  | - auth status    |                  |                   | YouTube privacy embed   |  |
  |  +--------+---------+                  v                   | playback follows timer  |  |
  |           |                 +----------------------+       +-------------------------+  |
  |           |                 | localStorage         |                                    |
  |           |                 | guest timer only     |       +-------------------------+  |
  |           |                 +----------------------+       | Web Audio cues          |  |
  |           |                                                    local, optional       |  |
  +-----------|--------------------------------------------------------------------------+  |
              | HTTPS, exact origin, bounded JSON                                           
              v                                                                              
  +-------------------------- Cloudflare Worker / Next routes -----------------------------+
  |                                                                                         |
  |  +------------------------+    +----------------------+    +--------------------------+  |
  |  | Clerk session verifier |    | AI no-log relay      |    | Protected plan API       |  |
  |  | exact authorized party |    | fixed provider URLs  |    | owner from Clerk token   |  |
  |  +-----------+------------+    +----------+-----------+    +-------------+------------+  |
  |              |                            |                              |               |
  +--------------|----------------------------|------------------------------|---------------+
                 v                            v                              v
          +-------------+           +-------------------+             +-------------+
          | Clerk       |           | OpenAI / Anthropic|             | Cloudflare D1|
          | Google first|           | user-supplied key |             | saved plans  |
          +-------------+           +-------------------+             +-------------+

  Optional local path: Browser -> explicit fixed localhost endpoint -> Ollama or LM Studio
```

The timer does not depend on the server side of this diagram. Authentication, cloud storage, AI, music, and the pledge are optional. If any one of them fails, the active guest timer and local plan should stay intact.

## Product shape

Doomsday Clock is a deadline-first focus tool for people who are stuck, overwhelmed, or prone to time blindness. It is not a medical product. The interface keeps one task, one timer, and one primary action at the center. Optional tools live in secondary panels so setup does not become another form of procrastination.

The main screens are:

1. **Planner:** name the sprint, choose the finish time, edit task names and details, and assign relative minute weights. A connected AI provider can draft an editable plan from a plain-language goal.
2. **Focus:** show the current task, its allocated countdown, the fixed finish line, overall progress, and controls to start, pause, complete, restart, or add five minutes.
3. **Outcome:** acknowledge completion or a missed finish line without blame. Offer a recovery action. If the user deliberately created a pledge and the production gate is enabled, an external payment link can appear as a secondary choice.
4. **Settings:** connect an AI provider, discover models, choose a model, test a local model endpoint, and show whether Clerk configuration is present.

The initial plan contains the Puerto Rico preparation and cleaning tasks from the original use case. Applying an edited plan starts its scheduling window at the current time and divides the interval from now to the chosen finish time. V2 currently exposes an editable finish time; it does not yet expose a separate scheduled future start time.

The application metadata includes a generated `public/og.png` social card with Open Graph and large Twitter-card declarations. It is a sharing asset only and does not load a third-party image service at runtime.

## Technical stack

| Layer | Technology | Reason |
| --- | --- | --- |
| Application framework | Next.js 16 App Router through vinext | Typed React application with route handlers that can build for Cloudflare Workers |
| Language | TypeScript 5.9 | Shared types and validation across UI, timer, integrations, and server routes |
| UI | React 19, Tailwind CSS 4, shadcn/ui Base Nova with Base UI, project CSS, Lucide icons | Accessible source-owned primitives with a product-specific midnight and amber theme |
| Runtime and build | Vite 8, vinext, Cloudflare Vite plugin, Wrangler | Produces a Cloudflare Worker-compatible full-stack artifact |
| Validation | Zod | Strict request and provider-response schemas at server boundaries |
| Authentication | Clerk React and Clerk Backend SDK | Google is configured in Clerk first; additional Clerk-supported providers can be added later |
| Durable storage | Cloudflare D1, with Drizzle schema metadata | Fits the Worker runtime and avoids adding another vendor and connection pool |
| Guest storage | Browser `localStorage` | Keeps the timer useful without an account or database |
| Audio feedback | Web Audio API | Small local sound cues without another media service or downloaded asset |
| Music | YouTube privacy-enhanced iframe and IFrame commands | Public video or playlist playback without handling a Google credential |
| AI | OpenAI Responses API, Anthropic Messages API, Ollama, LM Studio | Cloud BYOK and explicit local-model paths behind one provider interface |
| Testing | Node test runner plus build-time rendered HTML tests | Deterministic domain and trust-boundary coverage without a heavy unit-test framework |

Supabase is not needed for this version. D1 is the better fit because the full-stack deployment already runs on Cloudflare and only signed-in saved plans need durable storage. Guest sessions need no database. Revisit Supabase only if the product later needs capabilities that D1 does not provide, such as a broader relational backend shared by multiple non-Cloudflare services. Do not run two databases for the same plan data.

## Repository boundaries

```text
app/
  components/                  Screens and focused UI sections
  contexts/AiConnection.tsx   Session-only provider and model state
  hooks/useFocusSession.ts    React bridge to timer and guest persistence
  api/ai/                     Cloud AI relay routes
  api/plans/                  Clerk-protected D1 plan routes
  lib/server/                 Auth, request, and plan persistence boundaries

lib/
  timer/                      Pure timer allocation and state transitions
  integrations/               AI, music, credential, and pledge contracts
  server/                     Cloud AI relay and request security helpers

db/                           D1 binding, schema, and migrations
worker/                       Cloudflare Worker entry point
tests/                        Domain, integration, AI, auth, and render tests
```

`components/ui/` contains shadcn primitives owned by this repository. `components.json` is the shadcn configuration source of truth. Existing timer-specific CSS remains in `app/styles/`; migrate controls gradually when a requested feature touches them rather than rewriting the entire interface at once.

Keep source modules small and give each trust boundary one owner. The timer domain must remain independent of React and external services. Provider-specific behavior belongs behind an adapter, not inside the timer hook.

## Guest and signed-in flows

### Guest flow

1. The app creates the default task list and a 7:00 PM finish line for today, or the following day if 7:00 PM has passed.
2. The user can edit the title, finish time, task text, and relative weights.
3. The timer state, task details, title, and sound preference are serialized to one versioned browser-storage record.
4. On refresh, the record is parsed and validated before use. Corrupt or incompatible data is discarded rather than trusted.
5. The timer continues without Clerk, D1, AI, music, or a payment provider.

Guest task content never needs to leave the device. The current UI does send a goal to a provider only when the user presses the AI draft action, and it contacts YouTube only after the user loads a public link.

### Signed-in cloud-plan flow

The header exposes a Clerk modal sign-in and user menu when a publishable key is configured. It names Google as the first sign-in path. Signed-in users also receive a Cloud plans card that can save the current plan, refresh their plan list, and load a saved plan. Guest recovery remains independent and device-only.

The intended flow is:

1. `ClerkProvider` activates only when a publishable key is configured.
2. The header shows **Sign in with Google** to signed-out users and Clerk's user control after sign-in. Without Clerk configuration it remains in guest mode.
3. Google is enabled as a social connection in the Clerk dashboard. Google client secrets stay in Clerk and Google dashboards, not in this repository.
4. A protected plan request reaches the Worker with a Clerk session.
5. The server verifies the request with Clerk and checks an exact `authorizedParties` origin allowlist.
6. The server derives the owner ID from the verified session. It never accepts an owner ID from the request body.
7. Every D1 query includes that owner ID, including reads, updates, and deletes.

### Clerk runtime compatibility decision

The deployed architecture is Next.js App Router source compiled by vinext for a Cloudflare Worker. A direct migration to `@clerk/nextjs` 7.6.4 with `clerkMiddleware()` was tested on 2026-08-02: the production compilation completed, but the live development runtime failed because server-only `node:async_hooks` code entered the browser bundle and Clerk's React context was evaluated in the RSC environment. The page returned HTTP 500.

V2 therefore keeps `@clerk/react` at the client boundary and `@clerk/backend` for explicit server-side request verification with exact authorized-party origins. This is not a legacy Pages Router choice; it is a vinext compatibility boundary. Move to `@clerk/nextjs`, `proxy.ts`, and `auth()` only after the target runtime can pass both a live-page test and cross-user API authorization tests.

The API supports list, create, read, update, and delete for saved plans. It limits each user to 100 plans and validates titles, tasks, IDs, timestamps, lengths, and task counts. The current client exposes create, list, refresh, and load. Before cloud plans are released broadly, add update/delete controls, explicit guest import confirmation, export, account deletion, and end-to-end cross-user authorization tests.

## Timer allocation and time banking

The timer uses an absolute finish timestamp. Pausing freezes elapsed time on the current task, but it does not move the overall finish line.

At plan creation:

```text
available time = finish timestamp - start timestamp
task share     = available time * task weight / sum of unfinished weights
```

Allocation uses integer milliseconds and a deterministic largest-remainder pass, so every millisecond is assigned and the sum exactly matches the available window.

When a task is completed, the engine:

1. records its completion timestamp;
2. keeps the original finish timestamp unchanged;
3. calculates the wall-clock time left until that finish line;
4. redistributes that remaining time across unfinished tasks by their existing weights; and
5. moves to the next unfinished task without stopping an already-running sprint.

This is the time bank. Finishing early gives later tasks more time. Finishing late gives them less. If the finish line has passed, remaining allocations clamp to zero while task overtime and goal overtime remain separate states.

"Add time" gives the active task up to five more minutes from the remaining window and proportionally reduces future unfinished tasks. It cannot move the finish line. Restart resets elapsed time for the active task only. Completing the final task moves the state to a stable completed state.

## AI task creation

### Cloud providers

OpenAI and Anthropic are connected through same-origin server routes. The browser holds the user's key in a `SessionCredentialStore` instance. The key is not serialized by that store and disappears on refresh or tab close. The request relay receives it only for the active provider call, uses a fixed upstream URL, and does not deliberately log request bodies or credentials.

The model flow is:

```text
Settings -> enter session key -> POST /api/ai/models -> choose returned model
Planner  -> enter goal        -> POST /api/ai/plan   -> validate JSON -> editable tasks
```

The OpenAI route uses the Responses API with `store: false` and a strict JSON schema. The Anthropic route forces a structured tool result. Both paths bound request and response sizes, use a timeout, reject redirects, map provider errors to safe codes, and validate the returned plan before the UI renders it as text.

The relay accepts only exact origins from `AI_ALLOWED_ORIGINS`. Its in-memory per-isolate rate limiter is a useful first layer, not a production-wide control. A distributed Cloudflare rate-limit rule is still required before public release.

The optional app-owned `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` configuration entries are reserved for a future server-owned plan service. The current UI flow is BYOK and sends the session-only key with the explicit relay request. Do not claim that app-owned AI is implemented until a separate authenticated path and spend controls exist.

### Local providers

Ollama and LM Studio connect directly from the browser after the user presses **Test connection**. The current registry allows only fixed loopback endpoints:

- Ollama: `http://127.0.0.1:11434` or `http://localhost:11434`
- LM Studio: `http://127.0.0.1:1234/v1` or `http://localhost:1234/v1`

The app does not scan ports or private networks. Browser CORS rules and HTTPS mixed-content rules can block these connections on a hosted page. A future custom endpoint field must retain strict URL validation, block credentials and metadata services, and never proxy a private address through the hosted server without an explicit secure-tunnel design.

## Music and sound

YouTube is the first live adapter. The user pastes a public HTTPS video or playlist URL, the parser rejects lookalike hosts and unsafe schemes, and the privacy-enhanced player loads only after an explicit button press. IFrame commands request play while the timer runs and pause when it stops. Browser autoplay rules, disabled embedding, and provider errors must not affect the timer.

Before calling YouTube playback production-ready, verify the exact page origin in the IFrame Player configuration, autoplay recovery, visibility and minimum player size, keyboard use, mobile playback, and privacy notice on the deployed origin.

Spotify and Apple Music are descriptors and unavailable UI states only:

- Spotify still needs an approved OAuth setup, exact redirect URIs, token lifecycle handling, Premium playback testing, and any required extended-quota approval.
- Apple Music still needs Apple Developer and MusicKit configuration, server-signed short-lived developer tokens, consent, and subscription-capability testing.

Do not label either adapter as working until real playback and provider-policy review are complete.

Timer sounds are generated locally through Web Audio. Countdown cues occur only at selected thresholds, completion has a short two-note reward, and whole-sprint completion has a distinct three-note cue. Sounds can be muted, do not loop, and have visible state alongside them. The current helper also suppresses cues for reduced-motion users; evaluate whether a separate reduced-audio preference would be clearer before release.

## Voluntary accountability pledge

This feature is a personal accountability prompt, not a wager. The user can choose a whole-dollar amount from $1 through $5 and must acknowledge that it is voluntary. The amount has no effect on access, timer behavior, XP, streaks, or completion.

The app must never:

- collect card or bank details;
- store a payment method;
- charge automatically or retry a charge;
- create a debt, balance, invoice, prize, or entry fee;
- shame the user or make declining difficult; or
- send the pledge amount anywhere before the user deliberately opens an external provider page.

The current UI holds an active pledge in React session state. The integration layer accepts only a strict `https://buymeacoffee.com/{creator}` page, and every outcome states `paymentDue: false`. The external destination renders only when `NEXT_PUBLIC_BUYMEACOFFEE_URL` contains a valid creator page.

Review current Buy Me a Coffee rules and applicable requirements before configuring the production link. The app contains no provider credentials, widget script, webhooks, checkout creation, or payment tracking. If local pledge persistence is added, store only the amount and voluntary state, never payment data.

## Data and privacy map

| Data | Destination | Persistence | Notes |
| --- | --- | --- | --- |
| Guest timer, tasks, title, sound preference | Browser | `localStorage` | Versioned and validated; no server required |
| Cloud plan | D1 | Durable, signed-in only | Owner comes from verified Clerk session |
| Clerk session | Clerk-supported browser/session mechanism | Managed by Clerk | Never copy tokens into URLs or browser storage |
| OpenAI or Anthropic BYOK key | Browser memory, then selected provider through relay | None by application design | Never log, cache, store, or place in environment files |
| AI goal and returned task draft | Selected provider and active browser view | Not intentionally persisted by relay | OpenAI request sets `store: false`; provider terms still apply |
| Local LLM goal | Explicit loopback endpoint | Provider-dependent | No discovery or hosted proxy |
| Public YouTube URL and playback | YouTube embed | Provider-dependent | Connection begins only after Load |
| Pledge amount | Current browser UI state | Session state today | No payment or debt record |
| Saved-plan owner ID | D1 | With the cloud plan | Used for authorization, not supplied by client |

No analytics, advertising, subscription, public profile, or behavioral tracking service is part of V2.

## Security controls and remaining release work

Controls already represented in code include:

- strict Zod schemas and bounded JSON bodies;
- fixed AI provider endpoints and redirect rejection;
- exact-origin CORS for AI routes;
- `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` on JSON responses;
- Clerk verification with exact authorized parties;
- server-derived plan ownership on every D1 query;
- same-origin checks on state-changing cloud-plan requests;
- memory-only cloud AI credentials;
- allowlisted YouTube and payment URLs;
- redacted error responses that do not return stack traces or provider bodies;
- a Worker-level Content Security Policy covering the current Clerk, Google, YouTube, AI, and voluntary-payment destinations; and
- Worker-level referrer, permissions, MIME-sniffing, framing, opener, and HTTPS transport headers on application and image responses.

The following items remain release gates:

1. Verify the Worker security headers on the deployed origin, including Clerk sign-in, Google popups, the YouTube player, local-model development, and optional external payment navigation. Tighten `unsafe-inline` directives when the runtime can support nonces or hashes.
2. Configure distributed rate limiting for AI, auth-sensitive, and plan-write routes.
3. Complete account export, plan export, deletion, retention, and guest-import behavior before calling cloud accounts production-ready.
4. Test expired sessions, sign-out, cross-user IDs, CSRF attempts, CORS failures, open redirects, and safe error redaction on the deployed runtime.
5. Keep the zero-vulnerability dependency baseline under review as new advisories and package releases appear. Do not force breaking upgrades merely to silence a report.
6. Search tracked files and built artifacts for real secrets, `.env` files, `.p8` keys, source maps, debug routes, and deployment metadata.
7. Document subprocessors and data locations. Do not claim GDPR, SOC 2, HIPAA, or end-to-end-encryption status without evidence.

## Configuration overview

The reviewed template is `.env.example`; detailed setup and credential instructions are in `SETUP.md`. Real local values belong in ignored `.env.local` or the relevant hosting secret store.

| Group | Configuration |
| --- | --- |
| Origins | `NEXT_PUBLIC_APP_URL`, `APP_ORIGIN`, `ALLOWED_ORIGINS`, `AI_ALLOWED_ORIGINS` |
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, optional webhook signing secret |
| Cloudflare and D1 | account ID, D1 database ID, `CLOUDFLARE_D1_BINDING_NAME`, narrow deployment token |
| here.now publishing | `HERENOW_API_KEY`, preferably stored in `~/.herenow/credentials` instead |
| AI | optional server-owned OpenAI and Anthropic keys; end-user BYOK keys never belong in an environment file |
| Music | optional future YouTube Data, Spotify, and Apple Music configuration; no credential is required for the public YouTube embed |
| Accountability | public `NEXT_PUBLIC_BUYMEACOFFEE_URL`; no payment secret |
| Abuse control | optional Turnstile public site key and server secret |

Only values deliberately prefixed `NEXT_PUBLIC_` can be treated as public. A public prefix is not a way to make a secret available to the browser. Google OAuth secrets stay in Clerk and Google dashboards. Apple `.p8` material, Clerk secret keys, provider secrets, deployment tokens, and here.now credentials stay out of client code and source control.

## Deployment model

The current repository is a full-stack Worker application, not a standalone static HTML file. Its protected plan routes, D1 binding, Clerk verification, and AI relay require server execution.

### Recommended full V2 deployment

Deploy the vinext build as one Cloudflare Worker application with its static assets and D1 binding. Configure Clerk, exact production origins, server secrets, security headers, and distributed rate limits at that runtime. This is the shortest path to a coherent, same-origin security model.

### here.now reality

here.now can host a static frontend, but static hosting alone cannot execute the Next route handlers, verify Clerk sessions, relay AI calls, or bind D1. Publishing this project as static files without another backend would leave guest timer features only and break the server-dependent features.

If here.now remains a firm requirement, use a split deployment:

```text
here.now static frontend
        |
        | HTTPS to one exact configured API origin
        v
Cloudflare Worker API -> Clerk / D1 / OpenAI / Anthropic
```

That split is not wired in the current client. It requires a reviewed public API-base configuration, exact credentialed CORS, Clerk token forwarding, separate frontend and API CSP rules, and deployment tests on both origins. Do not point the browser directly at D1 or move secrets into the here.now bundle to avoid this work.

Publishing and changing access policy remain separate actions. Review the exact artifact and get explicit authorization before either action. An authenticated here.now site does not use the anonymous 24-hour expiry, but access still depends on the selected here.now policy and account state.

## Testing strategy and current status

The repository contains deterministic tests for:

- proportional allocation, pause/resume, early completion, overtime, restoration, and sound suppression;
- YouTube URL parsing and endpoint allowlists;
- memory-only credential serialization behavior;
- voluntary pledge amounts, acknowledgment, safe destinations, and no-debt outcomes;
- AI schemas, exact origins, size bounds, fixed provider URLs, OpenAI `store: false`, and malformed provider output; and
- plan validation, exact authorized parties, server-derived ownership, and owner-bound queries.

The rendered-product tests now assert the Doomsday Clock identity and accessible timer controls, reject disposable starter assets, inspect the production bundle for environment files and recognizable secret patterns, and check the pledge's voluntary language. The default `npm test` command builds the production artifact and runs every `tests/*.test.mjs` file.

The current package audit reports zero known vulnerabilities across production and development dependencies. That is a point-in-time result, not a permanent security guarantee.

Every release candidate must run:

```bash
npm run lint
npm test
npm run build
```

It also needs browser coverage for a guest refresh, keyboard-only operation, screen-reader names and announcements, reduced motion, sound mute, 320-pixel phone layout, landscape layout, and 200 percent zoom. Test invalid and cross-midnight deadlines, a missed goal, blocked YouTube autoplay, failed AI and auth requests, sign-out, and attempts to read another user's plan. Record exact results rather than marking a checklist complete from code inspection.

## Implementation ledger

| Capability | State in this repository |
| --- | --- |
| Guest timer and default preparation plan | Implemented |
| Editable finish time, task text, details, and weights | Implemented |
| Weighted allocation, pause/resume, restart, complete, add time, overtime | Implemented |
| Early-finish redistribution without moving the finish line | Implemented |
| Guest refresh persistence | Implemented in browser storage; browser QA still required |
| Local countdown and reward sounds | Implemented; real-browser audio QA still required |
| Gamified responsive interface | Implemented; accessibility and device QA still required |
| Generated Open Graph social card | Implemented as `public/og.png` and wired into page metadata |
| AI planner UI | Implemented; generated plans remain editable before applying |
| OpenAI and Anthropic BYOK relay and model picker | Implemented in code; provider and deployment QA required |
| Ollama and LM Studio fixed local connection | Implemented in code; CORS and mixed-content limitations apply |
| YouTube public embed | Implemented in code; autoplay and production-origin QA required |
| Spotify playback | Planned descriptor only, not implemented |
| Apple Music playback | Planned descriptor only, not implemented |
| Clerk server verification | Implemented for protected plan routes |
| Google sign-in user journey | Visible Clerk sign-in and user controls are implemented when configured; production OAuth QA is still required |
| D1 saved-plan API | Implemented with client save, refresh, and load; update/delete/export and full lifecycle are not complete |
| Supabase | Not used and not needed for the current architecture |
| Voluntary $1 to $5 pledge UI | Implemented as session state with strict non-coercive wording |
| Buy Me a Coffee support link | Implemented when a valid public creator URL is configured; all payment handling stays on Buy Me a Coffee |
| here.now full-stack deployment | Not supported by static hosting alone; split deployment is not yet wired |
| Site-wide Worker security headers | Implemented in code; deployment verification and CSP tightening remain |
| Distributed production rate limits | Not yet configured |
| Dependency audit | Zero known vulnerabilities at this snapshot |

## Maintenance roadmap

Work in this order so optional integrations do not destabilize the focus tool:

1. Complete browser QA for the production build, including phone, zoom, keyboard, audio, restore, and failure-isolation cases.
2. Verify Worker security headers on the production origins, finish exact-origin configuration, add distributed rate limits, and repeat artifact secret scanning.
3. Extend the existing cloud save/load UI with explicit guest import, update, export, deletion, and cross-user browser tests.
4. Choose one deployment shape. Prefer a single Cloudflare Worker. If here.now is required, build and test the explicit two-origin frontend/API architecture.
5. Verify OpenAI, Anthropic, Ollama, LM Studio, and YouTube against real configured environments while preserving failure isolation.
6. Complete the legal/provider review before enabling any voluntary payment destination.
7. Implement Spotify or Apple Music only when the corresponding account, subscription, OAuth, token, privacy, and provider-approval requirements can be tested end to end.

New work should preserve the core rule: a person can open the app, make a plan, and run the timer without an account, a provider key, a music subscription, or a payment.
