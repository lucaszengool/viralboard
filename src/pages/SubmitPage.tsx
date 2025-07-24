import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Image, X, AlertCircle } from 'lucide-react'
import { useCreateSubmission } from '../hooks/useCreateSubmission'

export default function SubmitPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [userName, setUserName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const createSubmission = useCreateSubmission()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!content.trim()) {
      setError('Please enter a message')
      return
    }
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    try {
      await createSubmission.mutateAsync({
        content: content.trim(),
        userName: userName.trim(),
        imageUrl: imageUrl.trim() || undefined
      })
      navigate('/')
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-light mb-12">Submit Your Message</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Your Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500 transition-colors resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-1">{content.length}/500 characters</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image URL (optional)
              </div>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={() => {
                  setImageUrl('')
                  setError('Invalid image URL')
                }}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={createSubmission.isPending}
            className="w-full py-4 bg-green-500 text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createSubmission.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
