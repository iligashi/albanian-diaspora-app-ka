import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  // Script and style sources are left to Next.js; these directives lock down everything else.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["mongoose", "mongodb-memory-server"],
  // Delivery photos and voice notes are uploaded through server actions.
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
