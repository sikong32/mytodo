'use client'
// 필요한 라이브러리와 컴포넌트들을 임포트
import { useState, useRef, useEffect } from 'react'
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
  userId?: string // 선택적 userId 프롭
}

// 반복 일정을 생성하는 유틸리티 함수
function generateRecurringEvents(event: any) {
  if (!event.is_recurring || !event.recurring_pattern) return [event]
  
  const events = []
  const startDate = new Date(event.start_time)
  const endDate = new Date(event.end_time)
  const duration = endDate.getTime() - startDate.getTime() // 이벤트 지속 시간 계산
  
  // 첫 번째 이벤트 인스턴스 생성
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
  // 반복 패턴에 따른 최대 날짜 설정
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
  // 반복 이벤트 생성
  let prevEventStart = startDate
  while (true) {
    // ... 반복 로직 ...
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
  // 상태 관리
  const dict = useDictionary() // 다국어 사전
  const calendarRef = useRef<FullCalendar>(null) // 캘린더 ref
  const [isAddModalOpen, setIsAddModalOpen] = useState(false) // 일정 추가 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // 일정 수정 모달
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null) // 선택된 일정
  const [selectedDate, setSelectedDate] = useState<Date | null>(null) // 선택된 날짜
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null) // 선택된 종료 날짜
  const [showLoginModal, setShowLoginModal] = useState(false) // 로그인 모달
  
  // Supabase 클라이언트 및 기타 훅 초기화
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const currentLocale = params.locale as string

  // 일정 데이터 가져오기
  const { data: events = [] } = useQuery({
    queryKey: ['events', userId],
    queryFn: async () => {
      // ... 일정 데이터 조회 로직 ...
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

  // 일정 업데이트 뮤테이션
  const { mutate: updateEvent } = useMutation({
    // ... 일정 업데이트 로직 ...
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

  // 날짜 선택 핸들러
  const handleDateSelect = (selectInfo: any) => {
    // ... 날짜 선택 처리 ...
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

  // 날짜 클릭 핸들러
  const handleDateClick = (info: any) => {
    if (!userId) {
      setShowLoginModal(true)
      return
    }
    
    // 클릭한 날짜를 선택된 날짜로 설정
    setSelectedDate(info.date)
    
    // 종료 시간은 시작 시간으로부터 1시간 후로 설정
    const endDate = new Date(info.date)
    endDate.setHours(endDate.getHours() + 1)
    setSelectedEndDate(endDate)
    
    // 일정 추가 모달 열기
    setIsAddModalOpen(true)
  }

  // 일정 클릭 핸들러
  const handleEventClick = (clickInfo: any) => {
    if (clickInfo.event.extendedProps.isHoliday) {
      return;
    }

    if (!userId) {
      setShowLoginModal(true)
      return
    }
    setSelectedEvent(clickInfo.event)
    setIsEditModalOpen(true)
  }

  // 일정 드래그 앤 드롭 핸들러
  const handleEventDrop = (dropInfo: any) => {
    updateEvent({
      id: dropInfo.event.id,
      start: dropInfo.event.start,
      end: dropInfo.event.end
    })
  }

  // 공휴일 데이터 처리
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4, currentYear + 5]
  const holidays = years.flatMap(year => 
    getHolidays(year, currentLocale).map(holiday => ({
      // ... 공휴일 데이터 변환 ...
      ...holiday,
      isHoliday: true,
      display: 'background',
      allDay: true,
      className: 'holiday-event'
    }))
  )

  // 사전 로딩 체크
  if (!dict) {
    return <CalendarSkeleton />
  }

  // 캘린더 렌더링
  return (
    <div className="calendar-container max-w-full overflow-x-auto">
      <FullCalendar
        // ... FullCalendar 설정 ...
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        allDaySlot={false}
        editable={true}
        dayMaxEventRows={true}
        moreLinkClick="popover"
        eventDisplay="block"
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        stickyHeaderDates={true}
        handleWindowResize={true}
        views={{
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: 'long' },
            dayMaxEventRows: 4,
          },
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'long' },
            dayMaxEventRows: 4,
          },
          timeGridDay: {
            titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
          }
        }}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        select={handleDateSelect}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: false
        }}
        locale={currentLocale}
        eventDrop={handleEventDrop}
        eventSources={[
          {
            events: events,
            className: 'custom-event',
            editable: true,
          },
          {
            events: holidays,
            className: 'holiday-event',
            editable: false,
            display: 'background'
          }
        ]}
      />
      {/* 모달 컴포넌트들 */}
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
    </div>
  )
}