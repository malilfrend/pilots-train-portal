import { Metadata } from 'next'
import { ExerciseList } from '@/components/features/forum/ExerciseList'
import { getSession } from '@/lib/prisma/sessions'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const session = await getSession(parseInt(resolvedParams.id))
  return {
    title: `${session?.title || 'Сессия'} | Авиатренажер`,
    description: session?.description,
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const resolvedParams = await params
  const session = await getSession(parseInt(resolvedParams.id))

  if (!session) {
    return <div>Сессия не найдена</div>
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl font-bold text-blue-600">{session.number}</span>
          <h1 className="text-2xl font-bold">{session.title}</h1>
        </div>
        <p className="text-gray-600">{session.description}</p>
      </div>
      <ExerciseList sessionId={session.id} />
    </div>
  )
}
