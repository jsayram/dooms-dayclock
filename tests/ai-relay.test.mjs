import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
  generateCloudPlan,
  listCloudModels,
  modelsRequestSchema,
  planRequestSchema,
} from "../lib/server/ai-relay.ts";
import {
  allowedRequestOrigin,
  hasJsonContentType,
  readBoundedJson,
} from "../lib/server/http-security.ts";

const originalFetch = globalThis.fetch;
const originalOrigins = process.env.AI_ALLOWED_ORIGINS;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOrigins === undefined) delete process.env.AI_ALLOWED_ORIGINS;
  else process.env.AI_ALLOWED_ORIGINS = originalOrigins;
});

test("cloud AI request schemas reject local providers, extra fields, and unsafe input", () => {
  assert.equal(
    modelsRequestSchema.safeParse({ provider: "ollama", apiKey: "12345678" }).success,
    false,
  );
  assert.equal(
    planRequestSchema.safeParse({
      provider: "openai",
      apiKey: "12345678",
      model: "../unsafe",
      goal: "Pack for the trip",
      taskCount: 5,
    }).success,
    false,
  );
  assert.equal(
    planRequestSchema.safeParse({
      provider: "anthropic",
      apiKey: "12345678",
      model: "claude-example",
      goal: "Pack for the trip",
      taskCount: 21,
    }).success,
    false,
  );
  assert.equal(
    planRequestSchema.safeParse({
      provider: "openai",
      apiKey: "12345678",
      model: "gpt-example",
      goal: "Pack for the trip",
      taskCount: 5,
      endpoint: "https://attacker.example",
    }).success,
    false,
  );
});

test("origin matching is exact and fails closed when not configured", () => {
  delete process.env.AI_ALLOWED_ORIGINS;
  const request = new Request("https://app.example/api/ai/models", {
    headers: { Origin: "https://app.example" },
  });
  assert.equal(allowedRequestOrigin(request), null);

  process.env.AI_ALLOWED_ORIGINS = "https://app.example, https://preview.example";
  assert.equal(allowedRequestOrigin(request), "https://app.example");
  assert.equal(
    allowedRequestOrigin(
      new Request("https://app.example/api/ai/models", {
        headers: { Origin: "https://app.example.attacker.test" },
      }),
    ),
    null,
  );

  process.env.AI_ALLOWED_ORIGINS = "null,http://app.example,https://app.example/path";
  assert.equal(allowedRequestOrigin(request), null);
});

test("bounded JSON parsing enforces content type helper and actual byte size", async () => {
  const valid = new Request("https://app.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  });
  assert.equal(hasJsonContentType(valid), true);
  assert.deepEqual(await readBoundedJson(valid, 100), { ok: true });

  const oversized = new Request("https://app.example/api", {
    method: "POST",
    body: "x".repeat(101),
  });
  await assert.rejects(() => readBoundedJson(oversized, 100), {
    code: "request_too_large",
  });
});

test("OpenAI relay uses only the fixed Responses endpoint and disables storage", async () => {
  let capturedUrl = "";
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return Response.json({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                title: "Trip prep",
                tasks: [{ title: "Pack", details: "Pack one bag", weightMinutes: 15 }],
              }),
            },
          ],
        },
      ],
    });
  };

  const plan = await generateCloudPlan({
    provider: "openai",
    apiKey: "session-secret-key",
    model: "gpt-example",
    goal: "Pack for the trip",
    taskCount: 1,
  });
  assert.equal(capturedUrl, "https://api.openai.com/v1/responses");
  const body = JSON.parse(capturedInit.body);
  assert.equal(body.store, false);
  assert.equal(body.model, "gpt-example");
  assert.equal(plan.tasks[0].title, "Pack");
});

test("Anthropic relay forces a structured tool result and rejects malformed plans", async () => {
  let capturedUrl = "";
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return Response.json({
      content: [
        {
          type: "tool_use",
          name: "create_task_plan",
          input: {
            title: "Unsafe",
            tasks: [{ title: "", details: "", weightMinutes: 0 }],
          },
        },
      ],
    });
  };
  await assert.rejects(
    () =>
      generateCloudPlan({
        provider: "anthropic",
        apiKey: "session-secret-key",
        model: "claude-example",
        goal: "Pack for the trip",
        taskCount: 1,
      }),
    { code: "invalid_provider_response" },
  );
  assert.equal(capturedUrl, "https://api.anthropic.com/v1/messages");
});

test("model discovery filters invalid IDs and never accepts a caller endpoint", async () => {
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://api.openai.com/v1/models");
    return Response.json({ data: [{ id: "gpt-example" }, { id: "../../bad" }] });
  };
  await assert.rejects(() => listCloudModels("openai", "session-secret-key"), {
    code: "invalid_provider_response",
  });
});
