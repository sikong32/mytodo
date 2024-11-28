'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResendButton, setShowResendButton] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setShowResendButton(false)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 인증 메일을 확인해주세요.')
          setShowResendButton(true)
          return
        }
        throw signInError
      }

      if (data?.user) {
        router.push('/calendar')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      
      if (error) throw error
      
      alert('인증 메일이 재발송되었습니다. 이메일을 확인해주세요.')
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSignIn} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">로그인</h1>
        
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

        {showResendButton && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            className="w-full rounded-md bg-gray-500 py-2 text-white hover:bg-gray-600"
          >
            인증 메일 재발송
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '로그인중...' : '로그인'}
        </button>
      </form>
    </div>
  )
} 
