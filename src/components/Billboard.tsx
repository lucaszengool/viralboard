import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Trophy, Plus, MessageSquare, Send, Heart, HeartOff, Share2, ArrowLeft, Image, Upload, X } from 'lucide-react'
import { Submission } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { useVote } from '../hooks/useVote'
import { useCreateComment } from '../hooks/useCreateComment'
import { useCreateSubmission } from '../hooks/useCreateSubmission'
import { supabase } from '../lib/supabase'

interface FullScreenBillboardProps {
  submissions: Submission[]
}

export default function FullScreenBillboard({ submissions }: FullScreenBillboardProps) {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [comment, setComment] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const { vote } = useVote()
  const createComment = useCreateComment()
  const createSubmission = useCreateSubmission()

  // Randomize submissions with last one first
  const randomizedSubmissions = useMemo(() => {
    if (submissions.length === 0) return []
    
    // Sort by created date to get the last submitted
    const sortedByDate = [...submissions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    // Take the last submitted (most recent)
    const lastSubmitted = sortedByDate[0]
    
    // Randomize the rest
    const others = sortedByDate.slice(1)
    const shuffled = [...others].sort(() => Math.random() - 0.5)
    
    // Put last submitted first, then the randomized others
    return [lastSubmitted, ...shuffled]
  }, [submissions])

  const getNetVotes = (submission: Submission): number => {
    return submission.likes - submission.dislikes
  }

  // Handle scroll with TikTok-style animations - ONLY when detail is not shown
  useEffect(() => {
    const container = containerRef.current
    if (!container || showDetail) return

    let lastScrollTime = 0
    const scrollThreshold = 300
    let touchStartY = 0

    const handleScroll = (direction: 'up' | 'down') => {
      if (isScrolling.current || showDetail) return
      
      isScrolling.current = true
      setIsTransitioning(true)
      setScrollDirection(direction)

      setTimeout(() => {
        if (direction === 'down') {
          // Loop back to first if at the end
          if (currentIndex === randomizedSubmissions.length - 1) {
            setCurrentIndex(0)
          } else {
            setCurrentIndex(prev => prev + 1)
          }
        } else if (direction === 'up' && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1)
        }
        
        setTimeout(() => {
          setIsTransitioning(false)
          setScrollDirection(null)
          isScrolling.current = false
        }, 300)
      }, 100)
    }

    const handleWheel = (e: WheelEvent) => {
      if (showDetail) return // Don't handle wheel when detail is shown
      e.preventDefault()
      
      const now = Date.now()
      if (now - lastScrollTime < scrollThreshold) return
      
      lastScrollTime = now
      handleScroll(e.deltaY > 0 ? 'down' : 'up')
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (showDetail) return
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (showDetail) return
      const touchEndY = e.changedTouches[0].clientY
      const diff = touchStartY - touchEndY

      if (Math.abs(diff) > 50) {
        handleScroll(diff > 0 ? 'down' : 'up')
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentIndex, randomizedSubmissions.length, showDetail])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    setNewImageUrl('')
    setError('')
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    setUploadProgress(20)

    const { error: uploadError, data } = await supabase.storage
      .from('submissions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload image')
    }

    setUploadProgress(80)

    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)

    setUploadProgress(100)

    return publicUrl
  }

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isSignedIn) {
      navigate('/login')
      return
    }
    
    const submission = randomizedSubmissions[currentIndex]
    try {
      await vote.mutateAsync({ submissionId: submission.id, type })
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignedIn) {
      navigate('/login')
      return
    }
    
    if (!comment.trim()) return
    
    const submission = randomizedSubmissions[currentIndex]
    createComment.mutate(
      { submissionId: submission.id, content: comment },
      {
        onSuccess: () => {
          setComment('')
        }
      }
    )
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploadProgress(0)
    
    if (!newContent.trim() || !newUserName.trim()) {
      setError('Please fill in all fields')
      return
    }

    try {
      let finalImageUrl = newImageUrl

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile)
      }

      await createSubmission.mutateAsync({
        content: newContent,
        userName: newUserName,
        imageUrl: finalImageUrl || undefined
      })
      
      setShowSubmitModal(false)
      navigate('/')
    } catch (error) {
      console.error('Submit error:', error)
      setError('Failed to submit. Please try again.')
      setUploadProgress(0)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setNewImageUrl('')
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyToClipboard = () => {
    const shareUrl = `${window.location.origin}/submission/${randomizedSubmissions[currentIndex].id}`
    navigator.clipboard.writeText(shareUrl)
    alert('Link copied to clipboard!')
  }

  if (randomizedSubmissions.length === 0) {
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

  const currentSubmission = randomizedSubmissions[currentIndex]

  // Show detail view when clicked - Allow normal scrolling here
  if (showDetail) {
    return (
      <div className="fixed inset-0 bg-black/98 z-50 overflow-y-auto backdrop-blur-xl animate-fade-in">
        <div className="min-h-screen py-16">
          <div className="max-w-4xl mx-auto px-8">
            <button
              onClick={() => setShowDetail(false)}
              className="text-3xl text-gray-600 hover:text-white transition-colors mb-8"
            >
              ×
            </button>

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-light mb-4">{currentSubmission.content}</h1>
              
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span>@{currentSubmission.userName}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(currentSubmission.createdAt))} ago</span>
              </div>
            </div>

            {currentSubmission.imageUrl && (
              <div className="mb-8">
                <img
                  src={currentSubmission.imageUrl}
                  alt=""
                  className="w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className="flex items-center gap-6 mb-8">
              <button
                onClick={() => handleVote('like')}
                className="flex items-center gap-2 group"
              >
                <Heart 
                  className={`w-6 h-6 transition-colors ${
                    currentSubmission.userVote === 'like' 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-400 group-hover:text-red-500'
                  }`}
                />
                <span className="text-lg">{currentSubmission.likes}</span>
              </button>

              <button
                onClick={() => handleVote('dislike')}
                className="flex items-center gap-2 group"
              >
                <HeartOff 
                  className={`w-6 h-6 transition-colors ${
                    currentSubmission.userVote === 'dislike' 
                      ? 'text-gray-500' 
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="text-lg">{currentSubmission.dislikes}</span>
              </button>

              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-gray-400" />
                <span className="text-lg">{currentSubmission.comments.length}</span>
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 group ml-auto"
              >
                <Share2 className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <h2 className="text-2xl font-light mb-6">Comments</h2>
              
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={isSignedIn ? "Add a comment..." : "Sign in to comment"}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/50 transition-colors"
                    disabled={!isSignedIn}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    disabled={!isSignedIn}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {currentSubmission.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet</p>
                ) : (
                  currentSubmission.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-800 pb-4">
                      <p className="mb-2">{comment.content}</p>
                      <p className="text-sm text-gray-500">
                        @{comment.userName} · {formatDistanceToNow(new Date(comment.createdAt))} ago
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="fixed bottom-8 right-8 px-6 py-3 bg-green-500 text-black rounded-full font-medium hover:bg-green-400 transition-colors"
            >
              Submit New
            </button>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-2xl font-light mb-4">Share this message</h3>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={`${window.location.origin}/submission/${currentSubmission.id}`}
                  readOnly
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Main immersive view with TikTok-style animations
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
    >
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10"></div>
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ${
            isTransitioning ? 'scale-150 opacity-20' : 'scale-100 opacity-100'
          } animate-pulse`}
        ></div>
        <div 
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transition-all duration-1000 ${
            isTransitioning ? 'scale-150 opacity-20' : 'scale-100 opacity-100'
          } animate-pulse delay-1000`}
        ></div>
      </div>

      {/* Main content with scroll animations */}
      <div className="relative h-full flex items-center justify-center px-4 md:px-8">
        {/* Previous submission (for smooth transition effect) */}
        {currentIndex > 0 && scrollDirection === 'up' && (
          <div className="absolute w-full max-w-7xl mx-auto animate-slide-down-out">
            <div className="text-center px-4 md:px-16">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin leading-tight text-white mb-12 select-none opacity-50">
                {randomizedSubmissions[currentIndex - 1].content}
              </h1>
            </div>
          </div>
        )}

        {/* Next submission (for smooth transition effect) */}
        {scrollDirection === 'down' && (
          <div className="absolute w-full max-w-7xl mx-auto animate-slide-up-out">
            <div className="text-center px-4 md:px-16">
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin leading-tight text-white mb-12 select-none opacity-50">
                {randomizedSubmissions[currentIndex === randomizedSubmissions.length - 1 ? 0 : currentIndex + 1].content}
              </h1>
            </div>
          </div>
        )}

        {/* Current submission */}
        <div className={`w-full max-w-7xl mx-auto ${
          isTransitioning && scrollDirection === 'down' ? 'animate-slide-up' :
          isTransitioning && scrollDirection === 'up' ? 'animate-slide-down' :
          'animate-fade-in'
        }`}>
          <div 
            className="text-center px-4 md:px-16 cursor-pointer"
            onClick={() => setShowDetail(true)}
          >
            <h1 className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin leading-tight text-white mb-12 select-none transition-all duration-300 ${
              isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
            }`}>
              {currentSubmission.content}
            </h1>
            
            <p className={`text-gray-500 text-sm transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100 animate-pulse'
            }`}>
              Click to view details
            </p>
          </div>
        </div>

        {/* Progress indicator with animation */}
        <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {randomizedSubmissions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (index !== currentIndex) {
                  setIsTransitioning(true)
                  setScrollDirection(index > currentIndex ? 'down' : 'up')
                  setTimeout(() => {
                    setCurrentIndex(index)
                    setShowDetail(false)
                    setTimeout(() => {
                      setIsTransitioning(false)
                      setScrollDirection(null)
                    }, 300)
                  }, 100)
                }
              }}
              className={`transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-1 h-12 bg-white' 
                  : 'w-1 h-1 bg-white/30 hover:bg-white/50'
              } rounded-full`}
            />
          ))}
        </div>

        {/* Swipe hint animation */}
        {!isTransitioning && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
            <div className="w-8 h-8 border-2 border-white/30 rounded-full flex items-center justify-center">
              <div className="w-1 h-3 bg-white/30 rounded-full"></div>
            </div>
            <p className="text-xs text-white/30 mt-2">Swipe up</p>
          </div>
        )}
      </div>

      {/* Fixed UI Elements with fade effect during scroll */}
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Link
          to="/submit"
          className="fixed bottom-8 left-[40%] -translate-x-1/2 group z-50"
        >
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
          <div className="relative flex items-center gap-2 px-8 py-4 text-black rounded-full transition-all font-medium backdrop-blur-sm"
               style={{ backgroundColor: '#00ff41' }}>
            <Plus className="w-5 h-5" />
            <span>Submit</span>
          </div>
        </Link>

        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="fixed bottom-8 left-[60%] -translate-x-1/2 group z-50"
          type="button"
        >
          <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity scale-150"></div>
          <div className="relative flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full transition-all hover:bg-white/20 border border-white/20">
            <Trophy className="w-5 h-5" />
            <span>Leaderboard</span>
          </div>
        </button>
      </div>

      {/* Submit Modal - Same transparent style as leaderboard */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/98 z-50 overflow-y-auto backdrop-blur-xl animate-fade-in">
          <div className="min-h-screen py-16">
            <div className="max-w-2xl mx-auto px-8">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-5xl font-thin text-white tracking-wider">Submit New Message</h2>
                <button
                  onClick={() => {
                    setShowSubmitModal(false)
                    setNewContent('')
                    setNewUserName('')
                    clearImage()
                    setError('')
                  }}
                  className="text-3xl text-gray-600 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmitNew} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message</label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                    rows={3}
                    placeholder="What's on your mind?"
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{newContent.length}/500</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Image (optional)</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload from device
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value)
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      placeholder="Or paste image URL"
                      disabled={!!imageFile}
                    />
                  </div>
                </div>

                {(imagePreview || newImageUrl) && (
                  <div className="relative">
                    <img
                      src={imagePreview || newImageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                      onError={() => {
                        if (!imagePreview) {
                          setNewImageUrl('')
                          setError('Invalid image URL')
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1 bg-black/80 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createSubmission.isPending || uploadProgress > 0}
                    className="flex-1 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors font-medium disabled:opacity-50"
                  >
                    {createSubmission.isPending || uploadProgress > 0 ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitModal(false)
                      setNewContent('')
                      setNewUserName('')
                      clearImage()
                      setError('')
                    }}
                    className="flex-1 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
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
                        const indexInRandomized = randomizedSubmissions.findIndex(s => s.id === submission.id)
                        if (indexInRandomized !== -1) {
                          setCurrentIndex(indexInRandomized)
                          setShowLeaderboard(false)
                          setShowDetail(false)
                        }
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
                          <p className="text-2xl text-white font-light group-hover:translate-x-1 transition-transform">
                            {submission.content.length > 50 
                              ? submission.content.substring(0, 50) + '...' 
                              : submission.content}
                          </p>
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
