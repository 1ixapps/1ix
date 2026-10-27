import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createApi } from "../api.mjs";
const canonical = path => path.replace(/\{[^}]+\}|:[^/]+/g, ":parameter").replace(/\/$/, "");
test("every captured legacy FastAPI endpoint remains available with the same HTTP method", async () => {
  const legacy = JSON.parse(await readFile(new URL("./fixtures/legacy-routes.json", import.meta.url), "utf8"));
  const routes = createApi().routes;
  const available = new Set(routes.map(route => route.method + " " + canonical(route.path)));
  assert.ok(legacy.length >= 50, "The captured legacy API inventory must be complete");
  for (const route of legacy) assert.ok(available.has(route.method + " " + canonical(route.path)), "Missing migrated route: " + route.method + " " + route.path);
});
