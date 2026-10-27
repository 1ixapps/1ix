import "./env.mjs";
import { MongoClient } from "mongodb";
import postgres from "postgres";
import { createNormalizer, legacyIdentifier, legacyFilenamePattern } from "../server/migration.mjs";
import { isDeepStrictEqual } from "node:util";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { TABLES, fromPostgres } from "../server/database.mjs";
import { createStorage, uploadInfo, storageConfig } from "../server/storage.mjs";


const apply = process.argv.includes("--apply");
const verifyOnly = process.argv.includes("--verify");
if (apply && !process.argv.includes("--maintenance-confirmed")) throw new Error("Stop writes to the old app, take a backup, then add --maintenance-confirmed.");
if (!process.env.MONGO_URL || !process.env.DB_NAME) throw new Error("Set source MONGO_URL and DB_NAME locally. Do not set these on Vercel.");
if ((apply || verifyOnly) && !process.env.DATABASE_URL) throw new Error("Set destination DATABASE_URL locally.");
if (!process.env.LEGACY_UPLOAD_DIR?.trim()) throw new Error("Set LEGACY_UPLOAD_DIR to the explicit path of the backed-up legacy uploads directory.");
const uploads = resolve(process.env.LEGACY_UPLOAD_DIR);
const oldOrigins = new Set((process.env.LEGACY_UPLOAD_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean));
const filenamePattern = legacyFilenamePattern;
const { references, normalize: normalized } = createNormalizer(oldOrigins);
const identifier = legacyIdentifier;
const source = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
let client;
try {
  await source.connect();
  const mongo = source.db(process.env.DB_NAME);
  const counts = {};
  for (const entity of TABLES) {
    counts[entity] = await mongo.collection(entity).countDocuments({});
    for await (const doc of mongo.collection(entity).find({})) normalized(entity, doc);
  }
  const missing = [];
  for (const name of references) {
    try { if (!(await stat(join(uploads, name))).isFile()) missing.push(name); } catch { missing.push(name); }
  }
  console.log("Source counts:", counts);
  console.log("Referenced local images:", references.size, "Missing:", missing.length);
  console.log("Dry run is read-only. Destination writes require --apply --maintenance-confirmed.");
  if (missing.length) throw new Error("Some referenced image files are missing. Restore them before importing.");
  if (!apply && !verifyOnly) process.exitCode = 0;
  else {
    const storage = createStorage();
    storageConfig();
    client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: process.env.DATABASE_SSLMODE === "disable" ? false : "require", onnotice: () => {} });
    const db = fromPostgres(client);
    if (apply) {
      // Preserve all recognized local assets, including currently unreferenced ones.
      const filenames = (await readdir(uploads)).filter(name => filenamePattern.test(name));
      for (const name of filenames) {
        const content = await readFile(join(uploads, name));
        const info = uploadInfo(name, content.length);
        const url = storage.publicUrl("legacy/" + name);
        const existing = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (existing.ok) {
          const remote = Buffer.from(await existing.arrayBuffer());
          if (!remote.equals(content)) throw new Error("A destination image differs; refusing to overwrite it.");
        } else if ([400, 404].includes(existing.status)) {
          await storage.put("legacy/" + name, content, info.contentType);
        } else throw new Error("Could not verify destination image. No overwrite attempted.");
      }
      console.log("Verified/copied legacy image files:", filenames.length);
    }
    // One transaction: any duplicate/overlap/changed destination rolls back ALL data inserts.
    // Storage copies remain recoverable and can be reused by a corrected rerun.
    await db.transaction(async tx => {
      for (const entity of TABLES) {
        let checked = 0, inserted = 0;
        for await (const original of mongo.collection(entity).find({})) {
          const data = normalized(entity, original, storage.publicUrl);
          const key = identifier(entity, original);
          const existing = await tx.query('SELECT data FROM app_private."' + entity + '" WHERE id=$1', [key]);
          if (existing.length) {
            if (!isDeepStrictEqual(existing[0].data, data)) throw new Error("Destination differs from source in " + entity + "; refusing to overwrite.");
          } else {
            if (verifyOnly) throw new Error("A destination record is missing in " + entity);
            await tx.insert(entity, data, { identifier: key }); inserted++;
          }
          checked++;
        }
        if (checked !== counts[entity]) throw new Error("Source changed during migration. Keep old application in maintenance mode.");
        console.log(entity + ": verified " + checked + ", inserted " + inserted);
      }
    });
    // Verify every referenced image independently after data verification.
    for (const name of references) {
      const remote = await fetch(storage.publicUrl("legacy/" + name), { signal: AbortSignal.timeout(20000) });
      if (!remote.ok || !Buffer.from(await remote.arrayBuffer()).equals(await readFile(join(uploads, name)))) throw new Error("Legacy image verification failed.");
    }
    console.log("Verification passed. Source MongoDB and local files were not modified or deleted.");
  }
} catch (error) {
  console.error("Migration stopped:", error.code || error.name, error.code ? "(credentials and source data not printed)" : error.message);
  process.exitCode = 1;
} finally {
  await source.close();
  if (client) await client.end({ timeout: 5 });
}
