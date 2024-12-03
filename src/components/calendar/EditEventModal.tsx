'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Modal from '@/components/common/Modal'
import { addYears } from 'date-fns'

interface EditEventModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  userId: string
}

const colors = [
  { value: '#3788d8', label: '파랑' },
  { value: '#28a745', label: '초록' },
  { value: '#dc3545', label: '빨강' },
  { value: '#ffc107', label: '노랑' },
  { value: '#6f42c1', label: '보라' },
  { value: '#6c757d', label: '회색' }
]

const recurringOptions = [
  { value: '', label: '반복 안함' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
  { value: 'yearly', label: '매년' }
]

const categories = [
  { value: 'default', label: '기본' },
  { value: 'work', label: '업무' },
  { value: 'personal', label: '개인' },
  { value: 'family', label: '가족' },
  { value: 'holiday', label: '휴가' },
  { value: 'other', label: '기타' }
]

// 카테고리별 기본 색상 매핑
const DEFAULT_CATEGORY_COLORS = {
  default: '#3788d8',
  work: '#6c757d',
  personal: '#28a745',
  family: '#ffc107',
  holiday: '#dc3545',
  other: '#6f42c1'
} as const

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  userId
}: EditEventModalProps) {
  const [title, setTitle] = useState(event.title || '')
  const [description, setDescription] = useState(event.extendedProps?.description || '')
  const [startTime, setStartTime] = useState(
    event.start ? 
      new Date(event.start.getTime() - event.start.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16) 
      : ''
  )
  const [endTime, setEndTime] = useState(
    event.end ? 
      new Date(event.end.getTime() - event.end.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16) 
      : ''
  )
  const [color, setColor] = useState<string>(event.backgroundColor || DEFAULT_CATEGORY_COLORS.default)
  const [isRecurring, setIsRecurring] = useState(event.extendedProps?.is_recurring || false)
  const [recurringPattern, setRecurringPattern] = useState(event.extendedProps?.recurring_pattern || '')
  const [category, setCategory] = useState(event.extendedProps?.category || 'default')
  const [editMode, setEditMode] = useState<'single' | 'all'>('single')

  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  const { mutate: updateEvent } = useMutation({
    mutationFn: async (updatedEvent: any) => {
      // 반복 일정의 특정 인스턴스를 수정하는 경우
      if (event.isRecurringInstance && editMode === 'single') {
        // 1. 기존 반복 일정을 현재 날짜 전날까지만 유지
        const { error: updateError } = await supabase
          .from('schedules')
          .update({
            end_time: new Date(event.start).toISOString()  // 현재 수정하려는 날짜 전까지만 유지
          })
          .eq('id', event.originalEventId)

        if (updateError) throw updateError

        // 2. 수정된 일회성 일정 추가
        const { error: insertError } = await supabase
          .from('schedules')
          .insert([{
            user_id: userId,
            title: updatedEvent.title,
            description: updatedEvent.description,
            start_time: new Date(updatedEvent.start_time).toISOString(),
            end_time: new Date(updatedEvent.end_time).toISOString(),
            color: updatedEvent.color,
            is_recurring: false,
            category: updatedEvent.category
          }])

        if (insertError) throw insertError

        // 3. 수정된 날짜 이후의 새로운 반복 일정 추가
        const { error: newRecurringError } = await supabase
          .from('schedules')
          .insert([{
            user_id: userId,
            title: event.title,  // 원래 일정의 제목 유지
            description: event.extendedProps?.description,
            start_time: new Date(event.end).toISOString(),  // 수정된 날짜 다음날부터 시작
            end_time: new Date(event.extendedProps?.recurring_end || addYears(new Date(), 2)).toISOString(),
            color: event.backgroundColor,
            is_recurring: true,
            recurring_pattern: event.extendedProps?.recurring_pattern,
            category: event.extendedProps?.category
          }])

        if (newRecurringError) throw newRecurringError
      } else {
        // 전체 반복 일정을 수정하거나 일반 일정을 수정하는 경우
        const { error } = await supabase
          .from('schedules')
          .update({
            title: updatedEvent.title,
            description: updatedEvent.description,
            start_time: new Date(updatedEvent.start_time).toISOString(),
            end_time: new Date(updatedEvent.end_time).toISOString(),
            color: updatedEvent.color,
            is_recurring: updatedEvent.is_recurring,
            recurring_pattern: updatedEvent.recurring_pattern,
            category: updatedEvent.category
          })
          .eq('id', event.originalEventId || event.id)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating event:', error)
    }
  })

  const { mutate: deleteEvent } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', event.originalEventId || event.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    }
  })

  const { mutate: addEvent } = useMutation({
    mutationFn: async (newEvent: any) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          user_id: userId,
          ...newEvent
        }])
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (event.isRecurringInstance && editMode === 'single') {
      // 개별 인스턴스 수정 - 새로운 일정으로 저장
      addEvent({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        color,
        is_recurring: false, // 개별 일정은 반복 아님
        category,
        exception_date: new Date(event.start).toISOString() // 원본 반복 일정에서 제외할 날짜
      })
    } else {
      // 전체 반복 일정 수정 또는 일반 일정 수정
      updateEvent({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        color,
        is_recurring: isRecurring,
        recurring_pattern: recurringPattern,
        category
      })
    }
  }

  // 카테고리 변경 시 기본 색상도 자동 변경
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setColor(DEFAULT_CATEGORY_COLORS[newCategory as keyof typeof DEFAULT_CATEGORY_COLORS])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="일정 수정">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">카테고리</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">시작 시간</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">종료 시간</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">색상 (선택사항)</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`w-8 h-8 rounded-full ${color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setColor(c.value)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 p-0 border-0"
            />
          </div>
        </div>

        

        <div>
          <label className="block text-sm font-medium text-gray-700">반복</label>
          <select
            value={recurringPattern}
            onChange={(e) => {
              setIsRecurring(!!e.target.value)
              setRecurringPattern(e.target.value)
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            {recurringOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {event.isRecurringInstance && (
          <div>
            <label className="block text-sm font-medium text-gray-700">수정 범위</label>
            <select
              value={editMode}
              onChange={(e) => setEditMode(e.target.value as 'single' | 'all')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="single">이 일정만</option>
              <option value="all">모든 반복 일정</option>
            </select>
          </div>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => deleteEvent()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            삭제
          </button>
          <div className="space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
} 