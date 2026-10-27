import { randomUUID, createHash } from "node:crypto";
import { fail } from "../../http.mjs";
export const tokenFor = async (user, type = "access") => "test-" + type + "-" + user.id;
export function createTestAuth(users, password) {
  const accounts = new Map(users.map(user => [user.email, { id: user.id, email: user.email, password, email_confirmed_at: "2026-01-01T00:00:00Z", user_metadata: { name: user.name } }]));
  const issued = new Map(users.map(user => ["test-access-" + user.id, accounts.get(user.email)]));
  const refreshes = new Map(users.map(user => ["test-refresh-" + user.id, accounts.get(user.email)]));
  const failures = new Map();
  let serial = 0;
  const session = account => {
    const access_token = "provider-access-" + (++serial);
    const refresh_token = "provider-refresh-" + serial;
    issued.set(access_token, account); refreshes.set(refresh_token, account);
    return { access_token, refresh_token, expires_in: 3600, user: account };
  };
  const adapter = {
    settings: async () => ({ mailer_autoconfirm: false }),
    async signup(input, redirect, challenge) {
      if (!accounts.has(input.email)) accounts.set(input.email, { id: randomUUID(), email: input.email, password: input.password, user_metadata: { name: input.name }, challenge });
      return { user: { id: accounts.get(input.email).id } };
    },
    async login(input) {
      const count = failures.get(input.email) || 0;
      if (count >= 5) fail(429, "rate limited");
      const user = accounts.get(input.email);
      if (!user || user.password !== input.password) { failures.set(input.email, count + 1); fail(401, "invalid credentials"); }
      if (!user.email_confirmed_at) fail(403, "email not confirmed");
      failures.delete(input.email); return session(user);
    },
    async getUser(token) {
      const account = issued.get(token);
      if (!account) fail(401, "invalid token");
      return { ...account, password: undefined };
    },
    async refresh(token) {
      const account = refreshes.get(token);
      if (!account) fail(401, "invalid refresh");
      refreshes.delete(token); return session(account);
    },
    async verify(input) {
      const account = [...accounts.values()].find(account => account.email === input.token_hash);
      if (!account || account.used) fail(400, "invalid one-time token");
      account.email_confirmed_at = "2026-01-01T00:00:00Z"; account.used = true;
      return session(account);
    },
    async exchange(code, verifier) {
      const account = [...accounts.values()].find(account => account.email === code);
      if (!account || account.challenge !== createHash("sha256").update(verifier).digest("base64url")) fail(400, "invalid proof");
      account.email_confirmed_at = "2026-01-01T00:00:00Z"; return session(account);
    },
    async resend() {},
    async recover(email, redirect, challenge) { const account = accounts.get(email); if (account) { account.challenge = challenge; account.used = false; } },
    async updateProfile(token, input) {
      const account = issued.get(token);
      if (!account) fail(401, "invalid session");
      account.user_metadata = { ...account.user_metadata, name: input.name };
      return { ...account, password: undefined };
    },
    async updatePassword(token, nextPassword) { const account = issued.get(token); if (!account) fail(401, "invalid session"); account.password = nextPassword; },
    async logout(token) { issued.delete(token); },
    accounts,
  };
  return adapter;
}
