import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

interface VoteData {
  submissionId: string
  type: 'like' | 'dislike'
}

export function useVote() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const vote = useMutation({
    mutationFn: async ({ submissionId, type }: VoteData) => {
      if (!user) throw new Error('User not authenticated')

      console.log('Voting with:', { userId: user.id, submissionId, type })

      // Check if user already voted
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing vote:', checkError)
        throw checkError
      }

      if (existingVote) {
        if (existingVote.vote_type === type) {
          // Remove vote (toggle off)
          const { error } = await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id)

          if (error) throw error
          return { action: 'removed' }
        } else {
          // Update vote type
          const { error } = await supabase
            .from('votes')
            .update({ vote_type: type })
            .eq('id', existingVote.id)

          if (error) throw error
          return { action: 'updated' }
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            submission_id: submissionId,
            user_id: user.id,
            vote_type: type
          })

        if (error) {
          console.error('Error creating vote:', error)
          throw error
        }
        return { action: 'created' }
      }
    },
    onSuccess: () => {
      // Invalidate and refetch submissions
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (error) => {
      console.error('Vote error:', error)
    }
  })

  return { vote }
}
