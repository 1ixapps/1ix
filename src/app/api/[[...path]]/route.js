import { createApi } from "../../../../server/api.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = createApi();
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
