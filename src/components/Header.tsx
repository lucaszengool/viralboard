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