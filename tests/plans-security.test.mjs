import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseAuthorizedParties } from "../app/lib/server/auth-config.ts";
import { planInputSchema } from "../app/lib/server/plan-input.ts";

const validPlan = {
  title: "Pack for tomorrow",
  finishAtMs: Date.now() + 3_600_000,
  tasks: [
    { id: "task-1", title: "Pack clothes", details: "One suitcase", weightMinutes: 20 },
  ],
};

test("plan input is bounded and rejects unknown or duplicate task data", () => {
  assert.equal(planInputSchema.parse(validPlan).title, validPlan.title);
  assert.equal(planInputSchema.safeParse({ ...validPlan, ownerId: "attacker" }).success, false);
  assert.equal(
    planInputSchema.safeParse({
      ...validPlan,
      tasks: Array.from({ length: 41 }, (_, index) => ({
        id: `task-${index}`,
        title: "Task",
        details: "",
        weightMinutes: 1,
      })),
    }).success,
    false,
  );
  assert.equal(
    planInputSchema.safeParse({ ...validPlan, tasks: [validPlan.tasks[0], validPlan.tasks[0]] }).success,
    false,
  );
  assert.equal(
    planInputSchema.safeParse({
      ...validPlan,
      tasks: [{ ...validPlan.tasks[0], details: "x".repeat(401) }],
    }).success,
    false,
  );
});

test("authorized parties accept exact HTTPS origins and localhost only", () => {
  assert.deepEqual(
    parseAuthorizedParties("https://doomsday.example,http://localhost:3000"),
    ["https://doomsday.example", "http://localhost:3000"],
  );
  for (const unsafe of [
    undefined,
    "",
    "https://doomsday.example/",
    "https://doomsday.example/path",
    "http://doomsday.example",
    "https://user:pass@doomsday.example",
  ]) {
    assert.throws(() => parseAuthorizedParties(unsafe));
  }
});

test("every plan data statement binds owner identity", async () => {
  const source = await readFile(new URL("../app/lib/server/plans.ts", import.meta.url), "utf8");
  assert.match(source, /FROM saved_plans WHERE owner_id = \? ORDER BY updated_at/);
  assert.match(source, /FROM saved_plans WHERE owner_id = \? AND id = \? LIMIT 1/);
  assert.match(source, /SELECT COUNT\(\*\) FROM saved_plans WHERE owner_id = \?/);
  assert.match(source, /UPDATE saved_plans[\s\S]*?WHERE owner_id = \? AND id = \?/);
  assert.match(source, /DELETE FROM saved_plans WHERE owner_id = \? AND id = \?/);
  assert.doesNotMatch(source, /ownerId\s*:\s*planInputSchema/);
});

test("protected routes authenticate before touching the plan store", async () => {
  const collection = await readFile(new URL("../app/api/plans/route.ts", import.meta.url), "utf8");
  const item = await readFile(new URL("../app/api/plans/[id]/route.ts", import.meta.url), "utf8");
  const auth = await readFile(new URL("../app/lib/server/auth.ts", import.meta.url), "utf8");

  assert.match(auth, /authenticateRequest\(request/);
  assert.match(auth, /authorizedParties:/);
  assert.match(auth, /auth\.userId/);
  assert.doesNotMatch(collection + item, /request.*userId|ownerId.*request/);
  assert.ok(collection.indexOf("requireClerkUser(request)") < collection.indexOf("listPlans(userId)"));
  assert.ok(item.indexOf("requireClerkUser(request)") < item.indexOf("findPlan(userId"));
});
