# Create .env file
cat > .env << 'EOF'
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
VITE_API_URL=http://localhost:3001
DATABASE_URL=your_database_url
PORT=3001
VITE_CLERK_PLAN_ID=cplan_30GymMgoNLQgK2wXBREwG2i7Igh
EOF

# Create .env.example file
cat > .env.example << 'EOF'
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
VITE_API_URL=
DATABASE_URL=
PORT=3001
VITE_CLERK_PLAN_ID=
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "viral-billboard",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"vite\"",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "start": "node server/index.js",
    "server": "nodemon server/index.js"
  },
  "dependencies": {
    "@clerk/clerk-react": "^4.30.0",
    "@clerk/clerk-sdk-node": "^4.13.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "cors": "^2.8.5",
    "date-fns": "^3.2.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "lucide-react": "^0.303.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "concurrently": "^8.2.2",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "nodemon": "^3.0.2",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          100: '#1a1a1a',
          200: '#2a2a2a',
          300: '#3a3a3a',
          400: '#4a4a4a',
        },
        accent: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          success: '#10b981',
          danger: '#ef4444',
        }
      },
      animation: {
        'scroll': 'scroll 30s linear infinite',
        'flash': 'flash 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
EOF

# Create src/main.tsx
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
EOF

# Create src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-black text-white antialiased;
  }

  * {
    @apply border-dark-300;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-dark-100;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-dark-400 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-dark-300;
  }
}

@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-accent-primary text-white rounded-lg font-medium 
           transition-all duration-200 hover:bg-blue-600 active:scale-95
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-dark-300 text-white rounded-lg font-medium 
           transition-all duration-200 hover:bg-dark-400 active:scale-95
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .card {
    @apply bg-dark-200 rounded-xl border border-dark-300 p-6
           transition-all duration-200 hover:border-dark-400;
  }

  .input {
    @apply w-full px-4 py-3 bg-dark-300 rounded-lg border border-dark-400
           focus:outline-none focus:border-accent-primary transition-colors
           placeholder-gray-500;
  }

  .billboard-item {
    @apply relative overflow-hidden rounded-xl bg-gradient-to-br 
           transition-all duration-300 hover:scale-[1.02];
  }

  .flash-highlight {
    @apply absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 
           animate-pulse pointer-events-none;
  }
}
EOF

# Create src/App.tsx
cat > src/App.tsx << 'EOF'
import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import SubmissionPage from './pages/SubmissionPage'
import LoginPage from './pages/LoginPage'
import SubmissionDetailPage from './pages/SubmissionDetailPage'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submission/:id" element={<SubmissionDetailPage />} />
          <Route
            path="/submit"
            element={
              <>
                <SignedIn>
                  <SubmissionPage />
                </SignedIn>
                <SignedOut>
                  <LoginPage />
                </SignedOut>
              </>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
EOF

# Create src/types/index.ts
cat > src/types/index.ts << 'EOF'
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
EOF

# Create src/components/Header.tsx
cat > src/components/Header.tsx << 'EOF'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react'
import { Plus, Zap } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-100/80 backdrop-blur-lg border-b border-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-accent-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
              ViralBoard
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <SignedIn>
              <Link
                to="/submit"
                className="flex items-center space-x-2 btn-primary text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Submit ($1)</span>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-secondary text-sm">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  )
}
EOF

# Create src/components/Billboard.tsx
cat > src/components/Billboard.tsx << 'EOF'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ThumbsUp, ThumbsDown, MessageSquare, Crown, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Submission } from '../types'
import { useVote } from '../hooks/useVote'

interface BillboardProps {
  submissions: Submission[]
  isAutoScroll?: boolean
}

