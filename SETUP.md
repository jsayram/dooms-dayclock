# Doomsday Clock V2 setup

The guest timer needs no account, database, AI key, or music credential. Configure an integration only when you are ready to test that integration. A failed or missing integration must never prevent someone from using the local timer.

This guide separates intentionally public browser configuration from server secrets. The checked-in `.env.example` contains blank credential placeholders; `DB` is the only filled value and is a non-secret binding name.

## 1. Local setup

Requirements:

- Node.js 22.13 or newer
- npm
- Provider accounts only for the optional features you choose to test

Install and start the application:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Keep unused values blank. Restart the development server after changing an environment value.

Before any release, run:

```bash
npm run lint
npm test
npm run build
```

Never commit `.env.local`, a `.p8` file, a downloaded OAuth credential file, a database export, or a provider token. Do not paste secrets into chat, screenshots, logs, client error reports, or browser-visible configuration.

> Repository note: `.gitignore` must explicitly allow `.env.example` while continuing to ignore every real `.env*` file. Confirm with `git check-ignore -v .env.example .env.local` before the first commit.

## 2. Configuration classes

| Class | Meaning | Examples |
| --- | --- | --- |
| Public | Intentionally included in browser JavaScript. It is not a secret. | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, provider client IDs, Turnstile site key, approved external payment URLs |
| Server configuration | Needed by server or deployment tooling but not intentionally exposed. It does not authenticate by itself. | exact origins, callback URLs, Cloudflare account ID, D1 database ID and binding name |
| Server secret | Authenticates, signs, decrypts, publishes, or spends money. Keep it in a local ignored file or the production secret store. | Clerk secret key, Cloudflare token, here.now key, app-owned AI keys, OAuth client secrets, Apple `.p8` key, Turnstile secret |
| Dashboard only | A provider-to-provider value that the application does not need. | Google OAuth client secret entered directly in Clerk |
| Session-only user credential | Entered by the user after the page loads, held in memory, and erased when the session ends. It is never an environment value. | OpenAI or Anthropic BYOK key; local LLM endpoint |

Only variables deliberately prefixed with `NEXT_PUBLIC_` may reach the browser. Treat the production bundle as public and inspect it before release.

## 3. Origins and callback URLs

Set `NEXT_PUBLIC_APP_URL` and `APP_ORIGIN` to the one canonical origin for each environment. Set `ALLOWED_ORIGINS` to a comma-separated list of exact origins that may call credentialed routes.

Rules:

- include the scheme and hostname, plus the port when it is not the default;
- do not include paths in an origin;
- do not use wildcards on credentialed CORS routes;
- keep development, preview, and production allowlists separate;
- register callback URLs exactly as each provider displays them; and
- allow only same-origin relative post-authentication return paths in application code.

Preview URLs that change on every deployment are a poor match for OAuth. Prefer a stable preview hostname and register it separately from production.

## 4. Clerk and Google sign-in

Clerk owns the application session. Google is a social connection inside Clerk; the application must not implement a second, parallel Google session.

This application runs through vinext on the Cloudflare Worker runtime. Use `@clerk/react` for the client provider and controls and `@clerk/backend` for server request verification. Clerk's standard `@clerk/nextjs` App Router wrapper and `proxy.ts` assume the official Next.js compiler/runtime boundary; with the current vinext version they load server-only `AsyncLocalStorage` code into the browser and crash the page. Re-evaluate this constraint after a vinext compatibility release or if the hosting architecture moves to the official Next.js runtime. Do not add `clerkMiddleware()` while the app remains on the current vinext runtime.

### Development

