import React, { Suspense } from 'react'
import Calendar from '@/components/calendar/Calendar'
import Loading from './loading'

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">일정 관리</h1>
      <Suspense fallback={<Loading />}>
        <Calendar />
      </Suspense>
    </div>
  )
} 