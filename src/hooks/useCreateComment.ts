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

      // For authenticated users, use their actual ID
      const userId = user.id
      const userName = user.username || user.firstName || 'Anonymous'

      console.log('Creating comment with:', { userId, userName, submissionId, content })

      const { data, error } = await supabase
        .from('comments')
        .insert({
          submission_id: submissionId,
          user_id: userId,
          user_name: userName,
          content
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
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
