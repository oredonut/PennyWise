import path from 'path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  // Pin file-tracing to this project's own directory. Pennywise is deployed
  // standalone (its folder is the Vercel upload root), so tracing must root
  // here — not at a parent. The previous `../../` resolved to `/` on Vercel's
  // build machine, which made the Next.js builder produce a doubled
  // `/vercel/pathN/vercel/pathN/.next` path and fail on routes-manifest.json.
  outputFileTracingRoot: __dirname,
};

export default config;
