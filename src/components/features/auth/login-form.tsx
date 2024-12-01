'use client'

import { useState } from 'react'
import { AuthCard } from '@/components/ui/auth-card'
import { FormField } from '@/components/ui/form-field'
import { LoadingButton } from '@/components/ui/loading-button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface FormErrors {
  email?: string
  password?: string
  root?: string
}

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const router = useRouter()
  const { login } = useAuth()

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email'
    }
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов'
    }
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setLoading(true)
      await login(formData.email, formData.password)
      router.push('/profile')
      router.refresh()
    } catch (error) {
      setErrors({
        root: error instanceof Error ? error.message : 'Что-то пошло не так',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Вход"
      description="Введите свои данные для входа в систему"
      footer={
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <FormField
          label="Пароль"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        {errors.root && <p className="text-sm text-destructive">{errors.root}</p>}
        <LoadingButton loading={loading} className="w-full">
          Войти
        </LoadingButton>
      </form>
    </AuthCard>
  )
}
