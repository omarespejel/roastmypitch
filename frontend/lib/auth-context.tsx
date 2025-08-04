"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { createClient } from './supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  signInWithOAuth: (provider: 'github') => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Auth session error:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in successfully:', session.user.email)
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signInWithMagicLink = async (email: string) => {
    try {
      // Determine correct redirect URL based on environment
      const getRedirectUrl = () => {
        if (typeof window !== 'undefined') {
          const isProduction = window.location.hostname.includes('onrender.com') || 
                               process.env.NODE_ENV === 'production'
          const redirectUrl = isProduction 
            ? 'https://starknet-founders-bot-frontend-zc93.onrender.com/auth/callback'
            : `${window.location.origin}/auth/callback`
          
          console.log('Magic Link redirect URL:', redirectUrl)
          return redirectUrl
        }
        return 'https://starknet-founders-bot-frontend-zc93.onrender.com/auth/callback'
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl(),
          shouldCreateUser: true,
        },
      })
      return { error }
    } catch (error) {
      console.error('Magic link error:', error)
      return { error: error as AuthError }
    }
  }

  const signInWithOAuth = async (provider: 'github') => {
    try {
      // Same environment-aware logic for OAuth
      const getRedirectUrl = () => {
        if (typeof window !== 'undefined') {
          const isProduction = window.location.hostname.includes('onrender.com') || 
                               process.env.NODE_ENV === 'production'
          const redirectUrl = isProduction 
            ? 'https://starknet-founders-bot-frontend-zc93.onrender.com/auth/callback'
            : `${window.location.origin}/auth/callback`
          
          console.log('OAuth redirect URL:', redirectUrl)
          return redirectUrl
        }
        return 'https://starknet-founders-bot-frontend-zc93.onrender.com/auth/callback'
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      })
      return { error }
    } catch (error) {
      console.error('OAuth error:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    loading,
    signInWithMagicLink,
    signInWithOAuth,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}