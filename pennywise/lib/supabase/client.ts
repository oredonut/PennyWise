import { createBrowserClient } from '@supabase/ssr'

function getBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    )
  }
  return { url, key }
}

const { url, key } = getBrowserEnv()

/** Singleton browser Supabase client (`createBrowserClient` dedupes internally; one module instance). */
export const supabase = createBrowserClient(url, key)
