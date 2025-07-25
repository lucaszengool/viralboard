import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Submission } from '../types'

export function useSubmission(id: string) {
  const { user } = useUser()
  
  return useQuery({
    queryKey: ['submission', id],
    queryFn: async (): Promise<Submission> => {
      // Get the submission without profile joins
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching submission:', error)
        throw error
      }
      
      if (!data) {
        throw new Error('Submission not found')
      }
      
      // Get comments for this submission
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('submission_id', id)
        .order('created_at', { ascending: true })
      
      if (commentsError) {
        console.error('Error fetching comments:', commentsError)
      }
      
      // Get votes for this submission
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('user_id, vote_type')
        .eq('submission_id', id)
      
      if (votesError) {
        console.error('Error fetching votes:', votesError)
      }
      
      // Count votes
      const likes = votes?.filter((v: any) => v.vote_type === 'like').length || 0
      const dislikes = votes?.filter((v: any) => v.vote_type === 'dislike').length || 0
      
      // Get user's vote if logged in
      let userVote = null
      if (user && votes) {
        const userVoteData = votes.find((v: any) => v.user_id === user.id)
        userVote = userVoteData?.vote_type || null
      }
      
      // Transform the data to match your Submission type
      return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        content: data.content,
        imageUrl: data.image_url,
        likes,
        dislikes,
        comments: comments?.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user_name,
          content: c.content,
          createdAt: new Date(c.created_at)
        })) || [],
        createdAt: new Date(data.created_at),
        isPrimeTime: data.is_prime_time || false,
        isFlashMoment: data.is_flash_moment || false,
        userVote
      }
    },
    enabled: !!id,
    retry: 1
  })
}
