import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Image, Upload, X, AlertCircle } from 'lucide-react'
import { useCreateSubmission } from '../hooks/useCreateSubmission'
import { supabase } from '../lib/supabase'

export default function SubmitPage() {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [userName, setUserName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createSubmission = useCreateSubmission()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setImageFile(file)
    setImageUrl('') // Clear URL if file is selected
    
    // Create preview
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filePath)

    setUploadProgress(100)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploadProgress(0)
    
    if (!content.trim()) {
      setError('Please enter a message')
      return
    }
    
    if (!userName.trim()) {
      setError('Please enter your name')
      return
    }

    try {
      let finalImageUrl = imageUrl

      // Upload image if file is selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile)
      }

      await createSubmission.mutateAsync({
        content: content.trim(),
        userName: userName.trim(),
        imageUrl: finalImageUrl || undefined
      })
      
      navigate('/')
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit. Please try again.')
      setUploadProgress(0)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
            <button
              type="button"
              onClick={() => setShowImageOptions(!showImageOptions)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
            >
              <Image className="w-5 h-5" />
              {showImageOptions ? 'Hide' : 'Add'} Image
            </button>
            
            {showImageOptions && (
              <div className="space-y-3">
                {/* Upload buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Upload from device
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* URL input */}
                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value)
                      setImageFile(null) // Clear file if URL is entered
                      setImagePreview('')
                    }}
                    placeholder="Or paste image URL: https://example.com/image.jpg"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                    disabled={!!imageFile}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image preview */}
          {(imagePreview || imageUrl) && (
            <div className="relative">
              <img
                src={imagePreview || imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={() => {
                  if (!imagePreview) {
                    setImageUrl('')
                    setError('Invalid image URL')
                  }
                }}
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={createSubmission.isPending || uploadProgress > 0}
            className="w-full py-4 bg-green-500 text-black font-medium rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createSubmission.isPending || uploadProgress > 0 ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {uploadProgress > 0 ? 'Uploading...' : 'Submitting...'}
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
