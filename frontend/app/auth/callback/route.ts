import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      // Use direct client instead of SSR helper to avoid webpack issues
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.session) {
        // Success - redirect to intended destination
        const redirectUrl = new URL(next, origin)
        const response = NextResponse.redirect(redirectUrl)
        
        // Set session cookies manually for SSR
        if (data.session.access_token) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: data.session.expires_in || 3600
          })
        }
        
        return response
      } else {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
    }
  }

  // No code parameter - redirect to error page
  return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
}