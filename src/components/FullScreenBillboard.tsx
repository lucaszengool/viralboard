import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import { Trophy, Plus, MessageSquare, Send, Heart, HeartOff, User, Clock } from 'lucide-react'
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
  const [showDetails, setShowDetails] = useState(false)
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
      
      // Hide details when scrolling
      setShowDetails(false)
      
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
      setShowDetails(false)
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
        setShowDetails(false)
        isScrolling.current = true
        setCurrentIndex(prev => prev + 1)
        setTimeout(() => { isScrolling.current = false }, 300)
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setShowDetails(false)
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
      alert('Failed to vote. Please try again.')
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
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="w-full h-full flex flex-col items-center justify-center px-4">
          {/* Main message */}
          <div 
            className="text-center cursor-pointer max-w-6xl mx-auto mb-8"
            onClick={() => setShowDetails(!showDetails)}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-thin leading-tight text-white select-none px-4">
              {currentSubmission.content}
            </h1>
            
            {!showDetails && (
              <p className="text-gray-500 text-sm animate-pulse mt-4">Click to reveal details</p>
            )}
          </div>

          {/* Image if exists and details shown */}
          {showDetails && currentSubmission.imageUrl && (
            <div className="relative max-w-4xl mx-auto px-4 mb-8">
              <img
                src={currentSubmission.imageUrl}
                alt=""
                className="w-full max-h-[50vh] object-contain rounded-2xl shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Details - Only shown when clicked */}
          {showDetails && (
            <>
              {/* User info - Positioned better */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 flex items-center gap-3 animate-slide-in-left z-20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {currentSubmission.userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">@{currentSubmission.userName}</p>
                  <p className="text-sm text-gray-400">
                    {formatDistanceToNow(new Date(currentSubmission.createdAt))} ago
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="fixed right-4 md:right-8 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 animate-slide-in-right z-20">
                {/* Like button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote('like')
                  }}
                  className="flex flex-col items-center gap-2 group"
                  disabled={!isLoaded}
                >
                  <div className="p-3 md:p-4 bg-white/10 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all">
                    <Heart 
                      className={`w-8 h-8 md:w-10 md:h-10 transition-all group-hover:scale-110 ${
                        currentSubmission.userVote === 'like' 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-lg font-medium">{currentSubmission.likes}</span>
                </button>

                {/* Dislike button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVote('dislike')
                  }}
                  className="flex flex-col items-center gap-2 group"
                  disabled={!isLoaded}
                >
                  <div className="p-3 md:p-4 bg-white/10 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all">
                    <HeartOff 
                      className={`w-8 h-8 md:w-10 md:h-10 transition-all group-hover:scale-110 ${
                        currentSubmission.userVote === 'dislike' 
                          ? 'text-gray-500' 
                          : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-lg font-medium">{currentSubmission.dislikes}</span>
                </button>

                {/* Comment button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowComments(true)
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="p-3 md:p-4 bg-white/10 rounded-full backdrop-blur-sm group-hover:bg-white/20 transition-all">
                    <MessageSquare className="w-8 h-8 md:w-10 md:h-10 transition-all group-hover:scale-110" />
                  </div>
                  <span className="text-lg font-medium">{currentSubmission.comments.length}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Progress indicator */}
        <div className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {submissions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setShowDetails(false)
              }}
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-[40%] group z-50"
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
        className="fixed bottom-8 right-4 md:left-[60%] md:-translate-x-1/2 group z-50"
        type="button"
      >
        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
        <div className="relative flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full transition-all hover:bg-white/20 border border-white/20">
          <Trophy className="w-5 h-5" />
          <span className="hidden md:inline">Leaderboard</span>
        </div>
      </button>

      {/* Comments overlay */}
      {showComments && (
        <div className="fixed inset-0 bg-black/98 z-50 overflow-y-auto animate-fade-in backdrop-blur-xl">
          <div className="min-h-screen py-16">
            <div className="max-w-3xl mx-auto px-8">
              <button
                onClick={() => setShowComments(false)}
                className="text-3xl text-gray-600 hover:text-white transition-colors mb-8"
              >
                ×
              </button>

              <div className="mb-8">
                <h3 className="text-3xl mb-4 font-thin">{currentSubmission.content}</h3>
                <p className="text-gray-500 text-sm tracking-widest uppercase">@{currentSubmission.userName}</p>
              </div>

              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isSignedIn ? "Share your thoughts..." : "Sign in to comment"}
                    className="flex-1 px-6 py-3 bg-transparent border border-gray-800 rounded-full text-white placeholder-gray-600 focus:outline-none focus:border-white/50 transition-colors"
                    disabled={!isSignedIn || isSubmitting}
                  />
                  <button
                    type="submit"
                    className="p-3 border border-gray-800 rounded-full hover:border-white/50 hover:text-white transition-colors disabled:opacity-50"
                    disabled={!isSignedIn || isSubmitting || !comment.trim()}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {!isSignedIn && (
                  <p className="text-sm text-gray-500 mt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-green-400 hover:text-green-300"
                    >
                      Sign in
                    </button>
                    {' '}to comment on this message
                  </p>
                )}
              </form>

              <div className="space-y-6">
                {currentSubmission.comments.length === 0 ? (
                  <p className="text-gray-600 text-center py-12">No comments yet</p>
                ) : (
                  currentSubmission.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-900 pb-6">
                      <p className="text-lg mb-2 font-light">{comment.content}</p>
                      <p className="text-sm text-gray-600 tracking-wide">@{comment.userName} · {formatDistanceToNow(new Date(comment.createdAt))} ago</p>
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
        <div className="fixed inset-0 bg-black/98 z-50 overflow-y-auto backdrop-blur-xl animate-fade-in">
          <div className="min-h-screen py-16">
            <div className="max-w-4xl mx-auto px-8">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-5xl font-thin text-white tracking-wider">
                  Top Messages
                </h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-3xl text-gray-600 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {[...submissions]
                  .sort((a, b) => getNetVotes(b) - getNetVotes(a))
                  .slice(0, 20)
                  .map((submission, index) => (
                    <div
                      key={submission.id}
                      className="group flex items-center justify-between py-6 px-6 rounded-2xl bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => {
                        setCurrentIndex(submissions.indexOf(submission))
                        setShowLeaderboard(false)
                        setShowDetails(false)
                      }}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`text-3xl font-thin w-10 ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-2xl text-white font-light group-hover:translate-x-1 transition-transform">{submission.content}</p>
                          <p className="text-sm text-gray-500 mt-1">@{submission.userName}</p>
                        </div>
                      </div>
                      <div className={`text-2xl font-thin ${
                        getNetVotes(submission) > 0 ? 'text-green-400' : 
                        getNetVotes(submission) < 0 ? 'text-red-400' : 
                        'text-gray-500'
                      }`}>
                        {getNetVotes(submission) > 0 && '+'}{getNetVotes(submission)}
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
