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

        console.log('Creating submission with:', { tempUserId, userName, content })

        const { data, error } = await supabase
          .from('submissions')
          .insert({
            user_id: tempUserId,
            user_name: userName,
            content,
            image_url: imageUrl || null,
            likes: 0,
            dislikes: 0,
            is_prime_time: false,
            is_flash_moment: false
          })
          .select()
          .single()

        if (error) {
          console.error('Supabase error details:', error)
          throw new Error(error.message || 'Failed to create submission')
        }
        
        console.log('Submission created successfully:', data)
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
    }
  })
}
