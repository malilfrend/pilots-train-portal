import { RegisterForm } from '@/components/features/auth/register-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Регистрация | Авиатренажер',
  description: 'Создайте аккаунт для доступа к системе',
}

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center mx-auto">
      <RegisterForm />
    </div>
  )
}
