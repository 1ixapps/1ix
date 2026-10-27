import postgres from "postgres";
import { randomUUID } from "node:crypto";

export const TABLES = ["users", "pages", "links", "link_clicks", "services", "appointments", "notifications", "password_reset_tokens", "phone_otps", "login_attempts", "support_tickets", "announcements"];
function table(name) {
  if (!TABLES.includes(name)) throw new Error("Unknown database entity");
  return '"app_private"."' + name + '"';
}
function field(name, text = false) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error("Invalid database field");
  return "data" + (text ? "->>" : "->") + "'" + name + "'";
}
export function compileWhere(query = {}, values = []) {
  const bind = (value, json = true) => { values.push(json ? JSON.stringify(value) : value); return "$" + values.length + (json ? "::jsonb" : ""); };
  const clauses = [];
  for (const [key, condition] of Object.entries(query)) {
    if (key === "$or" || key === "$and") {
      if (!Array.isArray(condition) || !condition.length) throw new Error("Invalid logical filter");
      clauses.push("(" + condition.map(child => compileWhere(child, values).text).join(key === "$or" ? " OR " : " AND ") + ")");
      continue;
    }
    const expression = field(key);
    const operators = condition && typeof condition === "object" && !Array.isArray(condition) && Object.keys(condition).some(k => k.startsWith("$")) ? condition : { $eq: condition };
    for (const [operator, expected] of Object.entries(operators)) {
      if (operator === "$options") continue;
      if (operator === "$exists") clauses.push(expression + (expected ? " IS NOT NULL" : " IS NULL"));
      else if (operator === "$regex") {
        // User search is a literal substring, never an executable SQL/regex fragment.
        const insensitive = operators.$options?.includes("i");
        const value = bind(expected, false);
        clauses.push("POSITION(" + (insensitive ? "lower(" + value + ")" : value) + " IN " + (insensitive ? "lower(" + field(key, true) + ")" : field(key, true)) + ") > 0");
      } else if (operator === "$in") {
        if (!Array.isArray(expected)) throw new Error("Invalid membership filter");
        clauses.push(expected.length ? expression + " IN (" + expected.map(item => bind(item)).join(",") + ")" : "FALSE");
      } else if (operator === "$eq" && expected === null) clauses.push("(" + expression + " IS NULL OR " + expression + " = 'null'::jsonb)");
      else {
        const comparison = { $eq: "=", $ne: "IS DISTINCT FROM", $gte: ">=", $gt: ">", $lte: "<=", $lt: "<" }[operator];
        if (!comparison) throw new Error("Unsupported database filter");
        clauses.push(expression + " " + comparison + " " + bind(expected));
      }
    }
  }
  return { text: clauses.length ? clauses.map(c => "(" + c + ")").join(" AND ") : "TRUE", values };
}
export function project(data, projection) {
  if (!projection) return structuredClone(data);
  const includes = Object.entries(projection).filter(([key, value]) => value && key !== "_id").map(([key]) => key);
  return Object.fromEntries(Object.entries(data).filter(([key]) => includes.length ? includes.includes(key) : projection[key] !== 0));
}

