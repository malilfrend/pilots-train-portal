import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { BackButton } from '@/components/ui/back-button'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BackButton />
      </div>
      {children}
    </div>
  )
}
