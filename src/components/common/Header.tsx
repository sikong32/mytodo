'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { FaGlobeAsia } from 'react-icons/fa'
import { 
  US, 
  JP, 
  CN, 
  KR 
} from 'country-flag-icons/react/3x2'

const LOCALES = [
  { code: 'ko', label: '한국어', icon: KR },
  { code: 'en', label: 'English', icon: US },
  { code: 'ja', label: '日本語', icon: JP },
  { code: 'zh', label: '中文', icon: CN }
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const currentLocale = pathname.split('/')[1] || 'ko'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.split('/').slice(2).join('/')
    router.push(`/${newLocale}/${pathWithoutLocale}`)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push(`/${currentLocale}/login`)
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (loading) {
    return <div className="h-16 bg-white shadow"></div>
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href={`/${currentLocale}/calendar`} className="text-xl font-bold">
          일정 관리
        </Link>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50">
              <FaGlobeAsia className="text-gray-500" />
              {LOCALES.find(locale => locale.code === currentLocale)?.label}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              {LOCALES.map((locale) => {
                const Icon = locale.icon
                return (
                  <button
                    key={locale.code}
                    onClick={() => handleLocaleChange(locale.code)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 
                      ${currentLocale === locale.code ? 'bg-gray-50' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    {locale.label}
                  </button>
                )
              })}
            </div>
          </div>

          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${currentLocale}/login`}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
              >
                로그인
              </Link>
              <Link
                href={`/${currentLocale}/register`}
                className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 