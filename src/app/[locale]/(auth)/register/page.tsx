'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useDictionary } from '@/hooks/useDictionary'
import { FaCheck, FaTimes } from 'react-icons/fa'

export default function RegisterPage() {
  const router = useRouter()
  const pathname = usePathname()
  const dict = useDictionary()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    full_name: '',
    timezone: 'Asia/Seoul',
    theme: 'light'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isPasswordMatch, setIsPasswordMatch] = useState<boolean | null>(null)

  if (!dict) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
    </div>
  }

  const TIMEZONES = [
    { value: 'Asia/Seoul', label: dict.timezone['Asia/Seoul'] },
    { value: 'Asia/Tokyo', label: dict.timezone['Asia/Tokyo'] },
    { value: 'Asia/Shanghai', label: dict.timezone['Asia/Shanghai'] },
    { value: 'America/New_York', label: dict.timezone['America/New_York'] },
    { value: 'America/Los_Angeles', label: dict.timezone['America/Los_Angeles'] },
    { value: 'Europe/London', label: dict.timezone['Europe/London'] },
    { value: 'Europe/Paris', label: dict.timezone['Europe/Paris'] },
    { value: 'Australia/Sydney', label: dict.timezone['Australia/Sydney'] },
  ]

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    setIsCheckingEmail(true)
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)

      setIsEmailValid(existingProfile.length===0)
    } catch (error) {
      setIsEmailValid(false)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    if (name === 'email') {
      setIsEmailValid(null)
    }

    if (name === 'password' || name === 'passwordConfirm') {
      if (name === 'password') {
        setIsPasswordMatch(value === formData.passwordConfirm)
      } else {
        setIsPasswordMatch(value === formData.password)
      }
    }
  }

  const handleEmailBlur = () => {
    checkEmailAvailability(formData.email)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.passwordConfirm) {
      setError(dict.auth.passwordMismatch)
      setLoading(false)
      return
    }

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', formData.email)
        .single()

      if (existingProfile) {
        throw new Error(dict.auth.duplicateEmail)
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: formData.email,
              full_name: formData.full_name,
              avatar_url: '',
              timezone: formData.timezone,
              theme: formData.theme
            })

          if (profileError) throw profileError
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }

      alert(dict.common.confirmEmail)
      const currentLocale = pathname.split('/')[1] || 'ko'
      router.push(`/${currentLocale}/login`)
    } catch (error: any) {
      setError(error.message || dict.auth.registerError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSignUp} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">{dict.auth.registerTitle}</h1>
        
        <div>
          <label className="block text-sm font-medium">{dict.common.email}</label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              placeholder={dict.auth.emailPlaceholder}
              className="mt-1 w-full rounded-md border p-2"
              required
            />
            {isCheckingEmail && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
            {!isCheckingEmail && isEmailValid !== null && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailValid ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaTimes className="text-red-500" />
                )}
              </div>
            )}
          </div>
          {!isCheckingEmail && isEmailValid === false && (
            <p className="mt-1 text-sm text-red-500">{dict.auth.duplicateEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">{dict.common.password}</label>
          <div className="relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={dict.auth.passwordPlaceholder}
              className="mt-1 w-full rounded-md border p-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">{dict.auth.passwordConfirm}</label>
          <div className="relative">
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder={dict.auth.passwordConfirmPlaceholder}
              className="mt-1 w-full rounded-md border p-2"
              required
            />
            {formData.passwordConfirm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isPasswordMatch ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaTimes className="text-red-500" />
                )}
              </div>
            )}
          </div>
          {formData.passwordConfirm && !isPasswordMatch && (
            <p className="mt-1 text-sm text-red-500">{dict.auth.passwordMismatch}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">{dict.auth.fullName}</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder={dict.auth.fullNamePlaceholder}
            className="mt-1 w-full rounded-md border p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{dict.auth.timezone}</label>
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
            {dict.auth.timezoneHelper}
          </p>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        <button
          type="submit"
          disabled={loading || !isEmailValid || !isPasswordMatch}
          className={`w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 
            ${(loading || !isEmailValid || !isPasswordMatch) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? dict.common.processing : dict.auth.registerButton}
        </button>
      </form>
    </div>
  )
} 