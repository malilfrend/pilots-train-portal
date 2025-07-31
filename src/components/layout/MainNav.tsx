'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

export function MainNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const routes = [
    {
      href: '/profile',
      label: 'Профиль',
      active: pathname === '/profile',
    },
  ]

  // Дополнительные маршруты для инструкторов
  if (user?.role === 'INSTRUCTOR') {
    routes.push({
      href: '/assessments',
      label: 'Оценки',
      active: pathname.startsWith('/assessments'),
    })
    routes.push({
      href: '/sessions',
      label: 'Сессии',
      active: pathname.startsWith('/sessions'),
    })
    routes.push({
      href: '/competency-weights',
      label: 'Весовые коэффициенты',
      active: pathname.startsWith('/competency-weights'),
    })
  }

  // Дополнительные маршруты для администраторов
  if (user?.role === 'SUPER_ADMIN') {
    routes.push({
      href: '/admin',
      label: 'Администрирование',
      active: pathname.startsWith('/admin'),
    })
  }

  return (
    <nav className="flex items-center space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
      <button
        onClick={() => logout()}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        Выйти
      </button>
    </nav>
  )
}
