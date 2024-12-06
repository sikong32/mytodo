'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const protectedRoutes = ['/calendar', '/settings']
      const currentLocale = pathname.split('/')[1] || 'ko'
      
      if (protectedRoutes.some(route => pathname.includes(route)) && (event === 'SIGNED_OUT' || !session)) {
        router.push(`/${currentLocale}/login`)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
} 