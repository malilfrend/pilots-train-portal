'use client'

import { useEffect, useState } from 'react'
import { Session } from '@/types/forum'
import { InstructorSessionCard } from './InstructorSessionCard'

export function InstructorSessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const response = await fetch('/api/sessions')
        if (!response.ok) throw new Error('Ошибка загрузки сессий')
        const data = await response.json()
        setSessions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (loading) return <div>Загрузка...</div>
  if (error) return <div className="text-red-500">Ошибка: {error}</div>

  return (
    <div className="grid gap-6">
      {sessions.map((session) => (
        <InstructorSessionCard key={session.id} session={session} />
      ))}
    </div>
  )
}
