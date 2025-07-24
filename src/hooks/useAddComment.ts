import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface CommentData {
  submissionId: string
  content: string
}

export function useAddComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ submissionId, content }: CommentData) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User must be logged in to comment')
      
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          submission_id: submissionId,
          content,
          user_id: user.id
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] })
      queryClient.invalidateQueries({ queryKey: ['comments', variables.submissionId] })
    },
  })
}
