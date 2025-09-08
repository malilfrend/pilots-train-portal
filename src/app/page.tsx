import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Дневник тренажёрной подготовки пилотов',
  description: 'Эффективная система для отслеживания и улучшения подготовки пилотов',
}

export default function HomePage() {
  redirect('/profile')
}
