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
