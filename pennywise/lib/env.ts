function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Required environment variable ${key} is not set`)
  return value
}

// Getters throw at access time rather than module load, which avoids breaking
// `next build` in CI environments where not all vars are present at compile time.
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() { return required('NEXT_PUBLIC_SUPABASE_URL') },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return required('NEXT_PUBLIC_SUPABASE_ANON_KEY') },
  get SUPABASE_SERVICE_ROLE_KEY() { return required('SUPABASE_SERVICE_ROLE_KEY') },
  get ANTHROPIC_API_KEY() { return required('ANTHROPIC_API_KEY') },
}
