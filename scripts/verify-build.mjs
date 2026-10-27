import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function collectTraces(directory, recursive = false) {
  const entries = await readdir(directory, { withFileTypes: true });
  const traces = [];
  for (const entry of entries) {
    const filename = join(directory, entry.name);
    if (entry.isFile() && entry.name.endsWith(".nft.json")) traces.push(filename);
    if (entry.isDirectory() && (recursive || entry.name === "server")) {
      traces.push(...await collectTraces(filename, true));
    }
  }
  return traces.sort();
}

// Vercel copies files named in Next's traces, even when next build succeeds.
// Check the actual files, not only the compiler exit code. Never modify traces.
export async function verifyBuildTraces(directory = fileURLToPath(new URL("../.next", import.meta.url))) {
  const root = resolve(directory);
  const traces = await collectTraces(root);
  if (!traces.length) throw new Error("No Next.js build traces found. Run next build before verifying deployment output.");
  const missing = [];
  let references = 0;
  for (const trace of traces) {
    const data = JSON.parse(await readFile(trace, "utf8"));
    if (!Array.isArray(data.files) || data.files.some(file => typeof file !== "string" || !file)) {
      throw new Error("Invalid file list in build trace: " + relative(root, trace));
    }
    references += data.files.length;
    await Promise.all(data.files.map(async file => {
      try {
        const info = await stat(resolve(dirname(trace), file));
        if (!info.isFile()) missing.push({ trace: relative(root, trace), file });
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
        missing.push({ trace: relative(root, trace), file });
      }
    }));
  }
  if (missing.length) {
    missing.sort((a, b) => a.trace.localeCompare(b.trace) || a.file.localeCompare(b.file));
    const details = missing.slice(0, 20).map(item => "  " + item.trace + " -> " + item.file).join("\n");
    throw new Error("Next.js deployment traces reference " + missing.length + " missing file(s):\n" + details +
      (missing.length > 20 ? "\n  ...and " + (missing.length - 20) + " more" : "") +
      "\nDo not deploy this output or create placeholder manifests. Fix routing/build configuration first.");
  }
  return { traces: traces.length, references };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const result = await verifyBuildTraces(process.argv[2]);
    console.log("Deployment traces verified: " + result.traces + " manifests, " + result.references + " file references. No missing files.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