1. Create an application in the [Clerk Dashboard](https://dashboard.clerk.com/).
2. Open **SSO connections**, add Google for all users, and keep Clerk's development credentials while working locally.
3. Copy the development publishable key to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. Copy the development secret key to `CLERK_SECRET_KEY`.
5. Set `CLERK_AUTHORIZED_PARTIES=http://localhost:3000` for local testing.

Clerk development instances are not production: they use an `accounts.dev` domain, are capped at 100 users, and their user data cannot be transferred into a production instance. Use separate keys and test data. See Clerk's [environment documentation](https://clerk.com/docs/guides/development/managing-environments) and [key reference](https://clerk.com/docs/guides/development/clerk-environment-variables).

### Production Google connection

1. Create a Clerk production instance and configure its production domain.
2. In Clerk, add the production Google connection and copy the authorized redirect URI that Clerk gives you.
3. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create a **Web application** OAuth client.
4. Add only the real application origins under **Authorized JavaScript origins**.
5. Paste Clerk's exact URI under **Authorized redirect URIs**.
6. Paste the resulting Google client ID and client secret into Clerk's Google connection.

The Google client secret is dashboard-only for this architecture. Do not add it to `.env.local`, Next.js, Cloudflare, here.now, or the browser. Clerk notes that its development connection can use shared credentials, but production requires a custom Google OAuth application. Google's external test mode is limited to test users; move the consent screen to production and complete any verification required for the scopes you request. Google also blocks OAuth inside embedded webviews, so test sign-in in a normal browser. Follow Clerk's current [Google social connection guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) before enabling production.

If Clerk webhooks are later used for deletion or synchronization, create a signing secret in Clerk and store it as `CLERK_WEBHOOK_SIGNING_SECRET`. Verify every webhook signature before reading its body. A webhook does not replace session validation and per-user authorization on application routes.

## 5. Cloudflare and optional D1 storage

No database is required for guest plans: those stay on the device. D1 is appropriate only when signed-in users explicitly enable cloud-saved plans or cross-device synchronization.

D1 is a runtime binding, not a public connection string:

1. Create separate development and production databases from **Cloudflare Dashboard → Storage & Databases → D1**, or use `npx wrangler d1 create <database-name>`.
2. Bind the database to the Worker using the same name recorded in `CLOUDFLARE_D1_BINDING_NAME` and the hosting configuration.
3. Record the account and database IDs as server configuration. They are identifiers, not passwords, but do not expose them without a reason.
4. Apply reviewed migrations separately to development and production.
5. Query D1 only through the server binding, using prepared statements and a server-derived Clerk user ID for ownership checks.

Cloudflare's [D1 getting-started guide](https://developers.cloudflare.com/d1/get-started/) explains creation and bindings. D1 automatically encrypts stored data and traffic, but the application still owns authorization, deletion, retention, validation, and minimization responsibilities.

`CLOUDFLARE_API_TOKEN` is needed only for deployment or control-plane automation. Create it in **Cloudflare Dashboard → My Profile → API Tokens**, grant the narrowest account and resource permissions required, and prefer an API token over the Global API Key. D1's API requires D1 permissions; deployment may require separate Worker permissions. Do not let the runtime application use a broad deployment token.

## 6. here.now publishing

Get a named key from the [here.now dashboard](https://here.now/dashboard). Use a separate key for this publishing tool so it can be revoked without affecting unrelated sites.

For local publishing, here.now recommends its protected credentials file instead of a repository `.env` file:

```bash
mkdir -p ~/.herenow
chmod 700 ~/.herenow
# Save the key as the only line in ~/.herenow/credentials, then:
chmod 600 ~/.herenow/credentials
```

`HERENOW_API_KEY` is an acceptable alternative for a controlled local or CI environment, but it is a publishing credential, not an application runtime variable. Never prefix it with `NEXT_PUBLIC_`, embed it in the built site, or upload `.env.local`.

Authenticated here.now sites do not have the 24-hour anonymous-site expiry. The default access mode is **anyone with the link**, so review the selected access policy and the exact uploaded files before publishing. here.now also supports account variables whose values are not returned; restrict their allowed upstreams where possible. See the current [here.now documentation](https://here.now/docs) before deployment.

Publishing is a separate, explicitly authorized action. Creating a local build does not authorize a live publish or an access-policy change.

## 7. AI plan creation

AI is optional. The user must review and edit a generated plan before it replaces or starts a timer.

### App-owned provider keys

Create app-owned keys in the [OpenAI API key dashboard](https://platform.openai.com/api-keys) or [Claude Console](https://console.anthropic.com/settings/keys), then place them only in the production server secret store (or the ignored `.env.local` for local testing):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

Leave either value blank to keep that app-owned provider unavailable. Apply provider-side spend limits and least-privilege project/workspace separation. OpenAI explicitly says API keys must not be deployed in browsers; Anthropic keys are created in Console and can be segmented by workspace and spend limits. Prices, models, availability, and rate limits change, so populate a model picker only from models verified for the configured provider and account. Never silently substitute a different model.

The application-owned route must validate the Clerk session where account access is required, rate-limit requests, cap input/output size, redact logs, and validate model output against the task-plan schema.

### Session-only BYOK

An end user's OpenAI or Anthropic key is not environment configuration. The settings screen must:

1. identify the destination provider and explain that prompts leave the device;
2. accept the key in a password field;
3. hold it only in JavaScript memory;
4. send it only through a no-log relay to the chosen provider when needed; and
5. erase it on refresh, tab close, sign-out, provider change, or disconnect.

Never place a BYOK key in local storage, session storage, IndexedDB, cookies, a service worker cache, D1, analytics, error reports, or server logs. The relay must discard the key after the request. Review [OpenAI's key-safety guidance](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety) and the [Claude API overview](https://platform.claude.com/docs/en/api/overview) before enabling either provider.

### Ollama and LM Studio

Local-model endpoints are also session settings, not environment values. Require the user to enter an endpoint and press **Test connection**. Do not probe localhost, scan ports, follow unsafe redirects, accept credentials inside a URL, or access cloud-metadata addresses. Explain that CORS and HTTPS mixed-content rules may block a browser connection. Never route a private endpoint through the hosted server unless the user deliberately configures and understands a secure tunnel.

## 8. Music services

Music must fail independently from the timer. Browser autoplay rules mean playback begins only after a user gesture. Keep sound cues visible as text and prevent them from competing with connected music.

### YouTube — first adapter

Public playback through the [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) needs no API key or Google sign-in. The interface must call the provider **YouTube**, not “YouTube Music.”

Use the page's exact origin in the player configuration and a `strict-origin-when-cross-origin` referrer policy so YouTube receives required client identity. Keep the embedded player at least 200 × 200 CSS pixels when visible, handle autoplay blocking, and explain when an owner has disabled embedding.

`YOUTUBE_DATA_API_KEY` is optional and only needed for a future server-side catalog/search feature. Create it in [Google Cloud credentials](https://console.cloud.google.com/apis/credentials), enable only the required YouTube API, restrict the key by API and deployment source, and keep it server-side. User-private playlists require a separate OAuth consent flow; configure its public client ID, server secret, and exact redirect only when that feature is implemented. Do not reuse the Clerk Google secret.

### Spotify — prepared adapter

Create an application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). The client ID is public; a client secret is server-only. For a browser flow use Authorization Code with PKCE and no client secret. For a server exchange, keep `SPOTIFY_CLIENT_SECRET` on the server.

Register `SPOTIFY_REDIRECT_URI` exactly. Spotify requires HTTPS except for an explicit loopback IP during local development; `localhost` is not accepted. The Web Playback SDK requires the listening user to have Spotify Premium. Current development-mode applications are quota-limited, require the owner to have Premium, and are restricted to allowlisted test users; broader access requires Spotify's extended-quota review and is not guaranteed. Read the current [redirect rules](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), and [Web Playback SDK guide](https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player/) before marking this adapter available.

### Apple Music — prepared adapter

Apple Music on the web requires MusicKit configuration through an Apple Developer account. In **Certificates, Identifiers & Profiles**, create or enable a MusicKit/Media identifier and a MusicKit private key. Record the team ID, key ID, and media ID as server configuration; store the `.p8` private key only as `APPLE_MUSIC_PRIVATE_KEY` in the production secret store.

Generate short-lived developer tokens on the server. Never ship or commit the `.p8` key. MusicKit on the Web manages the listener's Music User Token after consent, and playback depends on the user's Apple Music subscription capability. Apple Developer Program membership and provider terms apply. Start with Apple's [MusicKit overview](https://developer.apple.com/musickit/) and [user-authentication guide](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit).

Spotify and Apple Music must remain visibly unavailable until their adapters, OAuth/token lifecycles, provider terms, privacy notices, and real playback have been tested.

## 9. Optional accountability pledge

This feature is a voluntary accountability pledge, not a bet, wager, debt, penalty, entry fee, prize, or requirement. The application never collects payment details, stores a payment method, charges automatically, creates an amount owed, retries a payment, or reduces access when someone declines.

### Buy Me a Coffee

1. Finish setting up your creator page and payout details in [Buy Me a Coffee](https://buymeacoffee.com/).
2. Open your public creator page and copy its URL. It should look like `https://buymeacoffee.com/yourname`.
3. Set that public URL as `NEXT_PUBLIC_BUYMEACOFFEE_URL` in `.env.local` for local work and in the hosting platform's public configuration for production.
4. Restart the local site after changing the value.

This integration is a normal external link. It needs no Buy Me a Coffee API key, login credential, widget script, webhook, or payment secret. Buy Me a Coffee handles the support form and payment on its own page. Review your page settings, support amount, payout setup, fees, refunds, receipts, taxes, and applicable rules before making the link public. The official setup guide explains that your page link uses the `buymeacoffee.com/yourname` format and that supporters can send one-time support from the creator page.

After a missed finish line, the app may show one warm, dismissible Buy Me a Coffee link. Closing or ignoring it has no product effect. Completion means no payment is expected; a separate optional coffee remains secondary. The application allowlists the exact Buy Me a Coffee host and protects the opener relationship.

## 10. Optional Cloudflare Turnstile

Turnstile may protect abuse-sensitive public routes, but it does not replace authentication, authorization, input validation, or rate limits.

1. Create a widget in **Cloudflare Dashboard → Turnstile**.
2. Add every approved hostname; Cloudflare requires at least one hostname.
3. Put the public site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Put the secret key in `TURNSTILE_SECRET_KEY` on the server.
5. Validate every token server-side, check the expected hostname/action, and reject expired or reused tokens.

Use Cloudflare's published test keys during automated tests rather than production credentials. See the [Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/) and [hostname management](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/) documentation.

## 11. Production readiness checklist

- [ ] Guest timer works without any optional environment values.
- [ ] Development and production use separate Clerk, database, OAuth, and provider resources.
- [ ] Production Google credentials exist only in Clerk and Google dashboards.
- [ ] Every server route validates input, origin, session, ownership, size, method, and content type as applicable.
- [ ] Credentialed CORS uses exact origins and never `*`.
- [ ] App-owned and BYOK AI paths redact bodies, prompts, keys, and provider responses from logs.
- [ ] D1 contains only approved cloud-plan fields and supports export and deletion.
- [ ] Music providers show accurate account, subscription, consent, and availability notices.
- [ ] Accountability links remain disabled until policy/legal review is attached and tested.
- [ ] Turnstile secrets and tokens remain server-side.
- [ ] CSP, referrer policy, permissions policy, MIME sniffing protection, framing rules, and HTTPS/HSTS are verified on the deployed response.
- [ ] Tracked files and built output contain no secret values, `.env` files, `.p8` files, source maps, debug routes, stack traces, or deployment metadata.
- [ ] Publishing scope and here.now access policy are reviewed before an explicitly authorized deployment.

If a key appears in a commit, build, log, screenshot, or chat, revoke and rotate it immediately. Removing the text is not enough.
