'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { FaGlobeAsia } from 'react-icons/fa'
import { US, JP, CN, KR } from 'country-flag-icons/react/3x2'
import Modal from './Modal'
import { useDictionary } from '@/hooks/useDictionary'

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
  const [showLoginModal, setShowLoginModal] = useState(false)
  const dict = useDictionary()
  
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
    const targetPath = pathWithoutLocale || ''
    
    // 보호된 라우트 목록
    const protectedRoutes = ['calendar', 'settings']
    
    // 현재 경로가 보호된 라우트이고 사용자가 로그인하지 않은 경우
    if (protectedRoutes.some(route => targetPath.startsWith(route)) && !user) {
      alert('로그인이 필요한 서비스입니다.')
      router.push(`/${newLocale}/login`)
      return
    }
    
    // 현재 URL의 쿼리 파라미터 유지
    const currentUrl = new URL(window.location.href)
    const searchParams = currentUrl.searchParams.toString()
    
    // 쿼리 파라미터가 있는 경우 포함하여 라우팅
    const newPath = `/${newLocale}/${targetPath}${searchParams ? `?${searchParams}` : ''}`
    
    router.push(newPath)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push(`/${currentLocale}/login`)
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      setShowLoginModal(true)
      return
    }
    router.push(`/${currentLocale}/calendar`)
  }

  if (!dict || loading) {
    return <div className="h-16 bg-white shadow"></div>
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link 
            href={`/${currentLocale}/calendar`} 
            className="text-lg font-bold"
            onClick={handleCalendarClick}
          >
            {dict.common.appName}
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-1 px-2 py-1 text-sm border rounded-md hover:bg-gray-50">
                <FaGlobeAsia className="text-gray-500 text-sm" />
                <span className="hidden sm:inline">{LOCALES.find(locale => locale.code === currentLocale)?.label}</span>
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
                      <Icon className="w-4 h-4" />
                      {locale.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  {dict.common.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${currentLocale}/login`}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  {dict.common.login}
                </Link>
                <Link
                  href={`/${currentLocale}/register`}
                  className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  {dict.common.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

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
    </>
  )
} 