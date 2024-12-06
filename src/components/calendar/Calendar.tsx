'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import CalendarSkeleton from './CalendarSkeleton'
import { useTranslations } from 'next-intl'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'
import { Schedule } from '@/types/schedule'
import { getHolidays } from '@/lib/holidays'
import { addDays, addWeeks, addMonths, addYears } from 'date-fns'
import Modal from '@/components/common/Modal'
import { useDictionary } from '@/hooks/useDictionary'

interface CalendarProps {
  userId?: string
}

function generateRecurringEvents(event: any) {
  if (!event.is_recurring || !event.recurring_pattern) return [event]
  
  const events = []
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)
  const duration = endDate.getTime() - startDate.getTime()
  
  events.push({
    ...event,
    id: `${event.id}_${startDate.getTime()}`,
    start: startDate,
    end: endDate,
    start_time: startDate,
    end_time: endDate,
    isRecurringInstance: true,
    originalEventId: event.id
  })

  let maxDate: Date
  switch (event.recurring_pattern) {
    case 'daily':
      maxDate = addYears(startDate, 2)
      break
    case 'weekly':
      maxDate = addYears(startDate, 2)
      break
    case 'monthly':
      maxDate = addYears(startDate, 5)
      break
    case 'yearly':
      maxDate = addYears(startDate, 10)
      break
    default:
      return [event]
  }

  let prevEventStart = startDate
  while (true) {
    let nextEventStart
    switch (event.recurring_pattern) {
      case 'daily':
        nextEventStart = addDays(prevEventStart, 1)
        break
      case 'weekly':
        nextEventStart = addWeeks(prevEventStart, 1)
        break
      case 'monthly':
        nextEventStart = addMonths(prevEventStart, 1)
        break
      case 'yearly':
        nextEventStart = addYears(prevEventStart, 1)
        break
    }

    if (nextEventStart > maxDate) break

    const nextEventEnd = new Date(nextEventStart.getTime() + duration)
    events.push({
      ...event,
      id: `${event.id}_${nextEventStart.getTime()}`,
      start: nextEventStart,
      end: nextEventEnd,
      start_time: nextEventStart,
      end_time: nextEventEnd,
      isRecurringInstance: true,
      originalEventId: event.id
    })

    prevEventStart = nextEventStart
  }

  return events
}

export default function Calendar({ userId }: CalendarProps) {
  const dict = useDictionary()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const currentLocale = params.locale as string

  const { data: events = [] } = useQuery({
    queryKey: ['events', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true })
      
      if (error) {
        console.error('Error fetching events:', error)
        throw error
      }

      const allEvents = data?.reduce((acc: any[], event: any) => {
        const expandedEvents = generateRecurringEvents(event).map(e => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start_time || e.start),
          end: new Date(e.end_time || e.end),
          description: e.description,
          category: e.category,
          backgroundColor: e.color,
          borderColor: e.color,
          extendedProps: {
            is_recurring: e.is_recurring,
            recurring_pattern: e.recurring_pattern,
            description: e.description,
            category: e.category
          }
        }))
        return [...acc, ...expandedEvents]
      }, []) || []

      return allEvents
    },
    refetchOnWindowFocus: false
  })

  const { mutate: updateEvent } = useMutation({
    mutationFn: async ({ id, start, end }: { id: string; start: Date; end: Date }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => {
      console.error('Error updating event:', error)
    }
  })

  const handleDateSelect = (selectInfo: any) => {
    if (!userId) {
      setShowLoginModal(true)
      return
    }
    setSelectedDate(selectInfo.start)
    setIsAddModalOpen(true)
    const endDate = selectInfo.end
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setMinutes(-1)
    }
    setSelectedEndDate(endDate)
  }

  const handleEventClick = (clickInfo: any) => {
    if (!userId) {
      setShowLoginModal(true)
      return
    }
    setSelectedEvent(clickInfo.event)
    setIsEditModalOpen(true)
  }

  const handleEventDrop = (dropInfo: any) => {
    updateEvent({
      id: dropInfo.event.id,
      start: dropInfo.event.start,
      end: dropInfo.event.end
    })
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4, currentYear + 5]
  
  const holidays = years.flatMap(year => 
    getHolidays(year, currentLocale).map(holiday => ({
      ...holiday,
      isHoliday: true,
      display: 'background',
      allDay: true,
      className: 'holiday-event'
    }))
  )

  if (!dict) {
    return <CalendarSkeleton />
  }

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        allDaySlot={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        locale={currentLocale}
        eventDrop={handleEventDrop}
        eventSources={[
          {
            events: events,
          },
          {
            events: holidays,
            editable: false,
          }
        ]}
      />

      {isAddModalOpen && (
        <AddEventModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          selectedDate={selectedDate}
          selectedEndDate={selectedEndDate}
          userId={userId}
        />
      )}

      {isEditModalOpen && selectedEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={selectedEvent}
          userId={userId}
        />
      )}

      {showLoginModal && (
        <Modal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title={dict.common.notification}
        >
          <div className="p-4">
            <p className="mb-4">{dict.calendar.login_required}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  router.push(`/${currentLocale}/login`)
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {dict.common.login}
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                {dict.common.cancel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}