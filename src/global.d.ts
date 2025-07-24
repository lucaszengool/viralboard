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
