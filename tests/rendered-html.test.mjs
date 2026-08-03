import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt"]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const location = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      return entry.isDirectory() ? collectFiles(location) : [location];
    }),
  );
  return files.flat();
}

async function productionBundles() {
  await access(new URL("client/", distRoot));
  await access(new URL("server/", distRoot));
  const files = (await collectFiles(distRoot)).filter((file) =>
    textExtensions.has(path.extname(file.pathname)),
  );
  const contents = await Promise.all(files.map((file) => readFile(file, "utf8")));
  return { files, text: contents.join("\n") };
}

function parsePrivateEnvValues(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^(['"])(.*)\1$/, "$2")])
    .filter(([name, value]) => !name.startsWith("NEXT_PUBLIC_") && value.length >= 16)
    .filter(([, value]) => !/^<.*>$/.test(value) && !/your[-_ ]|replace[-_ ]me/i.test(value));
}

function assertContains(text, expected, label = expected) {
  assert.ok(text.includes(expected), `Production output is missing ${label}.`);
}

function assertExcludes(text, forbidden, label = forbidden) {
  assert.ok(!text.toLowerCase().includes(forbidden.toLowerCase()), `Production output contains ${label}.`);
}

test("production bundles contain the Doomsday Clock identity and accessible core controls", async () => {
  const { text } = await productionBundles();

  assertContains(text, "Doomsday Clock | Turn a deadline into a doable plan", "the branded page title");
  assertContains(text, "friendly focus timer that turns a finish line into small, playable steps", "the page description");
  assertContains(text, "Doomsday Clock home", "the accessible home label");
  assertContains(text, "Current quest");
  assertContains(text, "Restart current task", "the restart control label");
  assertContains(text, "current-task-heading", "the timer heading relationship");
  assertContains(text, "Edit the plan and finish time");
});

test("production bundles do not contain the disposable starter preview", async () => {
  const { text } = await productionBundles();

  assertExcludes(text, "Your site is taking shape", "starter title copy");
  assertExcludes(text, "Building your site", "starter loading copy");
  assertExcludes(text, "codex-preview", "starter preview metadata");
  assertExcludes(text, "react-loading-skeleton", "the starter skeleton package");
  assertExcludes(text, "sites-skeleton-preview", "starter preview styles");
});

test("published output excludes env files and private local credential values", async () => {
  const [{ files, text }, gitignore] = await Promise.all([
    productionBundles(),
    readFile(new URL(".gitignore", projectRoot), "utf8"),
  ]);

  assert.ok(files.every((file) => !/(^|\/)\.env(?:\.|$)/.test(file.pathname)));
  assert.match(gitignore, /^\.env\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
  assert.ok(!/sk-(?:proj|ant)-[A-Za-z0-9_-]{16,}/.test(text), "Production output contains a provider secret pattern.");
  assert.ok(!/(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/.test(text), "Production output contains a service secret pattern.");

  try {
    const localEnv = await readFile(new URL(".env", projectRoot), "utf8");
    for (const [name, value] of parsePrivateEnvValues(localEnv)) {
      if (text.includes(value)) assert.fail(`Production output contains the private value for ${name}.`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
});

test("accountability pledge remains voluntary and never implies automatic payment", async () => {
  const { text } = await productionBundles();

  assertContains(text, "Optional accountability pledge");
  assertContains(text, "Nothing is charged here.");
  assertContains(text, "I understand this is voluntary.");
  assertContains(text, "will not charge me, store a payment method, create a debt, or limit any feature");
  assertContains(text, "Nothing is owed, and every feature stays open");
  assertContains(text, "No payment is expected");
  for (const phrase of ["wager", "gambling", "automatic charge", "payment required", "must pay", "debt owed"]) {
    assertExcludes(text, phrase);
  }
});