export function createDatabase(executor) {
  const query = (text, values = []) => executor.query(text, values);
  const db = {
    query,
    transaction: callback => executor.transaction(tx => callback(tx)),
    async advisoryLock(key) { await query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key]); },
    async find(entity, filter = {}, { projection, sort = [], limit = 1000 } = {}) {
      const { text, values } = compileWhere(filter);
      const order = sort.length ? " ORDER BY " + sort.map(([key, direction]) => field(key) + (direction === -1 ? " DESC NULLS LAST" : " ASC NULLS FIRST")).join(",") : "";
      values.push(Math.max(0, Math.min(20000, limit)));
      const rows = await query("SELECT data FROM " + table(entity) + " WHERE " + text + order + " LIMIT $" + values.length, values);
      return rows.map(row => project(row.data, projection));
    },
    async findOne(entity, filter, projection) {
      return (await db.find(entity, filter, { projection, limit: 1 }))[0] || null;
    },
    async count(entity, filter = {}) {
      const { text, values } = compileWhere(filter);
      return Number((await query("SELECT count(*) AS total FROM " + table(entity) + " WHERE " + text, values))[0].total);
    },
    async insert(entity, document, { identifier = document.id || randomUUID(), skipExisting = false } = {}) {
      const result = await query("INSERT INTO " + table(entity) + " (id, data) VALUES ($1, $2::jsonb)" + (skipExisting ? " ON CONFLICT (id) DO NOTHING" : "") + " RETURNING id", [identifier, JSON.stringify(document)]);
      return result.length > 0;
    },
    async update(entity, filter, patch, { increments = {}, many = false } = {}) {
      Object.keys(patch).forEach(key => field(key));
      const values = [JSON.stringify(patch)];
      let expression = "data || $1::jsonb";
      for (const [key, increment] of Object.entries(increments)) {
        if (!Number.isFinite(increment)) throw new Error("Invalid increment");
        values.push(increment);
        expression = "jsonb_set(" + expression + ", ARRAY['" + (field(key), key) + "']::text[], to_jsonb(COALESCE((" + field(key, true) + ")::numeric,0) + $" + values.length + "::numeric), true)";
      }
      const condition = compileWhere(filter, values).text;
      const where = many ? condition : "id = (SELECT id FROM " + table(entity) + " WHERE " + condition + " LIMIT 1 FOR UPDATE)";
      return (await query("UPDATE " + table(entity) + " SET data = " + expression + " WHERE " + where + " RETURNING id", values)).length;
    },
    async upsert(entity, uniqueKey, value, patch) {
      const allowed = { login_attempts: "identifier", phone_otps: "user_id" };
      if (allowed[entity] !== uniqueKey) throw new Error("Unsupported upsert");
      const document = { ...patch, [uniqueKey]: value };
      await query("INSERT INTO " + table(entity) + " AS target (id, data) VALUES ($1,$2::jsonb) ON CONFLICT ((" + field(uniqueKey) + ")) DO UPDATE SET data = target.data || EXCLUDED.data", [randomUUID(), JSON.stringify(document)]);
    },
    async remove(entity, filter) {
      const { text, values } = compileWhere(filter);
      return (await query("DELETE FROM " + table(entity) + " WHERE id = (SELECT id FROM " + table(entity) + " WHERE " + text + " LIMIT 1 FOR UPDATE) RETURNING id", values)).length;
    },
    async customers(userId) {
      const rows = await query(`WITH ranked AS (
        SELECT data, row_number() OVER w AS rn, count(*) OVER p AS total,
          count(*) FILTER (WHERE data->>'status'='completed') OVER p AS completed,
          count(*) FILTER (WHERE data->>'status'='canceled') OVER p AS canceled
        FROM app_private.appointments WHERE data->'user_id'=$1::jsonb
        WINDOW p AS (PARTITION BY data->>'customer_phone'),
          w AS (PARTITION BY data->>'customer_phone' ORDER BY data->>'date' DESC,data->>'time' DESC)
      ) SELECT jsonb_build_object('name',data->'customer_name','phone',data->'customer_phone',
        'email',data->'customer_email','total',total,'last_date',data->'date',
        'last_status',data->'status','completed',completed,'canceled',canceled) AS data
        FROM ranked WHERE rn=1 ORDER BY total DESC,data->>'date' DESC LIMIT 500`, [JSON.stringify(userId)]);
      return rows.map(row => row.data);
    },
  };
  return db;
}

export function fromPostgres(client) {
  return createDatabase({
    query: (text, values = []) => {
      // Postgres.js serializes parameters inferred as jsonb. Do not serialize twice.
      const jsonIndexes = new Set([...text.matchAll(/\$(\d+)::jsonb\b/g)].map(match => Number(match[1]) - 1));
      return client.unsafe(text, values.map((value, index) => jsonIndexes.has(index) ? client.json(JSON.parse(value)) : value));
    },
    transaction: callback => client.begin(tx => callback(fromPostgres(tx))),
  });
}
let client;
export function getDatabase() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error("Database not configured"), { code: "CONFIGURATION" });
  client ||= postgres(process.env.DATABASE_URL, {
    max: 1, prepare: false, ssl: process.env.DATABASE_SSLMODE === "disable" && process.env.NODE_ENV !== "production" ? false : "require",
    idle_timeout: 20, connect_timeout: 10,
    connection: { statement_timeout: 20000 },
    onnotice: () => {},
  });
  return fromPostgres(client);
}
