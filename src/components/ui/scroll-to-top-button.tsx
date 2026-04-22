'use client'

import { useEffect, useState } from 'react'

type Props = {
  threshold?: number
}

export function ScrollToTopButton({ threshold = 300 }: Props) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!isVisible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-blue-600 text-white text-sm rounded-full shadow-lg hover:bg-blue-700"
      aria-label="Наверх"
    >
      ↑ Наверх
    </button>
  )
}
