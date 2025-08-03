import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const createClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: use basic client to avoid SSR webpack issues
    const { createClient: createBaseClient } = require('@supabase/supabase-js')
    return createBaseClient(supabaseUrl, supabaseAnonKey)
  }
  
  // Client-side: use SSR-aware client
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Legacy client for backward compatibility during migration
export const supabase = createClient()

// Types for our tables
export interface ChatMessage {
  id?: number
  founder_id: string
  agent_type: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface ChatSession {
  id?: number
  founder_id: string
  agent_type: string
  started_at?: string
}

export interface Feedback {
  id?: number
  founder_id: string
  content: string
  rating?: number
  agent_type?: string
  created_at?: string
} 