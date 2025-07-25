import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Trophy, Plus, MessageSquare, Send, Heart, HeartOff, Share2, Clock } from 'lucide-react'
import { Submission } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { useVote } from '../hooks/useVote'
import { useCreateComment } from '../hooks/useCreateComment'

interface FullScreenBillboardProps {
  submissions: Submission[]
}

export default function FullScreenBillboard({ submissions }: FullScreenBillboardProps) {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const { vote } = useVote()
  const createComment = useCreateComment()

  const getNetVotes = (submission: Submission): number => {
    return submission.likes - submission.dislikes
  }

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let lastScrollTime = 0
    const scrollThreshold = 300

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const now = Date.now()
      if (now - lastScrollTime < scrollThreshold) return
      
      if (isScrolling.current) return
      
      isScrolling.current = true
      lastScrollTime = now

      if (e.deltaY > 0 && currentIndex < submissions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
      }

      setTimeout(() => {
        isScrolling.current = false
      }, scrollThreshold)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [currentIndex, submissions.length])

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isLoaded) return
    
    if (!isSignedIn) {
      navigate('/login')
      return
    }
    
    const submission = submissions[currentIndex]
    try {
      await vote.mutateAsync({ submissionId: submission.id, type })
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return
    
    if (!isSignedIn) {
      navigate('/login')
      return
    }
    
    if (!comment.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    const submission = submissions[currentIndex]
    
    try {
      await createComment.mutateAsync({ 
        submissionId: submission.id, 
        content: comment.trim() 
      })
      setComment('')
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/submission/${submissions[currentIndex].id}`
    navigator.clipboard.writeText(url)
    alert('Link copied!')
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl text-gray-600 mb-8 font-light">No messages yet</p>
          <Link
            to="/submit"
            className="px-8 py-3 text-black rounded-full inline-block"
            style={{ backgroundColor: '#00ff41' }}
          >
            Submit First Message
          </Link>
        </div>
      </div>
    )
  }

  const currentSubmission = submissions[currentIndex]

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
    >
      {/* Main content area */}
      <div className="h-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Post Card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {currentSubmission.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">@{currentSubmission.userName}</p>
                <p className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(currentSubmission.createdAt))} ago
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              <p className="text-xl text-white whitespace-pre-wrap">
                {currentSubmission.content}
              </p>
            </div>

            {/* Image */}
            {currentSubmission.imageUrl && (
              <div className="relative">
                <img
                  src={currentSubmission.imageUrl}
                  alt=""
                  className="w-full max-h-[500px] object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-around">
              <button
                onClick={() => handleVote('like')}
                className="flex items-center gap-2 hover:text-red-500 transition-colors"
              >
                <Heart 
                  className={`w-6 h-6 ${
                    currentSubmission.userVote === 'like' 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-400'
                  }`}
                />
                <span className={currentSubmission.userVote === 'like' ? 'text-red-500' : ''}>
                  {currentSubmission.likes}
                </span>
              </button>

              <button
                onClick={() => handleVote('dislike')}
                className="flex items-center gap-2 hover:text-gray-500 transition-colors"
              >
                <HeartOff 
                  className={`w-6 h-6 ${
                    currentSubmission.userVote === 'dislike' 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                  }`}
                />
                <span className={currentSubmission.userVote === 'dislike' ? 'text-gray-500' : ''}>
                  {currentSubmission.dislikes}
                </span>
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-2 hover:text-blue-500 transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-gray-400" />
                <span>{currentSubmission.comments.length}</span>
              </button>

              <button
                onClick={copyShareLink}
                className="hover:text-blue-500 transition-colors"
              >
                <Share2 className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-6 gap-2">
            {submissions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-8' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <Link
          to="/submit"
          className="px-6 py-3 bg-green-500 text-black rounded-full font-medium hover:bg-green-400 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Submit
        </Link>

        <button
          onClick={() => setShowLeaderboard(true)}
          className="px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          Leaderboard
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light text-white">Comments</h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-3xl text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isSignedIn ? "Add a comment..." : "Sign in to comment"}
                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                    disabled={!isSignedIn || isSubmitting}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={!isSignedIn || isSubmitting || !comment.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {currentSubmission.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span>{comment.userName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">@{comment.userName}</span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                          </span>
                        </div>
                        <p className="text-gray-200">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-light text-white">Top Messages</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-3xl text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {[...submissions]
                  .sort((a, b) => getNetVotes(b) - getNetVotes(a))
                  .slice(0, 20)
                  .map((submission, index) => (
                    <button
                      key={submission.id}
                      onClick={() => {
                        setCurrentIndex(submissions.indexOf(submission))
                        setShowLeaderboard(false)
                      }}
                      className="w-full bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-500' :
                            'text-gray-500'
                          }`}>
                            #{index + 1}
                          </span>
                          <div>
                            <p className="text-white">
                              {submission.content.substring(0, 60)}
                              {submission.content.length > 60 ? '...' : ''}
                            </p>
                            <p className="text-sm text-gray-500">@{submission.userName}</p>
                          </div>
                        </div>
                        <span className={`text-xl ${
                          getNetVotes(submission) > 0 ? 'text-green-400' : 
                          getNetVotes(submission) < 0 ? 'text-red-400' : 
                          'text-gray-500'
                        }`}>
                          {getNetVotes(submission) > 0 && '+'}{getNetVotes(submission)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
