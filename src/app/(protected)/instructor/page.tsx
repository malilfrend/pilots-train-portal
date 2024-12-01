import { Metadata } from 'next'
import { SessionList } from '@/components/features/forum/SessionList'

export const metadata: Metadata = {
  title: 'Инструкторский раздел | Авиатренажер',
  description: 'Управление тренажерными сессиями',
}

export default function InstructorPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Инструкторский раздел</h1>
        <p className="text-gray-600">
          Здесь вы можете управлять тренажерными сессиями и оставлять комментарии с рекомендациями
        </p>
      </div>
      <SessionList isInstructorMode={true} />
    </div>
  )
}
