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
      <div className="w-full flex justify-center py-4 border-t">
        <div id="ad-container" className="w-full max-w-[728px] h-[90px]">
          <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-9264904336462451"
              data-ad-slot="YOUR-AD-SLOT"
              data-ad-format="auto"
              data-full-width-responsive="true">
          </ins>
        </div>
      </div>
    </footer>
  )
} 