import { fileURLToPath } from "node:url";
/** @type {import('next').NextConfig} */
const config = {
  // Keep existing React screens out of Next's Pages Router during migration.
  pageExtensions: ["next.js", "next.jsx"],
  poweredByHeader: false,
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  serverExternalPackages: ["postgres"],
  async headers() {
    return [{ source: "/api/:path*", headers: [
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ] }];
  },
};
export default config;
