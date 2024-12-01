import { Landing } from '@/components/landing/Landing'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Дневник тренажёрной подготовки пилотов',
  description: 'Эффективная система для отслеживания и улучшения подготовки пилотов',
}

export default function HomePage() {
  return (
    <main>
      <Landing />
    </main>
  )
}
