import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Submission } from '../types'

export function useSubmission(id: string) {
  return useQuery({
    queryKey: ['submission', id],
    queryFn: async (): Promise<Submission> => {
      const { data } = await api.get(`/api/submissions/${id}`)
      return data
    },
    enabled: !!id,
  })
}
