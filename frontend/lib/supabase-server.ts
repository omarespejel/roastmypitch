import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client with proper cookie handling
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
              })
            })
          } catch (error) {
            // Server component - ignore cookie setting errors
            console.error('Server cookie error:', error)
          }
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false, // Server-side doesn't need auto-refresh
        detectSessionInUrl: false, // Server-side doesn't detect from URL
        persistSession: false, // Server-side doesn't persist sessions
      },
    }
  )
}