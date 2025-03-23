import { ProfileInfo } from '@/components/features/profile/ProfileInfo'
import { ProfileAssessments } from '@/components/features/profile/ProfileAssessments'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Профиль | Авиатренажер',
  description: 'Информация о пользователе',
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProfileInfo />
      <ProfileAssessments />
    </div>
  )
}
