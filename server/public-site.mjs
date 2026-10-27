// Read-only public data. Metadata and crawler requests must never increment analytics.
export async function readPublicPage(db, username) {
  const page = await db.findOne("pages", { username: username.toLowerCase(), published: true });
  if (!page || page.suspended) return null;
  const services = await db.find("services", { user_id: page.user_id, active: true }, { limit: 200 });
  return { page, services };
}
export async function readSitemapPages(db) {
  return db.find("pages", { published: true, suspended: { $ne: true } }, { projection: { username: 1, updated_at: 1 }, sort: [["username", 1]], limit: 20000 });
}
