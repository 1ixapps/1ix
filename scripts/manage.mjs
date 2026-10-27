import "./env.mjs";
import { projectDirectory } from "./env.mjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { fromPostgres } from "../server/database.mjs";

const command = process.argv[2];
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL in the project root .env or .env.local first.");
const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: process.env.DATABASE_SSLMODE === "disable" ? false : "require", connect_timeout: 30, onnotice: () => {} });
try {
  if (command === "migrate") {
    for (const name of ["202610200001_initial.sql", "202610200002_storage.sql", "202610220003_supabase_auth.sql"]) {
      const source = await readFile(join(projectDirectory, "supabase", "migrations", name), "utf8");
      await client.unsafe(source).simple();
      console.log("Applied:", name);
    }
  } else if (command === "admin") {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) throw new Error("Set ADMIN_EMAIL to a registered, email-confirmed Supabase account.");
    if (process.argv.includes("--reset-password")) throw new Error("Use Supabase password recovery; this tool never overwrites Auth passwords.");
    const db = fromPostgres(client);
    const existing = await db.findOne("users", { email });
    if (!existing?.supabase_auth_id || !existing.email_verified) throw new Error("Register, confirm the email, and sign in with Supabase before promoting this account.");
    await db.update("users", { id: existing.id }, { role: "admin" });
    console.log("Existing verified account promoted. Auth password, plan and ownership unchanged.");
  } else if (command === "cleanup-expired") {
    for (const name of ["password_reset_tokens", "phone_otps"]) {
      await client.unsafe('DELETE FROM app_private."' + name + '" WHERE (data->>\'expires_at\')::timestamptz < now()');
    }
    console.log("Expired reset and OTP records removed; business data unchanged.");
  } else {
    throw new Error("Usage: node scripts/manage.mjs migrate|admin|cleanup-expired");
  }
} catch (error) {
  console.error("Command failed:", error.code || error.name, error.code ? "(no secret values logged)" : error.message);
  process.exitCode = 1;
} finally { await client.end({ timeout: 5 }); }
