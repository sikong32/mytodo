'use client'

import { useDictionary } from '@/hooks/useDictionary'
import Script from 'next/script'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function Footer() {
  const dict = useDictionary()

  // dict가 로드되기 전에는 빈 footer를 렌더링
  if (!dict) {
    return <footer className="bg-gray-100 mt-auto" />
  }

  return (
    <footer className="bg-gray-100 mt-auto">
      {/* 광고 섹션 */}

      {/* Google AdSense 스크립트 */}
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9264904336462451"
     crossOrigin="anonymous"></script>
    </footer>
  )
} 