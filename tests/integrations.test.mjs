import assert from "node:assert/strict";
import test from "node:test";

import { SessionCredentialStore } from "../lib/integrations/credentials.ts";
import {
  parseYouTubeUrl,
  youtubeResourceToSelection,
} from "../lib/integrations/music/youtube.ts";
import {
  validateApiKey,
  validateModelId,
  validateProviderEndpoint,
  validateVolume,
} from "../lib/integrations/validation.ts";

test("YouTube parser accepts known HTTPS forms and rejects lookalike hosts", () => {
  assert.deepEqual(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"), {
    kind: "video",
    videoId: "dQw4w9WgXcQ",
  });
  assert.deepEqual(
    parseYouTubeUrl("https://www.youtube.com/playlist?list=PL123456789"),
    { kind: "playlist", playlistId: "PL123456789" },
  );
  assert.equal(parseYouTubeUrl("http://youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseYouTubeUrl("https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseYouTubeUrl("javascript:alert(1)"), null);
});

test("YouTube selections use a canonical allowlisted URL", () => {
  const parsed = parseYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ");
  assert.ok(parsed);
  assert.equal(
    youtubeResourceToSelection(parsed).canonicalUrl,
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
});

test("AI endpoints are an exact provider allowlist", () => {
  assert.equal(
    validateProviderEndpoint("openai", "https://api.openai.com/v1/"),
    "https://api.openai.com/v1",
  );
  assert.throws(() =>
    validateProviderEndpoint("openai", "https://api.openai.com/v1/chat/completions"),
  );
  assert.throws(() =>
    validateProviderEndpoint("ollama", "http://192.168.1.5:11434"),
  );
  assert.throws(() =>
    validateProviderEndpoint("ollama", "http://localhost:11434?target=remote"),
  );
});

test("credential store is memory-only and does not serialize secrets", () => {
  const store = new SessionCredentialStore();
  store.set("openai", "sk-session-only-value");
  assert.equal(store.has("openai"), true);
  assert.equal(store.get("openai"), "sk-session-only-value");
  assert.equal(JSON.stringify(store), "{}");
  store.clear();
  assert.equal(store.has("openai"), false);
});

test("credential, model, and volume validation rejects unsafe values", () => {
  assert.equal(validateApiKey("  abcdefgh  "), "abcdefgh");
  assert.throws(() => validateApiKey("short"));
  assert.throws(() => validateApiKey("valid-key\nleak"));
  assert.equal(validateModelId("vendor/model-1.0"), "vendor/model-1.0");
  assert.throws(() => validateModelId("../model?secret=true"));
  assert.equal(validateVolume(0.5), 0.5);
  assert.throws(() => validateVolume(2));
});
