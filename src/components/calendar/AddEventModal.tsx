'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ... 나머지 코드는 동일 

export function AddEventModal({ isOpen, onClose, selectedDate }: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}) {
  return (
    <div>
      {/* 모달 내용 */}
    </div>
  )
}

export default AddEventModal