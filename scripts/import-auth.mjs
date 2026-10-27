import "./env.mjs";
import postgres from "postgres";
import { fromPostgres } from "../server/database.mjs";

const apply = process.argv.includes("--apply");
if (apply && !process.argv.includes("--maintenance-confirmed")) throw new Error("Back up data and stop old-auth writes before --apply --maintenance-confirmed.");
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL locally.");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: "require", connect_timeout: 30, onnotice: () => {} });
try {
  const db = fromPostgres(sql);
  const pending = await db.find("users", { supabase_auth_id: null }, { limit: 20000 });
  if (pending.length >= 20000) throw new Error("Migration must be paginated before processing 20000+ accounts.");
  const eligible = pending.filter(user => typeof user.email === "string" && /^\$2[aby]\$\d{2}\$/.test(user.password_hash || "") && !user.suspended);
  console.log("Legacy profiles without Auth ID:", pending.length, "Eligible bcrypt accounts:", eligible.length);
  if (!apply) console.log("Read-only check. No Auth account was created. Use --apply --maintenance-confirmed explicitly.");
  else {
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = new URL(process.env.SUPABASE_URL || "");
    if (!key || url.protocol !== "https:") throw new Error("Configure the matching SUPABASE_URL and server-only secret key.");
    const headers = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("eyJ") ? { Authorization: "Bearer " + key } : {}) };
    const request = async (path, init = {}) => {
      const response = await fetch(url.origin + "/auth/v1/admin" + path, { ...init, headers, signal: AbortSignal.timeout(20000), redirect: "error" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error("Auth import stopped; existing credentials were not overwritten."), { code: "AUTH_IMPORT_" + response.status });
      return data;
    };
    const existingByEmail = new Map();
    for (let page = 1; ; page++) {
      const batch = await request("/users?page=" + page + "&per_page=200");
      for (const user of batch.users || []) if (user.email) existingByEmail.set(user.email.toLowerCase(), user);
      if ((batch.users || []).length < 200) break;
    }
    let imported = 0, linked = 0;
    for (const profile of eligible) {
      const email = profile.email.trim().toLowerCase();
      let identity = existingByEmail.get(email);
      if (!identity) {
        identity = await request("/users", { method: "POST", body: JSON.stringify({ email, password_hash: profile.password_hash, email_confirm: profile.email_verified === true, user_metadata: { name: profile.name || "" } }) });
        identity = identity.user || identity;
        if (!identity.id || identity.email?.toLowerCase() !== email) throw new Error("Auth returned an unexpected identity.");
        existingByEmail.set(email, identity); imported++;
      } else {
        // Never overwrite an existing Supabase password, identity or email-confirmation state.
        if (!identity.email_confirmed_at) throw new Error("An unconfirmed existing Auth account needs manual review. No password was overwritten.");
        linked++;
      }
      await db.transaction(async tx => {
        await tx.advisoryLock("supabase-profile:" + email);
        const current = await tx.findOne("users", { id: profile.id });
        if (!current || current.email !== profile.email || current.supabase_auth_id && current.supabase_auth_id !== identity.id) throw new Error("Profile changed; stop old-auth writes and retry.");
        await tx.update("users", { id: profile.id }, { supabase_auth_id: identity.id, email_verified: Boolean(identity.email_confirmed_at) });
      });
    }
    console.log("Auth import finished. Created:", imported, "Linked existing verified identities:", linked);
    console.log("Original profile IDs, passwords in source, roles, plans and business ownership were preserved.");
    console.log("Unverified migrated accounts must verify email using Supabase recovery before signing in.");
  }
} catch (error) {
  console.error("Auth migration stopped:", /^[A-Z0-9_]+$/.test(String(error.code)) ? error.code : error.name);
  process.exitCode = 1;
} finally { await sql.end({ timeout: 5 }); }
