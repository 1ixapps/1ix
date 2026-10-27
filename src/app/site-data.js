import { cache } from "react";
import { getDatabase } from "../../server/database.mjs";
import { readPublicPage } from "../../server/public-site.mjs";

export const getPublicPage = cache(async (username) => {
  if (!process.env.DATABASE_URL) return null;
  // Deliberately let temporary database errors become 5xx, never a false 404.
  return readPublicPage(getDatabase(), username);
});
