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
  firstName?: string
  lastName?: string
  birthDate?: string
  university?: string
  company?: string
  role?: string
  root?: string
}

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    university: '',
    company: '',
    role: 'PILOT',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const router = useRouter()
  const { setUser } = useAuth()

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email'
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов'
    }
    if (!formData.firstName) {
      newErrors.firstName = 'Имя обязательно'
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Фамилия обязательна'
    }
    if (!formData.birthDate) {
      newErrors.birthDate = 'Дата рождения обязательна'
    }
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ root: data.error || 'Ошибка при регистрации' })
        return
      }

      setUser(data.user)

      router.push('/')
    } catch (error) {
      setErrors({ root: 'Что-то пошло не так. Попробуйте позже.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Регистрация"
      description="Создайте аккаунт для доступа к системе"
      footer={
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Войти
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Имя"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <FormField
            label="Фамилия"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>
        <FormField
          label="Дата рождения"
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          error={errors.birthDate}
        />
        <FormField
          label="Университет"
          name="university"
          value={formData.university}
          onChange={handleChange}
          error={errors.university}
        />
        <FormField
          label="Компания"
          name="company"
          value={formData.company}
          onChange={handleChange}
          error={errors.company}
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="PILOT">Пилот</option>
          <option value="INSTRUCTOR">Инструктор</option>
        </select>
        {errors.root && <p className="text-sm text-destructive">{errors.root}</p>}
        <LoadingButton loading={loading} className="w-full">
          Зарегистрироваться
        </LoadingButton>
      </form>
    </AuthCard>
  )
}
