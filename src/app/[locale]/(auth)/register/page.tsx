'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: '',
            avatar_url: '',
            timezone: 'Asia/Seoul',
            theme: 'light'
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('이미 가입된 이메일 주소입니다.')
        }
        throw authError
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: '',
            avatar_url: '',
            timezone: 'Asia/Seoul',
            theme: 'light'
          })
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('프로필 생성에 실패했습니다. 이메일 인증 후 다시 시도해주세요.')
        }
      }

      alert('가입 확인 이메일을 확인해주세요!')
    } catch (error) {
      setError(error.message)
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border p-2"
            required
          />
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