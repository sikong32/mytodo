'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Modal from '@/components/common/Modal'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date | null
  userId: string
}

export default function AddEventModal({
  isOpen,
  onClose,
  selectedDate,
  userId
}: AddEventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState(selectedDate?.toISOString().slice(0, 16) || '')
  const [endTime, setEndTime] = useState('')
  
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  const { mutate: addEvent } = useMutation({
    mutationFn: async (newEvent: any) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          user_id: userId,
          title: newEvent.title,
          description: newEvent.description,
          start_time: new Date(newEvent.start_time).toISOString(),
          end_time: new Date(newEvent.end_time).toISOString(),
        }])
        .select()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error adding event:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEvent({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="일정 추가">
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