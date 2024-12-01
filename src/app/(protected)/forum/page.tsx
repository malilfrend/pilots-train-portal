import { Metadata } from 'next'
import { SessionList } from '@/components/features/forum/SessionList'

export const metadata: Metadata = {
  title: 'Форум | Авиатренажер',
  description: 'Обсуждение тренажерных сессий',
}

export default function ForumPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Форум тренажерной подготовки</h1>
      <SessionList />
    </div>
  )
}
