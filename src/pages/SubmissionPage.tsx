import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Sparkles, X, Copy, Check, Share2 } from 'lucide-react'
import { useCreateSubmission } from '../hooks/useCreateSubmission'

export default function SubmissionPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [userName, setUserName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [submissionComplete, setSubmissionComplete] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  
  const { mutate: createSubmission } = useCreateSubmission()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !userName.trim()) return

    setIsProcessing(true)

    // Create the submission without payment
    createSubmission(
      { 
        content, 
        imageUrl,
        userName: userName.trim() 
      },
      {
        onSuccess: (data) => {
          // Generate shareable link
          const link = `${window.location.origin}/message/${data.id}`
          setShareLink(link)
          setSubmissionComplete(true)
          setIsProcessing(false)
        },
        onError: () => {
          alert('Failed to create submission. Please try again.')
          setIsProcessing(false)
        }
      }
    )
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out my message on ViralBoard!',
        text: content,
        url: shareLink
      })
    } else {
      handleCopyLink()
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImagePreview(url)
  }

  if (submissionComplete) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="spotlight spotlight-main"></div>
          <div className="stage-glow"></div>
        </div>

        {/* Success content */}
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="w-full max-w-2xl text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-zoom-in">
                <Check className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-5xl md:text-6xl font-thin mb-4 text-white animate-fade-in-up">
                Message Posted!
              </h1>
              <p className="text-xl text-gray-400 font-light">
                Share your message with the world
              </p>
            </div>

            {/* Share link */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10">
              <p className="text-sm text-gray-400 mb-3 uppercase tracking-widest">Your message link</p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/10 rounded-lg text-white text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
              >
                View Messages
              </button>
              
              <button
                onClick={() => {
                  setSubmissionComplete(false)
                  setContent('')
                  setUserName('')
                  setImageUrl('')
                  setImagePreview('')
                }}
                className="px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
              >
                Post Another
              </button>
            </div>

            {/* Preview */}
            <div className="mt-12 text-gray-500 text-sm">
              <p>Your message is now live on the billboard!</p>
              <p>Anyone with the link can view and interact with it.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="spotlight spotlight-main"></div>
        <div className="stage-glow"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative h-full flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-thin mb-4 text-white">
              <span className="inline-block animate-text-reveal">
                Share Your Message
              </span>
            </h1>
            <p className="text-xl text-gray-500 font-light">
              No sign up required • Free to post
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username input */}
            <div>
              <label className="block text-sm font-light text-gray-400 mb-3 uppercase tracking-widest">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-6 py-4 bg-transparent border border-gray-800 rounded-2xl text-white text-xl font-light placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all"
                placeholder="Enter any username"
                maxLength={50}
                required
              />
            </div>

            {/* Message input */}
            <div>
              <label className="block text-sm font-light text-gray-400 mb-3 uppercase tracking-widest">
                Your Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-6 py-4 bg-transparent border border-gray-800 rounded-2xl text-white text-xl font-light placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all resize-none"
                placeholder="What do you want the world to know?"
                rows={4}
                maxLength={280}
                required
              />
              <p className="text-xs text-gray-600 mt-2 text-right">
                {content.length}/280 characters
              </p>
            </div>

            {/* Image URL input */}
            <div>
              <label className="block text-sm font-light text-gray-400 mb-3 uppercase tracking-widest">
                Image URL (Optional)
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="flex-1 px-6 py-4 bg-transparent border border-gray-800 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-white/50 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  className="px-6 py-4 border border-gray-800 rounded-2xl text-gray-400 hover:text-white hover:border-white/50 transition-all group"
                  onClick={() => alert('Image upload coming soon!')}
                >
                  <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Image preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-64 rounded-xl"
                  onError={() => {
                    setImagePreview('')
                    setImageUrl('')
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('')
                    setImageUrl('')
                  }}
                  className="absolute -top-2 -right-2 p-2 bg-black/80 rounded-full border border-gray-800 hover:border-white/50 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!content.trim() || !userName.trim() || isProcessing}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-center gap-3 px-8 py-5 bg-green-500 text-black rounded-full font-light text-xl transition-all transform group-hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Submit Message</span>
                  </>
                )}
              </div>
            </button>

            {/* Info text */}
            <p className="text-center text-sm text-gray-500">
              Sign in to vote and comment on messages
            </p>
          </form>

          {/* Cancel button */}
          <button
            onClick={() => navigate('/')}
            className="mt-6 text-gray-600 hover:text-white transition-colors text-sm block mx-auto"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  )
}