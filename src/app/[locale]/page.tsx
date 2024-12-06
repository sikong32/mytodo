import { getDictionary } from '../i18n/config'
import Link from 'next/link'
import React from 'react'

export default async function HomePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const dict = await getDictionary(locale as any)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          {dict.home.welcome}
        </h1>
        <p className="text-center text-gray-600">
          {dict.home.description}
        </p>
        <div className="flex flex-col space-y-4">
          <Link 
            href={`/${locale}/login`}
            className="w-full py-3 px-4 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {dict.common.login}
          </Link>
          <Link 
            href={`/${locale}/register`}
            className="w-full py-3 px-4 text-center border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            {dict.common.register}
          </Link>
          <Link 
            href={`/${locale}/calendar`}
            className="w-full py-3 px-4 text-center border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            {dict.common.calendar}
          </Link>
        </div>
      </div>
    </div>
  )
} 