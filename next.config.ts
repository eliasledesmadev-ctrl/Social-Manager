import type { NextConfig } from "next";

const securityHeaders = [
  // Evita que el sitio sea embebido en iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita que el navegador intente adivinar el MIME type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla qué información de referencia se envía
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deshabilita features del navegador que no se usan
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Fuerza HTTPS (sólo activo en producción/HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // frame-ancestors como capa extra (refuerza X-Frame-Options en CSP)
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Elimina el header X-Powered-By: Next.js (no revelar stack)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      // CDN de imágenes de Instagram
      { protocol: "https", hostname: "**.cdninstagram.com" },
      // CDN de Facebook (thumbnails, imágenes)
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
