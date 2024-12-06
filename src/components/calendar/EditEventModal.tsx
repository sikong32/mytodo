'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Modal from '@/components/common/Modal'
import { addYears } from 'date-fns'
import { useDictionary } from '@/hooks/useDictionary'

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
  { value: 'none', label: '반복 안함' },
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
  const dict = useDictionary()
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
      // 반복 일정의 경우 원본 ID 추출
      const originalId = event.id.includes('_') 
        ? event.id.split('_')[0]  // ID가 '_'를 포함하면 앞부분만 사용
        : event.id                // 아니면 그대로 사용

      if (event.isRecurringInstance && editMode === 'single') {
        // 개별 인스턴스 수정
        const { error: insertError } = await supabase
          .from('schedules')
          .insert([{
            user_id: userId,
            title: updatedEvent.title,
            description: updatedEvent.description,
            start_time: new Date(updatedEvent.start_time).toISOString(),
            end_time: new Date(updatedEvent.end_time).toISOString(),
            color: updatedEvent.color,
            category: updatedEvent.category,
            is_recurring: false,
            exception_date: new Date(event.start).toISOString()
          }])

        if (insertError) throw insertError
      } else {
        // 전체 반복 일정 수정
        const { error } = await supabase
          .from('schedules')
          .update({
            title: updatedEvent.title,
            description: updatedEvent.description,
            start_time: new Date(updatedEvent.start_time).toISOString(),
            end_time: new Date(updatedEvent.end_time).toISOString(),
            color: updatedEvent.color,
            category: updatedEvent.category,
            is_recurring: updatedEvent.is_recurring,
            recurring_pattern: updatedEvent.recurring_pattern
          })
          .eq('id', originalId)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    }
  })

  const { mutate: deleteEvent } = useMutation({
    mutationFn: async () => {
      // 반복 일정의 경우 원본 ID 추출
      const originalId = event.id.includes('_') 
        ? event.id.split('_')[0]  // ID가 '_'를 포함하면 앞부분만 사용
        : event.id                // 아니면 그대로 사용

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', originalId)

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
    updateEvent({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      color,
      category,
      is_recurring: isRecurring,
      recurring_pattern: recurringPattern
    })
  }

  // 카테고리 변경 시 기본 색상도 자동 변경
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setColor(DEFAULT_CATEGORY_COLORS[newCategory as keyof typeof DEFAULT_CATEGORY_COLORS])
  }

  // 삭제 확인 상태 추가
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single')

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  // 실제 삭제 실행
  const handleConfirmDelete = () => {
    deleteEvent()  // deleteMode 파라미터 제거
    setShowDeleteConfirm(false)
  }

  if (!dict) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dict.calendar.editEvent}>
      {showDeleteConfirm ? (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium">
            {event.isRecurringInstance || event.extendedProps?.is_recurring 
              ? dict.calendar.deleteRecurringConfirm
              : dict.calendar.deleteConfirm}
          </h3>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {dict.calendar.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {dict.calendar.delete}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.category}</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {dict.calendar.categories[cat.value as keyof typeof dict.calendar.categories]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.title}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.startTime}</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.endTime}</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {dict.calendar.color} {dict.calendar.optional}
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={dict.calendar.colors[c.label.toLowerCase() as keyof typeof dict.calendar.colors]}
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
            <label className="block text-sm font-medium text-gray-700">{dict.calendar.repeat}</label>
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
                  {dict.calendar.repeatOptions[option.value as keyof typeof dict.calendar.repeatOptions]}
                </option>
              ))}
            </select>
          </div>

          {event.isRecurringInstance && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{dict.calendar.editMode.title}</label>
              <select
                value={editMode}
                onChange={(e) => setEditMode(e.target.value as 'single' | 'all')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="single">{dict.calendar.editMode.single}</option>
                <option value="all">{dict.calendar.editMode.all}</option>
              </select>
            </div>
          )}

          {!showDeleteConfirm && (
            <div className="flex justify-end space-x-2">
              {!event.extendedProps?.isHoliday && (
                <>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    {dict.calendar.delete}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {dict.calendar.save}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {dict.calendar.cancel}
              </button>
            </div>
          )}
        </form>
      )}
    </Modal>
  )
} 
