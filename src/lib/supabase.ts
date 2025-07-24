// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: {
          id: string
          user_id: string
          user_name: string
          content: string
          image_url: string | null
          likes: number
          dislikes: number
          is_prime_time: boolean
          is_flash_moment: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name: string
          content: string
          image_url?: string | null
          likes?: number
          dislikes?: number
          is_prime_time?: boolean
          is_flash_moment?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string
          content?: string
          image_url?: string | null
          likes?: number
          dislikes?: number
          is_prime_time?: boolean
          is_flash_moment?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          user_name: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: string
          user_name: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: string
          user_name?: string
          content?: string
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          vote_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: string
          vote_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: string
          vote_type?: 'like' | 'dislike'
          created_at?: string
        }
      }
    }
  }
}