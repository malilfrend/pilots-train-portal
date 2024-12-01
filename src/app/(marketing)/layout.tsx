import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BackButton } from '@/components/ui/back-button'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BackButton />
      </div>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
