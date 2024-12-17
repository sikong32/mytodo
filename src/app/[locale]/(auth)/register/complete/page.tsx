'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useDictionary } from '@/hooks/useDictionary'

export default function RegisterCompletePage() {
  const router = useRouter()
  const params = useParams()
  const dict = useDictionary()
  const currentLocale = params.locale as string

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/${currentLocale}/login`)
    }, 5000)

    return () => clearTimeout(timer)
  }, [router, currentLocale])

  if (!dict) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
    </div>
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-600">
          {dict.register.completeTitle}
        </h1>
        <div className="space-y-4">
          <p className="text-gray-600">
            {dict.register.completeMessage}
          </p>
          <p className="text-sm text-gray-500">
            {dict.register.redirectMessage}
          </p>
        </div>
      </div>
    </div>
  )
} 