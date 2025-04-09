import { LoginForm } from '@/components/features/auth/login-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вход | Авиатренажер',
  description: 'Страница входа в систему',
}

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center mx-auto">
      <LoginForm />
    </div>
  )
}
