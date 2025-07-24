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
