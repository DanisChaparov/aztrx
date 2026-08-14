/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Clickjacking: block framing outright (and via CSP frame-ancestors below).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Minimal CSP that cannot break the app. frame-ancestors mirrors
  // X-Frame-Options; base-uri blocks <base> tag injection. A full script/style
  // policy needs tuning against Next.js inline chunks + Supabase/Polar/Google
  // domains — roll it out later via Content-Security-Policy-Report-Only.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@focus-forge/core", "@focus-forge/ui", "@focus-forge/api-client"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
