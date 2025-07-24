// src/hooks/useCreateSubmission.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface CreateSubmissionData {
  content: string
  imageUrl?: string
  userName: string
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content, imageUrl, userName }: CreateSubmissionData) => {
      // Generate a temporary user ID for anonymous submissions
      const tempUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: tempUserId,
          user_name: userName,
          content,
          image_url: imageUrl
        })
        .select()
        .single()

      if (error) throw error
      
      // Return the created submission with its ID
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (error) => {
      console.error('Create submission error:', error)
    }
  })
}