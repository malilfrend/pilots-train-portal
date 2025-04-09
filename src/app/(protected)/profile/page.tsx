'use client'

import { ProfileInfo } from '@/components/features/profile/ProfileInfo'
import { ProfileAssessments } from '@/components/features/profile/ProfileAssessments'
import { ClientAuthGuard } from '@/components/features/auth/ClientAuthGuard'

export default function ProfilePage() {
  return (
    <ClientAuthGuard>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileInfo />
        <ProfileAssessments />
      </div>
    </ClientAuthGuard>
  )
}
