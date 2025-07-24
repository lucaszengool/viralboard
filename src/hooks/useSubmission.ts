import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Submission } from '../types'

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: async (): Promise<Submission> => {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          user:profiles(username),
          comments(
            id,
            content,
            created_at,
            user:profiles(username)
          ),
          votes(user_id)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      // Transform the data to match your Submission type
      return {
        ...data,
        vote_count: data.votes?.length || 0,
        comments: data.comments || []
      }
    },
    enabled: !!id,
  })
}
