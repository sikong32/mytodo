'use client'

import { useState } from 'react'
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
import { addDays, addWeeks, addMonths } from 'date-fns'

interface CalendarProps {
  userId: string
}

function generateRecurringEvents(event: any) {
  if (!event.is_recurring || !event.recurring_pattern) return [event]
  
  const events = []
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)
  const duration = endDate.getTime() - startDate.getTime()
  
  const patternEndDate = endDate

  switch (event.recurring_pattern) {
    case 'daily':
      let dailyDate = startDate
      while (dailyDate <= patternEndDate) {
        events.push({
          ...event,
          start: new Date(dailyDate),
          end: new Date(dailyDate.getTime() + duration)
        })
        dailyDate = addDays(dailyDate, 1)
      }
      break

    case 'weekly':
      let weeklyDate = startDate
      while (weeklyDate <= patternEndDate) {
        events.push({
          ...event,
          start: new Date(weeklyDate),
          end: new Date(weeklyDate.getTime() + duration)
        })
        weeklyDate = addWeeks(weeklyDate, 1)
      }
      break

    case 'monthly':
      let monthlyDate = startDate
      while (monthlyDate <= patternEndDate) {
        events.push({
          ...event,
          start: new Date(monthlyDate),
          end: new Date(monthlyDate.getTime() + duration)
        })
        monthlyDate = addMonths(monthlyDate, 1)
      }
      break
  }

  return events
}

export default function Calendar({ userId }: CalendarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

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

      console.log('Fetched events:', allEvents)
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
    setSelectedDate(selectInfo.start)
    setIsAddModalOpen(true)
    const endDate = selectInfo.end
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setMinutes(-1)
    }
    setSelectedEndDate(endDate)
  }

  const handleEventClick = (clickInfo: any) => {
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
  const holidays = getHolidays(currentYear, 'ko')

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
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        locale="ko"
        eventDrop={handleEventDrop}
        eventSources={[
          {
            events: events,
          },
          {
            events: holidays,
            editable: false,
            className: 'holiday-event'
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
    </>
  )
}