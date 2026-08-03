# Doomsday Clock V2

Doomsday Clock turns a hard finish time into one clear task at a time. The guest timer works immediately and keeps its plan on the device. Accounts, cloud saving, AI planning, music, and the voluntary accountability pledge are optional layers.

## Run it locally

Use Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. No environment values are required for guest mode.

## What works

- An editable deadline and weighted task list, proportionally distributed from now to the finish line
- Pause, resume, restart, add five minutes, complete early, time banking, overtime, and finish feedback
- Device-only guest recovery through local storage
- Optional timer sounds with reduced-motion support
- Explicit-load YouTube video and playlist playback that follows the timer
- Session-only OpenAI or Anthropic keys and explicit local Ollama or LM Studio connections
- Google sign-in through Clerk when configured
- Owner-scoped D1 plan routes for signed-in users
- A voluntary $1–$5 accountability pledge that never charges, creates debt, or limits access

Spotify, Apple Music, and external pledge links remain visibly gated until their provider, policy, and account requirements are configured and reviewed.

## Documentation

- [AI-HANDOFF.md](./AI-HANDOFF.md) — current state and continuation instructions for another AI
- [SETUP.md](./SETUP.md) — every environment value and provider setup
- [DESIGN-DOC.md](./DESIGN-DOC.md) — architecture, flows, screens, and system boundaries
- [SECURITY.md](./SECURITY.md) — threat model and release gates
- [PRODUCT.md](./PRODUCT.md) — product contract
- [DESIGN.md](./DESIGN.md) and [UI-STANDARDS.md](./UI-STANDARDS.md) — interaction and accessibility rules

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

The production target is a Cloudflare-compatible vinext Worker with a `DB` D1 binding. here.now can host a static front end, but it cannot provide the authenticated server routes by itself; see the design document before choosing a deployment shape.

Never commit `.env.local`, OAuth downloads, `.p8` keys, database files, or credentials. A real key never belongs in a `NEXT_PUBLIC_*` variable.
