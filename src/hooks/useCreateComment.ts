// src/hooks/useCreateComment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

interface CreateCommentData {
  submissionId: string
  content: string
}

export function useCreateComment() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ submissionId, content }: CreateCommentData) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('comments')
        .insert({
          submission_id: submissionId,
          user_id: user.id,
          user_name: user.username || user.firstName || 'Anonymous',
          content
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (error) => {
      console.error('Comment error:', error)
    }
  })
}