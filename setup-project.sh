# First, create all the necessary directories
mkdir -p src/pages src/hooks src/lib src/types src/components
mkdir -p server/routes

# Create pages
cat > src/pages/SubmissionPage.tsx << 'EOF'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Upload, DollarSign, AlertCircle } from 'lucide-react'
import { useCreateSubmission } from '../hooks/useCreateSubmission'
import { useBilling } from '../hooks/useBilling'

export default function SubmissionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { mutate: createSubmission } = useCreateSubmission()
  const { subscribe } = useBilling()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsProcessing(true)

    try {
      // First, handle the payment
      const subscribed = await subscribe()
      
      if (!subscribed) {
        alert('Payment failed. Please try again.')
        setIsProcessing(false)
        return
      }

      // Then create the submission
      createSubmission(
        { content, imageUrl },
        {
          onSuccess: () => {
            navigate('/')
          },
          onError: () => {
            alert('Failed to create submission. Please try again.')
            setIsProcessing(false)
          }
        }
      )
    } catch (error) {
      console.error('Submission error:', error)
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold mb-8">Create Submission</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[120px] resize-none"
              placeholder="What do you want to share with the world?"
              maxLength={280}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {content.length}/280 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Image URL (optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input flex-1"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="btn-secondary flex items-center space-x-2"
                onClick={() => alert('Image upload coming soon!')}
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {imageUrl && (
            <div className="mt-4">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={() => setImageUrl('')}
              />
            </div>
          )}

          <div className="bg-dark-300 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-accent-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Submission Fee: $1.00</p>
                <p className="text-gray-400">
                  This helps maintain quality and prevents spam. Your submission
                  will be live immediately after payment.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || isProcessing}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                <span>Pay $1 & Submit</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
EOF

cat > src/pages/SubmissionDetailPage.tsx << 'EOF'
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ThumbsUp, ThumbsDown, Share2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSubmission } from '../hooks/useSubmission'
import { useVote } from '../hooks/useVote'
import { useAddComment } from '../hooks/useAddComment'

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  
  const { data: submission, isLoading } = useSubmission(id!)
  const { vote } = useVote()
  const { mutate: addComment } = useAddComment()

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!id || submission?.userVote === type) return
    await vote.mutateAsync({ submissionId: id, type })
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !id) return

    addComment(
      { submissionId: id, content: comment },
      {
        onSuccess: () => setComment('')
      }
    )
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setShowShareModal(true)
    setTimeout(() => setShowShareModal(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-400 mb-4">Submission not found</p>
        <Link to="/" className="btn-secondary inline-flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Billboard</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Billboard</span>
      </Link>

      <div className="card mb-8">
        {submission.imageUrl && (
          <img
            src={submission.imageUrl}
            alt="Submission"
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="mb-6">
          <p className="text-xl mb-4">{submission.content}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span>@{submission.userName}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(submission.createdAt))} ago</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t border-dark-300 pt-6">
          <button
            onClick={() => handleVote('like')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              submission.userVote === 'like'
                ? 'bg-accent-success text-white'
                : 'bg-dark-400 hover:bg-dark-300'
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">{submission.likes}</span>
          </button>

          <button
            onClick={() => handleVote('dislike')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              submission.userVote === 'dislike'
                ? 'bg-accent-danger text-white'
                : 'bg-dark-400 hover:bg-dark-300'
            }`}
          >
            <ThumbsDown className="w-5 h-5" />
            <span className="font-medium">{submission.dislikes}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-6 py-3 bg-dark-400 rounded-lg hover:bg-dark-300 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 className="text-xl font-bold mb-6">
          Comments ({submission.comments.length})
        </h2>

        {user && (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input min-h-[80px] resize-none mb-3"
              placeholder="Add a comment..."
              required
            />
            <button type="submit" className="btn-primary">
              Post Comment
            </button>
          </form>
        )}

        <div className="space-y-4">
          {submission.comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-dark-300 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">@{comment.userName}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt))} ago
                </span>
              </div>
              <p className="text-gray-300">{comment.content}</p>
            </div>
          ))}
          
          {submission.comments.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              No comments yet. Be the first!
            </p>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-accent-success text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          Link copied to clipboard!
        </div>
      )}
    </div>
  )
}
EOF

cat > src/pages/LoginPage.tsx << 'EOF'
import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">
          Sign in to submit to the Billboard
        </h1>
        <SignIn 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-dark-200 border border-dark-300',
            },
          }}
          redirectUrl="/submit"
        />
      </div>
    </div>
  )
}
EOF

# Create lib files
cat > src/lib/api.ts << 'EOF'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await window.Clerk?.session?.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.error('Error getting auth token:', error)
  }
  return config
})
EOF

# Create hooks
cat > src/hooks/useSubmissions.ts << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Submission } from '../types'

export function useSubmissions() {
  return useQuery({
    queryKey: ['submissions'],
    queryFn: async (): Promise<Submission[]> => {
      const { data } = await api.get('/api/submissions')
      return data
    },
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  })
}
EOF

cat > src/hooks/useSubmission.ts << 'EOF'
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
EOF

cat > src/hooks/useCreateSubmission.ts << 'EOF'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { CreateSubmissionData } from '../types'

export function useCreateSubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSubmissionData) => {
      const response = await api.post('/api/submissions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
    },
  })
}
EOF

cat > src/hooks/useVote.ts << 'EOF'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface VoteData {
  submissionId: string
  type: 'like' | 'dislike'
}

export function useVote() {
  const queryClient = useQueryClient()

  const vote = useMutation({
    mutationFn: async ({ submissionId, type }: VoteData) => {
      const response = await api.post(`/api/submissions/${submissionId}/vote`, { type })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] })
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] })
    },
  })

  return { vote }
}
EOF

cat > src/hooks/useAddComment.ts << 'EOF'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

interface CommentData {
  submissionId: string
  content: string
}

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ submissionId, content }: CommentData) => {
      const response = await api.post(`/api/submissions/${submissionId}/comments`, { content })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] })
    },
  })
}
EOF

cat > src/hooks/useBilling.ts << 'EOF'
import { useAuth } from '@clerk/clerk-react'

export function useBilling() {
  const { isLoaded } = useAuth()
  const planId = import.meta.env.VITE_CLERK_PLAN_ID

  const subscribe = async () => {
    if (!isLoaded || !window.Clerk) {
      console.error('Clerk not loaded')
      return false
    }

    try {
      // Create a one-time subscription
      const response = await window.Clerk.billing.createCheckoutSession({
        planId,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
      })

      if (response.url) {
        window.location.href = response.url
        return true
      }
      
      return false
    } catch (error) {
      console.error('Billing error:', error)
      return false
    }
  }

  return { subscribe }
}
EOF

# Create server files
cat > server/index.js << 'EOF'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import submissionsRouter from './routes/submissions.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Routes
app.use('/api/submissions', submissionsRouter)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
EOF

cat > server/routes/submissions.js << 'EOF'
import express from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// In-memory storage (replace with database in production)
let submissions = []
let votes = {}
let comments = {}

// Helper to determine prime time (top 3 submissions by likes)
const updatePrimeTime = () => {
  const sorted = [...submissions].sort((a, b) => b.likes - a.likes)
  submissions.forEach(sub => {
    sub.isPrimeTime = sorted.slice(0, 3).some(s => s.id === sub.id)
  })
}

// Get all submissions
router.get('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId
    
    // Add user's vote status to each submission
    const submissionsWithVotes = submissions.map(sub => ({
      ...sub,
      userVote: votes[`${userId}-${sub.id}`] || null
    }))

    res.json(submissionsWithVotes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single submission
router.get('/:id', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.auth.userId
    
    const submission = submissions.find(s => s.id === id)
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.json({
      ...submission,
      userVote: votes[`${userId}-${id}`] || null,
      comments: comments[id] || []
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create submission
router.post('/', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { content, imageUrl } = req.body
    const { userId, sessionClaims } = req.auth
    
    const submission = {
      id: uuidv4(),
      userId,
      userName: sessionClaims.username || 'Anonymous',
      content,
      imageUrl,
      likes: 0,
      dislikes: 0,
      comments: [],
      createdAt: new Date(),
      isPrimeTime: false,
      isFlashMoment: false
    }

    submissions.unshift(submission)
    updatePrimeTime()

    res.status(201).json(submission)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Vote on submission
router.post('/:id/vote', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params
    const { type } = req.body
    const userId = req.auth.userId
    
    const submission = submissions.find(s => s.id === id)
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    const voteKey = `${userId}-${id}`
    const previousVote = votes[voteKey]

    // Remove previous vote
    if (previousVote) {
      if (previousVote === 'like') submission.likes--
      else submission.dislikes--
    }

    // Add new vote
    if (previousVote !== type) {
      votes[voteKey] = type
      if (type === 'like') submission.likes++
      else submission.dislikes++
    } else {
      // Toggle off if clicking same vote
      delete votes[voteKey]
    }

    updatePrimeTime()
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add comment
router.post('/:id/comments', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const { userId, sessionClaims } = req.auth
    
    const submission = submissions.find(s => s.id === id)
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    const comment = {
      id: uuidv4(),
      userId,
      userName: sessionClaims.username || 'Anonymous',
      content,
      createdAt: new Date()
    }

    if (!comments[id]) comments[id] = []
    comments[id].push(comment)
    submission.comments.push(comment)

    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
EOF

# Create config files
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
EOF

cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

cat > src/global.d.ts << 'EOF'
interface Window {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>
    }
    billing: {
      createCheckoutSession: (options: {
        planId: string
        successUrl: string
        cancelUrl: string
      }) => Promise<{ url?: string }>
    }
  }
}
EOF

# Create server package.json
cat > server/package.json << 'EOF'
{
  "type": "module"
}
EOF
