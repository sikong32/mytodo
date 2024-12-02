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

interface CalendarProps {
  userId: string
}

export default function Calendar({ userId }: CalendarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
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

      return data?.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description,
        category: event.category,
      })) || []
    },
    refetchOnWindowFocus: false
  })

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(selectInfo.start)
    setIsAddModalOpen(true)
  }

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event)
    setIsEditModalOpen(true)
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
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        locale="ko"
      />

      {isAddModalOpen && (
        <AddEventModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          selectedDate={selectedDate}
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