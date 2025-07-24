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
