export interface Submission {
  id: string
  userId: string
  userName: string
  content: string
  imageUrl?: string
  likes: number
  dislikes: number
  comments: Comment[]
  createdAt: Date
  isPrimeTime: boolean
  isFlashMoment: boolean
  userVote?: 'like' | 'dislike' | null
}

export interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: Date
}

export interface Vote {
  userId: string
  submissionId: string
  type: 'like' | 'dislike'
}

export interface CreateSubmissionData {
  content: string
  imageUrl?: string
}