import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import config from "../../next.config.mjs";
import { verifyBuildTraces } from "../../scripts/verify-build.mjs";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
async function fixture(t) {
  const directory = await mkdtemp(join(projectRoot, ".build-traces-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return {
    directory,
    async file(name, content = "") {
      const filename = join(directory, name);
      await mkdir(resolve(filename, ".."), { recursive: true });
      await writeFile(filename, content, "utf8");
      return filename;
    },
    async trace(name, files) {
      return this.file(name, JSON.stringify({ version: 1, files }));
    },
  };
}

test("Next.js uses conventional app entrypoints without activating legacy Pages Router screens", async () => {
  assert.equal(config.pageExtensions, undefined);
  await assert.rejects(access(join(projectRoot, "src/pages")), { code: "ENOENT" });
  await access(join(projectRoot, "src/screens/HomeRedesign.jsx"));
  await access(join(projectRoot, "src/screens/dashboard/PageBuilder.jsx"));
  for (const name of [
    "layout.jsx", "not-found.jsx", "[[...path]]/page.jsx",
    "api/[[...path]]/route.js", "robots.txt/route.js",
    "sitemap.xml/route.js", "share-image/route.jsx",
  ]) await access(join(projectRoot, "src/app", name));
  const app = await readFile(join(projectRoot, "src/App.js"), "utf8");
  assert.ok(!app.includes("@/pages/"));
  assert.ok(app.includes("@/screens/HomeRedesign"));
  assert.ok(app.includes("@/screens/dashboard/PageBuilder"));
});

test("npm production builds verify artifacts and Vercel includes the validator", async () => {
  const pkg = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.equal(pkg.scripts.build, "next build --webpack");
  assert.equal(pkg.scripts.postbuild, "node scripts/verify-build.mjs");
  const ignore = (await readFile(join(projectRoot, ".vercelignore"), "utf8")).split(/\r?\n/);
  assert.ok(!ignore.includes("scripts"));
  assert.ok(ignore.includes("scripts/*"));
  assert.ok(ignore.includes("!scripts/verify-build.mjs"));
});

test("build verification accepts real page manifests and server modules without rewriting traces", async t => {
  const f = await fixture(t);
  await f.file("server/app/[[...path]]/page_client-reference-manifest.js", "page manifest");
  await f.file("server/chunks/runtime.js", "runtime");
  const filename = await f.trace("server/app/[[...path]]/page.js.nft.json", [
    "page_client-reference-manifest.js", "../../chunks/runtime.js",
  ]);
  const before = await readFile(filename, "utf8");
  assert.deepEqual(await verifyBuildTraces(f.directory), { traces: 1, references: 2 });
  assert.equal(await readFile(filename, "utf8"), before);
});

test("build verification catches the exact missing API client-reference manifest regression", async t => {
  const f = await fixture(t);
  await f.trace("server/app/api/[[...path]]/route.js.nft.json", ["route_client-reference-manifest.js"]);
  await assert.rejects(verifyBuildTraces(f.directory), /route_client-reference-manifest\.js/);
});

test("build verification checks regular modules and root Next.js traces too", async t => {
  const f = await fixture(t);
  await f.trace("next-server.js.nft.json", ["server/missing-runtime.js"]);
  await assert.rejects(verifyBuildTraces(f.directory), /next-server\.js\.nft\.json -> server\/missing-runtime\.js/);
});

test("build verification rejects missing and malformed trace lists", async t => {
  const f = await fixture(t);
  const filename = await f.file("server/app/page.js.nft.json", "{}");
  await assert.rejects(verifyBuildTraces(f.directory), /Invalid file list/);
  await writeFile(filename, JSON.stringify({ files: [null] }));
  await assert.rejects(verifyBuildTraces(f.directory), /Invalid file list/);
});

test("build verification fails if no production traces were generated", async t => {
  const f = await fixture(t);
  await assert.rejects(verifyBuildTraces(f.directory), /No Next\.js build traces/);
});

test("build verification rejects directory references and ignores build cache traces", async t => {
  const f = await fixture(t);
  await mkdir(join(f.directory, "server/directory"), { recursive: true });
  await f.trace("cache/unused.nft.json", ["not-a-deployment-file"]);
  await f.trace("server/app/route.js.nft.json", ["../directory"]);
  await assert.rejects(verifyBuildTraces(f.directory), /1 missing file/);
});

test("build verification reports all affected routes, not just the first missing manifest", async t => {
  const f = await fixture(t);
  await f.trace("server/app/api/route.js.nft.json", ["route_client-reference-manifest.js"]);
  await f.trace("server/app/robots.txt/route.js.nft.json", ["route_client-reference-manifest.js"]);
  await assert.rejects(verifyBuildTraces(f.directory), error =>
    error.message.includes("2 missing file(s)") &&
    error.message.includes("robots.txt") &&
    error.message.includes("api"));
});
