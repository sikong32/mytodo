'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Modal from '@/components/common/Modal'

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
  { value: '#fd7e14', label: '주황' },
  { value: '#e83e8c', label: '분홍' },
  { value: '#20c997', label: '청록' },
  { value: '#6c757d', label: '회색' }
]

const recurringOptions = [
  { value: '', label: '반복 안함' },
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' }
]

const categories = [
  { value: 'default', label: '기본' },
  { value: 'work', label: '업무' },
  { value: 'personal', label: '개인' },
  { value: 'family', label: '가족' },
  { value: 'holiday', label: '휴가' },
  { value: 'other', label: '기타' }
]

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
  const [color, setColor] = useState(event.backgroundColor || colors[0].value)
  const [isRecurring, setIsRecurring] = useState(event.extendedProps?.is_recurring || false)
  const [recurringPattern, setRecurringPattern] = useState(event.extendedProps?.recurring_pattern || '')
  const [category, setCategory] = useState(event.extendedProps?.category || 'default')

  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  const { mutate: updateEvent } = useMutation({
    mutationFn: async (updatedEvent: any) => {
      const { data, error } = await supabase
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
        .eq('id', event.id)
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating event:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="일정 수정">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700">색상</label>
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
          <label className="block text-sm font-medium text-gray-700">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
        <div className="flex justify-end space-x-2">
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
      </form>
    </Modal>
  )
} 