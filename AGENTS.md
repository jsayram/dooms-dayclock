# Repository instructions

## Read first

Before changing this project, read:

1. `AI-HANDOFF.md`
2. `PRODUCT.md`
3. `DESIGN.md`
4. `UI-STANDARDS.md`
5. `SECURITY.md`
6. `README.md`

These files define the product contract. If code and documentation disagree, stop and resolve the mismatch rather than silently changing the contract.

## Scope

- Build Doomsday Clock V2 in this repository. Do not replace or modify the stable V1 project.
- Keep the guest timer fully useful without sign-in, AI, or music.
- Use Clerk with Google as the first identity provider. Keep authentication behind an adapter so additional Clerk-supported providers can be enabled later.
- Use a common music adapter with YouTube first. Do not label an integration Spotify or Apple Music until it works against the provider's current official API and account requirements.
- Keep AI task creation provider-neutral. OpenAI and Anthropic BYOK credentials are session-only. Ollama and LM Studio require an explicit user-triggered connection test.
- Do not add analytics, advertising, subscriptions, public profiles, or new external services without explicit approval.
- Treat any accountability payment as an optional $1 to $5 pledge stored locally. Never implement a wager, prize, entry fee, debt, automatic charge, stored payment method, feature lock, or coercive payment flow. Only a voluntary post-outcome link to an allowlisted Buy Me a Coffee creator page is in scope, and it requires a current provider-policy and legal review before production.

## Implementation rules

- Prefer small, typed modules with clear boundaries for timer logic, persistence, authentication, AI, and music.
- Treat all browser input, persisted state, model output, provider data, and request metadata as untrusted.
- Validate data at every trust boundary. Bound strings, arrays, durations, timestamps, payload size, and enum values.
- Keep secrets server-side unless `SECURITY.md` explicitly defines a session-only BYOK flow.
- Do not use raw HTML rendering for task or model text.
- Use official SDKs and current primary documentation for Clerk, AI providers, YouTube, Spotify, Apple Music, Cloudflare, and here.now. Record meaningful platform, pricing, privacy, and account limitations in project documentation.
- Keep external integrations optional and fail them independently from the timer.
- Preserve user work across recoverable errors.
- Use semantic HTML and meet every rule in `UI-STANDARDS.md`.
- Use the official shadcn skill and `components.json` as the component-library contract. Run `npx shadcn@latest info --json` before shadcn work and consult `npx shadcn@latest docs <component>` before adding or changing a primitive.
- Prefer an installed shadcn component over a hand-built equivalent, but preserve the Doomsday theme and product hierarchy. The project's 44px touch-target rule overrides a smaller library default.
- Write user-facing text in plain, natural language. No blame, inflated praise, productivity jargon, or generic AI filler.

## Change discipline

- Inspect the working tree before editing. Preserve unrelated user changes.
- Make the smallest coherent change that advances the requested feature.
- Update the product or security documents when a material decision changes.
- Add or update tests with behavior changes. Timer calculations need deterministic unit tests; critical user journeys need browser tests.
- Do not weaken a security control to make a demo pass. Document a blocked integration and keep its adapter unavailable.
- Do not commit, push, publish, change access controls, create provider resources, or send external data unless the user explicitly authorizes that action.

## Required checks

Before handoff, run the relevant project commands and report exact results:

```bash
npm run lint
npm test
npm run build
```

Also verify:

- guest timer behavior and refresh recovery;
- keyboard, screen-reader labels, reduced motion, phone layout, and 200 percent zoom;
- invalid and cross-midnight finish times;
- failure isolation for auth, AI, and music;
- no secret values or unapproved files in tracked sources or built output;
- production security headers and allowed origins when deployment code changes.
- accountability pledge disclosures, safe external links, and no product effect when payment is declined, if that feature changes.

Never claim a feature, provider, compliance state, or deployment is complete without direct evidence.
