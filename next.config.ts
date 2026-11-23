import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Whether the repository has the workflow that brings new versions: the dashboard
// shows it in Settings › Updates and stops asking for it to be enabled.
const autoUpdate = existsSync(path.join(process.cwd(), ".github/workflows/actualizar-fchat.yml"));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // PGlite loads its WASM from disk and pg uses optional native modules: not bundled
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // migrations are read from disk when the database opens: they ship with the Vercel functions
  outputFileTracingIncludes: { "/**": ["./db/migrations/**"] },
  poweredByHeader: false,
  env: { FCHAT_AUTOUPDATE: autoUpdate ? "1" : "0" },
  // Browser safeguards: no other site can put the dashboard in an iframe to trick
  // clicks, guess file types or read where you came from. No search engines.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  // Short URL for the webhook in the Meta dashboard: <your domain>/webhook
  async rewrites() {
    return [{ source: "/webhook", destination: "/api/webhooks/instagram" }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
