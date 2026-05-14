'use client'

import { useEffect, useState } from 'react'

type Props = {
  threshold?: number
  /** Отступ от нижнего края вьюпорта в пикселях. По умолчанию 24 (соответствует bottom-6). */
  bottomOffset?: number
}

export function ScrollToTopButton({ threshold = 300, bottomOffset = 24 }: Props) {
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
      style={{ bottom: bottomOffset }}
      className="fixed right-6 z-50 px-4 py-2 bg-blue-600 text-white text-sm rounded-full shadow-lg hover:bg-blue-700"
      aria-label="Наверх"
    >
      ↑ Наверх
    </button>
  )
}
