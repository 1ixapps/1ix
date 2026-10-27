import { fileURLToPath } from "node:url";
/** @type {import('next').NextConfig} */
const config = {
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
