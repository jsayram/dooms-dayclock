# Security and privacy requirements

## Security model

The public timer is untrusted-client code. Authentication, authorization, secret use, account data, and provider token exchange belong behind a server boundary. Client-side checks improve the interface but never grant access.

Security and privacy reviews cover the timer, Cloudflare/server routes, Clerk configuration, connected media providers, AI providers, local-model connections, persistence, logging, deployment, and deletion flows.

## Data classes

| Data | Storage rule | Logging rule |
| --- | --- | --- |
| Guest plans and timer state | Local device by default | Never log content |
| Clerk session token | Clerk-supported secure session mechanism | Never log |
| Account ID and saved plans | Server-side, least data needed | Log identifiers only when operationally necessary |
| OpenAI or Anthropic API key | Browser memory for the current session only | Never log, persist, cache, or send to analytics |
| Local LLM endpoint | Session or explicit local preference | Do not log private addresses |
| Music OAuth token | Provider-supported server-side token storage, encrypted at rest | Never log |
| Accountability pledge amount and provider choice | Local device only | Never log |
| Security event | Append-only operational log with retention limits | Exclude task content, prompts, tokens, and secrets |

## Authentication and authorization

- Use Clerk's official SDK and hosted OAuth flow. Google is the first configured provider.
- Validate Clerk sessions on every protected server request.
- Authorize each saved plan by its server-derived user ID. Never accept an owner ID from the client as proof.
- Use secure, `HttpOnly`, `SameSite` cookies where the platform supports them. Do not put session tokens in URLs or local storage.
- Protect state-changing cookie-authenticated routes against CSRF with same-origin checks and the framework's recommended controls.
- Apply rate limits to authentication callbacks, AI proxy routes, sync writes, and connection tests.
- Keep guest mode separate from authenticated cloud data until the user explicitly chooses to import or merge it.

## AI provider keys

- BYOK keys are entered into a password field and held only in JavaScript memory.
- Never write keys to `localStorage`, `sessionStorage`, IndexedDB, cookies, a service worker cache, server storage, telemetry, or error reports.
- Send a key only to the chosen provider through the documented request path. If a server relay is required, it must avoid request-body logging and discard the key after the request.
- Clear in-memory credentials on refresh, sign-out, provider change, and explicit disconnect.
- Show the destination provider and retention behavior before the first request.
- Treat all model output as untrusted data. Validate the task-plan schema, bound task counts and text lengths, and render as text rather than HTML.

## Local model connections

- Do not scan localhost, private address ranges, or common model-server ports.
- Require the user to enter or choose an endpoint and press "Test connection."
- Restrict schemes and destinations. Block credentials in URLs, unsafe redirects, and requests to cloud metadata addresses.
- Explain that browser CORS and HTTPS mixed-content rules may prevent a connection.
- Never route a local endpoint through the hosted server unless the user explicitly configures a documented secure tunnel.

## Web application controls

- Use a restrictive Content Security Policy. Add origins only for verified Clerk, music, and AI requirements.
- Set `Referrer-Policy`, `X-Content-Type-Options`, a restrictive `Permissions-Policy`, and frame controls compatible with approved media embeds.
- Use HTTPS in production and strict transport security where the hosting platform supports it.
- Escape untrusted text and avoid raw HTML injection. Sanitize only when rich text is a documented requirement.
- Validate request bodies on the server with explicit schemas, size limits, allowed methods, and content types.
- Configure CORS with exact allowed origins. Never combine wildcard origins with credentials.
- Prevent open redirects by allowing only same-origin relative return paths.
- Keep dependencies pinned through the lockfile and review security advisories before release.
- Do not expose source maps, environment files, debug routes, stack traces, or deployment metadata in production.

## Accountability payments

- Treat the feature as an optional accountability pledge or stake, never as gambling, a wager, bet, prize, entry fee, debt, or penalty.
- Limit the locally stored user-selected amount to $1 through $5. Do not transmit the choice unless the user intentionally opens the external provider.
- Do not collect card or bank details, create checkout sessions on the user's behalf, store payment methods, charge automatically, retry a payment, track an unpaid balance, or condition any feature on payment.
- Only after the sprint outcome may the user voluntarily open the configured Buy Me a Coffee creator page. Use an allowlisted HTTPS destination, protect against opener access, and disclose that support occurs on the provider's site.
- Completion means no payment is expected. A separate optional tip may be offered with no preselection or repeated prompt.
- Missing a finish line must not trigger coercive copy, urgency, debt styling, or default navigation to payment.
- Review current Buy Me a Coffee rules and applicable requirements before enabling the link in production. Confirm acceptable use, disclosures, refunds, receipts, taxes, geography, age restrictions, and whether the intended pledge language is permitted.
- Do not claim that Doomsday Clock processes or guarantees a payment when it only links to a third-party destination.

## Secrets and configuration

- Keep `.env*` files out of source control except reviewed examples containing placeholders.
- Prefix only intentionally public values with client-exposed environment prefixes.
- Clerk secret keys, OAuth client secrets, signing keys, database credentials, and deployment tokens are server-only.
- Production and development use separate credentials and callback URLs.
- Rotate a secret immediately if it appears in a commit, log, screenshot, chat, or client bundle. Removing the text is not sufficient.
- Deployment artifacts and source maps must be inspected for secret names and known values before release.

## Privacy and compliance

- Use data minimization, purpose limitation, least privilege, and short documented retention periods.
- Provide clear notices for account data, AI prompt transmission, music-provider connection, and local-model network access.
- Obtain consent before optional analytics or nonessential storage. No analytics is the default.
- Provide account data export and deletion paths before calling cloud accounts production-ready.
- Document subprocessors and data locations for Clerk, hosting, database, AI, and music services before public launch.
- Maintain an inventory of personal data and deletion behavior suitable for GDPR requests and SOC 2 evidence.
- Do not claim GDPR compliance, SOC 2 certification, HIPAA compliance, or end-to-end encryption without verified evidence.

## Release gate

Before deployment:

1. Run lint, type checks, tests, and a production build.
2. Test guest access, authorization boundaries, sign-out, expired sessions, and cross-user access attempts.
3. Test CSP, CORS, CSRF defenses, input bounds, open redirects, rate limiting, and error redaction.
4. Search tracked files and built output for secrets and forbidden environment files.
5. Verify privacy notices, provider disclosures, export, and deletion behavior for every enabled integration.
6. Confirm that only approved origins, redirect URLs, and production credentials are configured.
7. If accountability links are enabled, attach the provider-policy and legal review, verify voluntary disclosures, and test that declining has no product effect.

Report vulnerabilities privately. Do not include live secrets, personal data, or exploitable production details in an issue.
