import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowLeft, Heart, HeartOff, MessageSquare, Share2, Send, Image, Upload, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSubmission } from '../hooks/useSubmission'
import { useVote } from '../hooks/useVote'
import { useCreateComment } from '../hooks/useCreateComment'
import { useCreateSubmission } from '../hooks/useCreateSubmission'
import { supabase } from '../lib/supabase'

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { data: submission, isLoading } = useSubmission(id!)
  const { vote } = useVote()
  const createComment = useCreateComment()
  const createSubmission = useCreateSubmission()

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
    
    if (!submission) return
    
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
    
    if (!comment.trim() || !submission) return
    
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

  const shareUrl = `${window.location.origin}/submission/${id}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    alert('Link copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Submission not found</div>
      </div>
    )
  }

  const netVotes = submission.likes - submission.dislikes

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to board
        </button>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-light mb-4">{submission.content}</h1>
          
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>@{submission.userName}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(submission.createdAt))} ago</span>
          </div>
        </div>

        {submission.imageUrl && (
          <div className="mb-8">
            <img
              src={submission.imageUrl}
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
                submission.userVote === 'like' 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-400 group-hover:text-red-500'
              }`}
            />
            <span className="text-lg">{submission.likes}</span>
          </button>

          <button
            onClick={() => handleVote('dislike')}
            className="flex items-center gap-2 group"
          >
            <HeartOff 
              className={`w-6 h-6 transition-colors ${
                submission.userVote === 'dislike' 
                  ? 'text-gray-500' 
                  : 'text-gray-400 group-hover:text-gray-500'
              }`}
            />
            <span className="text-lg">{submission.dislikes}</span>
          </button>

          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-gray-400" />
            <span className="text-lg">{submission.comments.length}</span>
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
            {submission.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet</p>
            ) : (
              submission.comments.map((comment) => (
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-light mb-4">Share this message</h3>
            
            <div className="mb-4">
              <input
                type="text"
                value={shareUrl}
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

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full my-8">
            <h3 className="text-2xl font-light mb-6">Submit New Message</h3>
            
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
      )}
    </div>
  )
}
