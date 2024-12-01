'use client'

import Link from 'next/link'
import { MainNav } from './MainNav'
import { useAuth } from '@/contexts/auth-context'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Авиатренажер
          </Link>
          {user ? (
            <MainNav />
          ) : (
            <nav className="flex items-center gap-4">
              <Link href="/login" className="text-sm hover:text-blue-600">
                Войти
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Регистрация
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
