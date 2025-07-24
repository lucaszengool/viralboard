// src/hooks/useSubmissions.ts
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { Submission, Comment } from '../types'

export function useSubmissions() {
  const { user } = useUser()

  return useQuery({
    queryKey: ['submissions', user?.id],
    queryFn: async () => {
      // Get submissions with vote counts
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (submissionsError) throw submissionsError

      // Get all comments for these submissions
      const submissionIds = submissions.map(s => s.id)
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .in('submission_id', submissionIds)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      // Get vote counts for each submission
      const { data: voteCounts, error: voteError } = await supabase
        .from('votes')
        .select('submission_id, vote_type')
        .in('submission_id', submissionIds)

      if (voteError) throw voteError

      // Get user's votes if logged in
      let userVotes: any[] = []
      if (user) {
        const { data: userVoteData, error: userVoteError } = await supabase
          .from('votes')
          .select('submission_id, vote_type')
          .eq('user_id', user.id)
          .in('submission_id', submissionIds)

        if (userVoteError) throw userVoteError
        userVotes = userVoteData || []
      }

      // Transform the data to match our Submission type
      const transformedSubmissions: Submission[] = submissions.map(submission => {
        // Group comments by submission
        const submissionComments = comments
          .filter(c => c.submission_id === submission.id)
          .map(c => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            content: c.content,
            createdAt: new Date(c.created_at)
          }))

        // Count votes
        const submissionVotes = voteCounts.filter(v => v.submission_id === submission.id)
        const likes = submissionVotes.filter(v => v.vote_type === 'like').length
        const dislikes = submissionVotes.filter(v => v.vote_type === 'dislike').length

        // Get user's vote for this submission
        const userVote = userVotes.find(v => v.submission_id === submission.id)

        return {
          id: submission.id,
          userId: submission.user_id,
          userName: submission.user_name,
          content: submission.content,
          imageUrl: submission.image_url,
          likes,
          dislikes,
          comments: submissionComments,
          createdAt: new Date(submission.created_at),
          isPrimeTime: submission.is_prime_time,
          isFlashMoment: submission.is_flash_moment,
          userVote: userVote?.vote_type || null
        }
      })

      return transformedSubmissions
    },
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}