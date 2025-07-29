import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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