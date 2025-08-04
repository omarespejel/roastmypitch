import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Force correct origin for production
  const isProduction = process.env.NODE_ENV === 'production'
  const origin = isProduction 
    ? 'https://starknet-founders-bot-frontend-zc93.onrender.com'
    : new URL(request.url).origin

  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Cookie setting error:', error)
            }
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
      }

      if (data.session) {
        // Successfully authenticated - redirect to home with correct origin
        console.log('Auth successful, redirecting to:', new URL(next, origin).toString())
        return NextResponse.redirect(new URL(next, origin))
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', origin))
}