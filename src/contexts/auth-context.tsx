'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'PILOT' | 'INSTRUCTOR' | 'SUPER_ADMIN'
  university?: string
  company?: string
  experience?: string
  position?: string
  profileId?: number
  pilotId?: number
  instructorId?: number
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  loading: boolean
}

// Типизация данных для обновления профиля
interface UpdateProfileData {
  firstName: string
  lastName: string
  university?: string | null
  company?: string | null
  experience?: string | null
  position?: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Ошибка авторизации')
    }

    const data = await response.json()
    setUser(data.user)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const updateProfile = async (data: UpdateProfileData) => {
    const response = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Ошибка обновления профиля')
    }

    const responseData = await response.json()
    setUser(responseData.user)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
