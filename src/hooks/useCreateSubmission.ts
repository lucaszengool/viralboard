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
      try {
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

        if (error) {
          console.error('Supabase error:', error)
          throw new Error(error.message || 'Failed to create submission')
        }
        
        return data
      } catch (error) {
        console.error('Submission creation failed:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (error) => {
      console.error('Create submission error:', error)
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Failed to submit: ${error.message}`)
      } else {
        alert('Failed to submit. Please check your connection and try again.')
      }
    }
  })
}
