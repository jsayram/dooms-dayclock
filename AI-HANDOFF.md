# Doomsday Clock V2 AI handoff

Read this file first. Continue the project in `<project-root>`. Do not create another app, replace this repository, or modify the stable V1 project at `<project-root>/../Doomsday-Countdown`.

## What this project is

Doomsday Clock turns a finish time into one current task and a countdown. It is designed for people who procrastinate, experience time blindness, or get overwhelmed by project-management interfaces. The core timer must remain useful without an account, AI connection, music service, payment, or network access after the page has loaded.

The visual direction is a dark deadline control room: midnight surfaces, amber focus actions, mint success, violet focus, coral warnings, large tabular timer figures, restrained motion, and warm recovery language.

## Read order

1. `PRODUCT.md`
2. `DESIGN.md`
3. `UI-STANDARDS.md`
4. `SECURITY.md`
5. `DESIGN-DOC.md`
6. `SETUP.md`
7. `AUDIT.md`
8. `AGENTS.md`

These documents are the product and security contract. Do not implement roadmap ideas unless the user requests them.

## Current stack

```text
Next.js App Router source + TypeScript
              |
              v
vinext + Vite + Cloudflare Worker runtime
              |
       +------+------+
       |             |
 guest/local     signed-in cloud plans
 localStorage    Clerk + owner-scoped D1

UI: Tailwind CSS v4 + shadcn/ui Base Nova + Base UI + Lucide
AI: session-only OpenAI/Anthropic BYOK, explicit Ollama/LM Studio
Music: explicit-load YouTube; Spotify and Apple Music remain gated
Support: optional Buy Me a Coffee link after a voluntary $1-$5 pledge
```

The package manager is npm. The app uses React 19, Next.js 16 source conventions, vinext, Drizzle, Zod, Clerk React/backend packages, and Cloudflare-compatible bindings.

## What works now

- The default Puerto Rico preparation plan finishes at the next 7:00 PM.
- A user can edit the sprint name, finish time, tasks, details, and relative weights.
- Available time is distributed across unfinished tasks without moving the finish line.
- Start, pause, resume, restart, add five minutes, complete, overtime, time banking, and final outcomes work.
- Guest progress and sound preference persist in validated, versioned browser storage.
- YouTube videos and playlists load only after explicit user action.
- OpenAI and Anthropic keys stay in memory for the current tab. Local model connections require a user-triggered test.
- Clerk-backed Google sign-in and owner-scoped D1 routes are implemented but require environment configuration and live account testing.
- The accountability pledge is voluntary, local, and never charges automatically. The configured external destination is `https://buymeacoffee.com/jsayram`.
- The site has responsive dark UI, keyboard labels, reduced-motion behavior, security headers, setup/security documentation, and an automated test suite.

## shadcn decision

shadcn/ui is now the default component library for new or touched UI. `components.json` uses the `base-nova` style, Base UI primitives, Tailwind v4, Lucide, and `@/components/ui` aliases. The official shadcn skill is installed for Codex.

At the start of shadcn work, run:

```bash
npx shadcn@latest info --json
npx shadcn@latest docs <component-name>
```

Use installed primitives before custom markup. Preserve the Doomsday semantic tokens in `app/globals.css`; do not reapply a neutral preset over them. Library defaults smaller than 44px must be enlarged for this product. Migrate existing controls only when a requested change touches them. The first migrated primitive is the timer's accessible `Progress` component. `Button` is installed as the base action primitive for future work.

## Clerk compatibility boundary

Do not run Clerk scaffolding blindly. `@clerk/nextjs` 7.6.4 plus `clerkMiddleware()` was tested on 2026-08-02. The production build completed, but the current vinext development runtime put server-only `node:async_hooks` code into the browser and returned HTTP 500.

The working architecture therefore uses:

- `@clerk/react` for `ClerkProvider`, UI controls, and browser hooks;
- `@clerk/backend` for server request verification;
- exact `CLERK_AUTHORIZED_PARTIES` validation; and
- a server-derived Clerk user ID in every D1 query.

Revisit `@clerk/nextjs`, `proxy.ts`, and `auth()` only after a vinext compatibility update or an authorized move to the official Next.js runtime. A build alone is not proof. Test the live page and cross-user route isolation.

## Secrets and environment rules

Never display, quote, commit, upload, or copy the contents of `.env` or `.env.local`. Both are ignored. `.env.example` contains blank placeholders and is the only environment template that belongs in source control.

- `NEXT_PUBLIC_*` values are public browser configuration, not secrets.
- Clerk secret keys, AI provider keys owned by the app, Cloudflare tokens, and publishing keys stay server-side.
- User-provided OpenAI and Anthropic keys stay in session memory only.
- Do not publish or deploy without an explicit user request for that action.
- Do not place a key in documentation, tests, screenshots, bundles, logs, or the downloadable ZIP.

## Known work, in priority order

`AUDIT.md` is the full report. The most important verified issues are:

1. Outcome buttons say "Plan another sprint" and "Rebalance my plan" but currently only close the dialog.
2. Mobile form text is too small and may trigger browser zoom.
3. Timer semantics improved through shadcn `Progress`; the countdown itself still needs a deliberate, non-chatty screen-reader contract.
4. The optional pledge should persist with the local sprint.
5. Music tabs need a complete tabs pattern or a shadcn `ToggleGroup` implementation.
6. Several secondary controls are smaller than the 44px project standard.
7. The dashboard rerenders every 500ms because ticking state lives at the app level.
8. The hard-coded one-day streak must become real persisted data or be removed.
9. Spotify, Apple Music, production Clerk, D1 hosting, and local-model browser access still require real provider/environment testing.

## Work rules

- Make the smallest coherent change requested by the user.
- Preserve guest focus behavior and existing task data across optional-integration failures.
- Validate all browser, storage, request, provider, and model data at its trust boundary.
- Keep one current task, one obvious timer, and one primary action visually dominant.
- Use warm recovery language. Do not add shame, gambling language, fake scarcity, automatic payments, tracking, ads, subscriptions, or public rankings.
- Update documentation when a material product, security, hosting, or compatibility decision changes.
- Do not commit, push, publish, create provider resources, or change access permissions without explicit authorization.

## Validation

From the project root:

```bash
npm install
npm run lint
npm run typecheck
npm test
```

Also verify the live local page, guest refresh recovery, finish times after midnight, keyboard use, 200 percent zoom, reduced motion, phone layout, optional-integration failures, and secret exclusion. Do not claim browser, provider, account, or deployment testing unless it actually happened.

The downloadable handoff package is `<project-root>/../dooms-dayclock-v2.zip`. Rebuild it after material changes while excluding `.git`, `.env`, `.env.local`, `node_modules`, build output, and local Cloudflare state.