export default function Billboard({ submissions, isAutoScroll = false }: BillboardProps) {
  const [flashIndex, setFlashIndex] = useState<number | null>(null)
  const { vote } = useVote()

  // Flash moment logic
  useEffect(() => {
    if (!isAutoScroll) return

    const flashInterval = setInterval(() => {
      // 10% chance of flash moment every 5 seconds
      if (Math.random() < 0.1 && submissions.length > 0) {
        const randomIndex = Math.floor(Math.random() * submissions.length)
        setFlashIndex(randomIndex)
        
        // Clear flash after 5 seconds
        setTimeout(() => setFlashIndex(null), 5000)
      }
    }, 5000)

    return () => clearInterval(flashInterval)
  }, [submissions, isAutoScroll])

  const handleVote = async (submissionId: string, type: 'like' | 'dislike', currentVote?: string | null) => {
    if (currentVote === type) return
    await vote.mutateAsync({ submissionId, type })
  }

  return (
    <div className={`space-y-4 ${isAutoScroll ? 'animate-scroll' : ''}`}>
      {submissions.map((submission, index) => (
        <div
          key={submission.id}
          className={`billboard-item p-6 ${
            submission.isPrimeTime
              ? 'from-accent-primary/20 to-accent-secondary/20 border-2 border-accent-primary'
              : 'from-dark-300 to-dark-200'
          }`}
        >
          {/* Flash highlight */}
          {flashIndex === index && <div className="flash-highlight" />}
          
          {/* Prime time badge */}
          {submission.isPrimeTime && (
            <div className="absolute top-4 right-4 flex items-center space-x-1 bg-accent-primary px-3 py-1 rounded-full text-xs font-bold">
              <Crown className="w-3 h-3" />
              <span>PRIME TIME</span>
            </div>
          )}

          {/* Flash moment badge */}
          {flashIndex === index && (
            <div className="absolute top-4 left-4 flex items-center space-x-1 bg-yellow-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              <Zap className="w-3 h-3" />
              <span>FLASH MOMENT!</span>
            </div>
          )}

          <Link to={`/submission/${submission.id}`} className="block">
            {/* Content */}
            <div className="mb-4">
              {submission.imageUrl && (
                <img
                  src={submission.imageUrl}
                  alt="Submission"
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <p className="text-lg">{submission.content}</p>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span>@{submission.userName}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(submission.createdAt))} ago</span>
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={(e) => {
                e.preventDefault()
                handleVote(submission.id, 'like', submission.userVote)
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                submission.userVote === 'like'
                  ? 'bg-accent-success text-white'
                  : 'bg-dark-400 hover:bg-dark-300'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{submission.likes}</span>
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                handleVote(submission.id, 'dislike', submission.userVote)
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                submission.userVote === 'dislike'
                  ? 'bg-accent-danger text-white'
                  : 'bg-dark-400 hover:bg-dark-300'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{submission.dislikes}</span>
            </button>

            <Link
              to={`/submission/${submission.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-dark-400 rounded-lg hover:bg-dark-300 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{submission.comments.length}</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
EOF

# Create src/pages/HomePage.tsx
cat > src/pages/HomePage.tsx << 'EOF'
import { useState } from 'react'
import { Trophy, Clock } from 'lucide-react'
import Billboard from '../components/Billboard'
import { useSubmissions } from '../hooks/useSubmissions'

export default function HomePage() {
  const [view, setView] = useState<'live' | 'top'>('live')
  const { data: submissions = [], isLoading } = useSubmissions()

  const topSubmissions = [...submissions]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Billboard - Auto-scrolling */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Clock className="w-6 h-6 text-accent-primary" />
                <span>Live Billboard</span>
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setView('live')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === 'live' ? 'bg-accent-primary' : 'bg-dark-400'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setView('top')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    view === 'top' ? 'bg-accent-primary' : 'bg-dark-400'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
              </div>
            ) : (
              <div className="h-[600px] overflow-hidden relative">
                <Billboard
                  submissions={view === 'live' ? submissions : topSubmissions}
                  isAutoScroll={view === 'live'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Today's Top - Static */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <h2 className="text-xl font-bold flex items-center space-x-2 mb-6">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Today's Top</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {topSubmissions.slice(0, 5).map((submission, index) => (
                <div
                  key={submission.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-dark-300 hover:bg-dark-400 transition-colors"
                >
                  <span className="text-2xl font-bold text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{submission.content}</p>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                      <span>@{submission.userName}</span>
                      <span>•</span>
                      <span>{submission.likes} likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create index.html
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Viral Billboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create tsconfig.node.json
cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

echo "All files created successfully!"
