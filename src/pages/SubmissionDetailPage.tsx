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
