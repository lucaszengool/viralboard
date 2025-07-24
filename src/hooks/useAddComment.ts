import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CommentData {
  submissionId: string
  content: string
}

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ submissionId, content }: CommentData) => {
      const response = await api.post(`/api/submissions/${submissionId}/comments`, { content })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] })
    },
  })
}
