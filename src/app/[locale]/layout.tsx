import { i18n } from '../i18n/config'
import { Inter } from 'next/font/google'
import '../globals.css'
import React from 'react'
import Header from '@/components/common/Header'
import { SpeedInsights } from "@vercel/speed-insights/next"
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  )
} 