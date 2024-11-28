'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// 주요 타임존 목록
const TIMEZONES = [
  { value: 'Asia/Seoul', label: '한국 (UTC+9)' },
  { value: 'Asia/Tokyo', label: '일본 (UTC+9)' },
  { value: 'Asia/Shanghai', label: '중국 (UTC+8)' },
  { value: 'America/New_York', label: '뉴욕 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (UTC-8)' },
  { value: 'Europe/London', label: '런던 (UTC+0)' },
  { value: 'Europe/Paris', label: '파리 (UTC+1)' },
  { value: 'Australia/Sydney', label: '시드니 (UTC+11)' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    full_name: '',
    timezone: 'Asia/Seoul', // 기본값
    theme: 'light'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            avatar_url: '',
            timezone: formData.timezone,
            theme: formData.theme
          })

        if (profileError) throw profileError
      }

      alert('가입 확인 이메일을 확인해주세요!')
      router.push('/login')
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSignUp} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">회원가입</h1>
        
        <div>
          <label className="block text-sm font-medium">이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">비밀번호 확인</label>
          <input
            type="password"
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">이름</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="이름을 입력하세요"
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">타임존</label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border p-2"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            * 현재 위치의 시간대를 선택하세요
          </p>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '처리중...' : '가입하기'}
        </button>
      </form>
    </div>
  )
} 