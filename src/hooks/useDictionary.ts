'use client'

import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/app/i18n/config'
import { useState, useEffect } from 'react'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export function useDictionary() {
  const params = useParams()
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  
  useEffect(() => {
    const loadDictionary = async () => {
      if (!params.locale) return
      const dict = await getDictionary(params.locale as Locale)
      setDictionary(dict)
    }
    
    loadDictionary()
  }, [params.locale])
  
  return dictionary
} 