'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface HomeClientProps {
  dict: any
  locale: string
}

export default function HomeClient({ dict, locale }: HomeClientProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">
        {dict.home.welcome}
      </h1>
      <div className="space-y-4">
        <p className="text-xl text-center">
          {dict.home.description}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push(`/${locale}/calendar`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {dict.home.getStarted}
          </button>
        </div>
      </div>
    </div>
  )
} 