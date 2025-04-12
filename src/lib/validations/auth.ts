import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().min(1, 'Email обязателен').email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  birthDate: z.string().min(1, 'Дата рождения обязательна'),
  university: z.string().optional(),
  company: z.string().optional(),
  experience: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['PILOT', 'INSTRUCTOR']).default('PILOT'),
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Схема для обновления профиля пользователя
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  university: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
