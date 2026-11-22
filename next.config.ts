import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // PGlite carga su WASM desde el disco y pg usa módulos nativos opcionales: sin empaquetar
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // las migraciones se leen del disco al abrir la base: que viajen con las funciones de Vercel
  outputFileTracingIncludes: { "/**": ["./db/migrations/**"] },
  poweredByHeader: false,
  // Capas del navegador: nadie puede meter el panel en un iframe de otro sitio para
  // engañar clics, ni adivinar tipos de archivo, ni leer de dónde vienes. Buscadores fuera.
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
  // URL corta para el webhook del panel de Meta: <tu dominio>/webhook
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
