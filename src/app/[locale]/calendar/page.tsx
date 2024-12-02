import { Suspense } from 'react'
import Calendar from '@/components/calendar/Calendar'
import CalendarSkeleton from '@/components/calendar/CalendarSkeleton'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CalendarPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-4">
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar userId={session.user.id} />
      </Suspense>
    </div>
  )
} 