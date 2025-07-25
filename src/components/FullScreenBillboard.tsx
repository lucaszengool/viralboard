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

  // Define getNetVotes function
  const getNetVotes = (submission: Submission): number => {
    return submission.likes - submission.dislikes
  }

  // Handle scroll with debouncing
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

  // Touch handling
  const touchStartY = useRef(0)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isScrolling.current) return
    
    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY.current - touchEndY

    if (Math.abs(diff) > 50) {
      isScrolling.current = true
      
      if (diff > 0 && currentIndex < submissions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
      }

      setTimeout(() => {
        isScrolling.current = false
      }, 300)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isScrolling.current) return
      
      if (e.key === 'ArrowDown' && currentIndex < submissions.length - 1) {
        isScrolling.current = true
        setCurrentIndex(prev => prev + 1)
        setTimeout(() => { isScrolling.current = false }, 300)
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        isScrolling.current = true
        setCurrentIndex(prev => prev - 1)
        setTimeout(() => { isScrolling.current = false }, 300)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
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
      alert('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/submission/${submissions[currentIndex].id}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl text-gray-600 mb-8 font-light">No messages yet</p>
          <button
            onClick={() => navigate('/submit')}
            className="px-8 py-3 text-black rounded-full transition-all transform hover:scale-105"
            style={{ backgroundColor: '#00ff41' }}
          >
            Submit First Message
          </button>
        </div>
      </div>
    )
  }

  const currentSubmission = submissions[currentIndex]

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main content - centered card style */}
      <div className="h-full flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Post Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
            {/* Header with user info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold">
                  {currentSubmission.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">@{currentSubmission.userName}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(currentSubmission.createdAt))} ago
                </p>
              </div>
            </div>

            {/* Message content */}
            <div className="mb-4">
              <p className="text-xl md:text-2xl text-white leading-relaxed">
                {currentSubmission.content}
              </p>
            </div>

            {/* Image if exists */}
            {currentSubmission.imageUrl && (
              <div className="mb-4 -mx-6">
                <img
                  src={currentSubmission.imageUrl}
                  alt=""
                  className="w-full max-h-[400px] object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex items-center gap-6">
                {/* Like button */}
                <button
                  onClick={() => handleVote('like')}
                  className="flex items-center gap-2 group transition-all"
                  disabled={!isLoaded}
                >
                  <Heart 
                    className={`w-6 h-6 transition-all group-hover:scale-110 ${
                      currentSubmission.userVote === 'like' 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400 group-hover:text-red-500'
                    }`}
                  />
                  <span className={`text-lg ${
                    currentSubmission.userVote === 'like' ? 'text-red-500' : 'text-gray-400'
                  }`}>{currentSubmission.likes}</span>
                </button>

                {/* Dislike button */}
                <button
                  onClick={() => handleVote('dislike')}
                  className="flex items-center gap-2 group transition-all"
                  disabled={!isLoaded}
                >
                  <HeartOff 
                    className={`w-6 h-6 transition-all group-hover:scale-110 ${
                      currentSubmission.userVote === 'dislike' 
                        ? 'text-gray-500' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className={`text-lg ${
                    currentSubmission.userVote === 'dislike' ? 'text-gray-500' : 'text-gray-400'
                  }`}>{currentSubmission.dislikes}</span>
                </button>

                {/* Comment button */}
                <button
                  onClick={() => setShowComments(true)}
                  className="flex items-center gap-2 group transition-all"
                >
                  <MessageSquare className="w-6 h-6 text-gray-400 group-hover:text-white transition-all group-hover:scale-110" />
                  <span className="text-lg text-gray-400">{currentSubmission.comments.length}</span>
                </button>
              </div>

              {/* Share button */}
              <button
                onClick={copyShareLink}
                className="p-2 hover:bg-gray-800 rounded-full transition-all"
              >
                <Share2 className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Navigation hints */}
          <div className="flex justify-center mt-6 gap-4 text-sm text-gray-500">
            {currentIndex > 0 && <span>↑ Previous</span>}
            {currentIndex < submissions.length - 1 && <span>↓ Next</span>}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {submissions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-1 h-12 bg-white' 
                  : 'w-1 h-1 bg-white/30 hover:bg-white/50'
              } rounded-full`}
            />
          ))}
        </div>
      </div>

      {/* Fixed UI Elements */}
      <Link
        to="/submit"
        className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-[35%] group z-50"
      >
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
        <div className="relative flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 text-black rounded-full transition-all font-medium backdrop-blur-sm"
             style={{ backgroundColor: '#00ff41' }}>
          <Plus className="w-5 h-5" />
          <span>Submit</span>
        </div>
      </Link>

      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-[65%] group z-50"
        type="button"
      >
        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
        <div className="relative flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full transition-all hover:bg-white/20 border border-white/20">
          <Trophy className="w-5 h-5" />
          <span>Leaderboard</span>
        </div>
      </button>

      {/* Comments overlay */}
      {showComments && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen py-8">
            <div className="max-w-2xl mx-auto px-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-light">Comments</h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-3xl text-gray-600 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Original post */}
              <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="font-bold">
                      {currentSubmission.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">@{currentSubmission.userName}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(currentSubmission.createdAt))} ago
                    </p>
                  </div>
                </div>
                <p className="text-lg">{currentSubmission.content}</p>
              </div>

              {/* Comment form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isSignedIn ? "Add a comment..." : "Sign in to comment"}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
                    disabled={!isSignedIn || isSubmitting}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
                    disabled={!isSignedIn || isSubmitting || !comment.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {!isSignedIn && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-green-400 hover:text-green-300"
                    >
                      Sign in
                    </button>
                    {' '}to comment
                  </p>
                )}
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {currentSubmission.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No comments yet</p>
                ) : (
                  currentSubmission.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-900/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">
                            {comment.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <p className="font-medium text-sm">@{comment.userName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt))} ago
                            </p>
                          </div>
                          <p className="text-gray-200">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard overlay */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen py-8">
            <div className="max-w-3xl mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-light text-white">
                  Top Messages
                </h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-3xl text-gray-600 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {[...submissions]
                  .sort((a, b) => getNetVotes(b) - getNetVotes(a))
                  .slice(0, 20)
                  .map((submission, index) => (
                    <div
                      key={submission.id}
                      className="group bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-900/70 transition-all cursor-pointer"
                      onClick={() => {
                        setCurrentIndex(submissions.indexOf(submission))
                        setShowLeaderboard(false)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-light w-8 text-center ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-500' :
                            'text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-lg text-white group-hover:translate-x-1 transition-transform">
                              {submission.content.length > 60 
                                ? submission.content.substring(0, 60) + '...' 
                                : submission.content}
                            </p>
                            <p className="text-sm text-gray-500">@{submission.userName}</p>
                          </div>
                        </div>
                        <div className={`text-xl font-light ${
                          getNetVotes(submission) > 0 ? 'text-green-400' : 
                          getNetVotes(submission) < 0 ? 'text-red-400' : 
                          'text-gray-500'
                        }`}>
                          {getNetVotes(submission) > 0 && '+'}{getNetVotes(submission)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
