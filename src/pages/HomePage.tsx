import { useState } from 'react'
import { Trophy, Sparkles, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react'
import FullScreenBillboard from '../components/Billboard'
import { useSubmissions } from '../hooks/useSubmissions'

export default function HomePage() {
  const { data: submissions = [], isLoading } = useSubmissions()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return <FullScreenBillboard submissions={submissions} />
}