import { json } from "./http.mjs";
import { lastDays, tehranDate } from "./booking.mjs";

const statuses = [["pending", "در انتظار"], ["confirmed", "تأیید شده"], ["completed", "انجام شده"], ["canceled", "لغو شده"]];
const plans = [["free", "رایگان"], ["pro", "حرفه‌ای"], ["business", "کسب‌وکار"]];
const countBy = (items, key) => items.reduce((result, item) => { const value = key(item); if (value) result[value] = (result[value] || 0) + 1; return result; }, {});
const series = (days, counts) => days.map(date => ({ date, value: counts[date] || 0 }));
const bounded = (value, max) => Number.isFinite(Number(value)) ? Math.max(7, Math.min(max, Math.trunc(Number(value)))) : 14;

async function overviewSnapshot(db, user) {
  const [links, appts, page] = await Promise.all([
    db.find("links", { user_id: user.id }, { projection: { id: 1, slug: 1, title: 1, clicks: 1, active: 1 }, limit: 1000 }),
    db.find("appointments", { user_id: user.id }, { projection: { id: 1, date: 1, time: 1, status: 1, customer_name: 1, service_title: 1 }, limit: 5000 }),
    db.findOne("pages", { user_id: user.id }),
  ]);
  return { links, appts, page };
}
async function overviewStats(db, { links, appts, page }, dayCount) {
  const days = lastDays(dayCount), cutoff = new Date(Date.now() - (dayCount + 1) * 86400000).toISOString();
  const clicks = links.length ? await db.find("link_clicks", { link_id: { $in: links.map(link => link.id) }, at: { $gte: cutoff } }, { projection: { at: 1 }, limit: 10000 }) : [];
  const counts = countBy(appts, appt => appt.status || "pending");
  return {
    clicks_series: series(days, countBy(clicks, click => tehranDate(click.at))),
    appts_series: series(days, countBy(appts, appt => appt.date)),
    status_dist: statuses.map(([key, name]) => ({ key, name, value: counts[key] || 0 })),
    top_links: links.toSorted((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5).map(({ slug, title, clicks }) => ({ slug, title, clicks })),
    totals: { views: page?.views || 0, clicks: links.reduce((sum, link) => sum + (link.clicks || 0), 0), appointments: appts.length, pending: counts.pending || 0 },
    tz: "Asia/Tehran",
  };
}

export function statsRoutes(add) {
  add("GET", "/dashboard/overview", async ({ db, user }) => {
    // One authorization check, shared reads, and only the data shown on this screen.
    const [snapshot, unreadCount] = await Promise.all([
      overviewSnapshot(db, user),
      db.count("notifications", { user_id: user.id, read: false }),
    ]);
    const today = tehranDate();
    const upcoming = snapshot.appts.filter(item => ["pending", "confirmed"].includes(item.status || "pending") && item.date >= today)
      .toSorted((a, b) => (a.date + " " + a.time).localeCompare(b.date + " " + b.time));
    return json({
      page: snapshot.page, stats: await overviewStats(db, snapshot, 14),
      active_link_count: snapshot.links.filter(item => item.active !== false).length,
      upcoming: upcoming.slice(0, 5), upcoming_count: upcoming.length, unread_count: unreadCount,
    });
  }, "user");
  add("GET", "/stats/overview", async ({ db, user, url }) => {
    const dayCount = url.searchParams.has("days") ? bounded(url.searchParams.get("days"), 60) : 14;
    return json(await overviewStats(db, await overviewSnapshot(db, user), dayCount));
  }, "user");
  add("GET", "/admin/stats", async ({ db }) => json({
    users: await db.count("users"), pages: await db.count("pages"), published_pages: await db.count("pages", { published: true }),
    links: await db.count("links"), appointments: await db.count("appointments"), tickets: await db.count("support_tickets"),
    plans: { free: await db.count("users", { plan: "free" }), pro: await db.count("users", { plan: "pro" }), business: await db.count("users", { plan: "business" }) },
  }), "admin");
  add("GET", "/admin/stats/timeseries", async ({ db, url }) => {
    const dayCount = url.searchParams.has("days") ? bounded(url.searchParams.get("days"), 90) : 14;
    const days = lastDays(dayCount), cutoff = new Date(Date.now() - (dayCount + 1) * 86400000).toISOString();
    const users = await db.find("users", { created_at: { $gte: cutoff } }, { projection: { created_at: 1 }, limit: 5000 });
    const pages = await db.find("pages", { created_at: { $gte: cutoff } }, { projection: { created_at: 1 }, limit: 5000 });
    const appts = await db.find("appointments", { date: { $gte: days[0] } }, { projection: { date: 1 }, limit: 5000 });
    const distribution = [];
    for (const [key, name] of plans) distribution.push({ key, name, value: await db.count("users", { plan: key }) });
    return json({ users_series: series(days, countBy(users, item => tehranDate(item.created_at))),
      pages_series: series(days, countBy(pages, item => tehranDate(item.created_at))),
      appts_series: series(days, countBy(appts, item => item.date)), plan_dist: distribution, tz: "Asia/Tehran" });
  }, "admin");
}
