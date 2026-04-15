'use client'

import { useState } from 'react'
import { TPilot } from '@/types/pilots'

type TProps = {
  onCreated: (pilot: TPilot) => void
  onCancel: () => void
}

export const CreatePilotForm = ({ onCreated, onCancel }: TProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    position: '',
    flightHours: '',
    aircraftType: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/pilots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          flightHours: formData.flightHours ? parseInt(formData.flightHours) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при создании пилота')
      }

      const data = await response.json()
      onCreated(data.pilot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Создание нового пилота</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="create-pilot-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email *
          </label>
          <input
            id="create-pilot-email"
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Пароль *
          </label>
          <input
            id="create-pilot-password"
            type="password"
            name="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Фамилия *
          </label>
          <input
            id="create-pilot-lastName"
            type="text"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Имя *
          </label>
          <input
            id="create-pilot-firstName"
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-birthDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дата рождения *
          </label>
          <input
            id="create-pilot-birthDate"
            type="date"
            name="birthDate"
            required
            value={formData.birthDate}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-position"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Должность
          </label>
          <input
            id="create-pilot-position"
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-flightHours"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Налёт (часы)
          </label>
          <input
            id="create-pilot-flightHours"
            type="number"
            name="flightHours"
            min={0}
            value={formData.flightHours}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label
            htmlFor="create-pilot-aircraftType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Тип воздушного судна
          </label>
          <input
            id="create-pilot-aircraftType"
            type="text"
            name="aircraftType"
            value={formData.aircraftType}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="md:col-span-2 flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Создание...' : 'Создать пилота'}
          </button>
        </div>
      </form>
    </div>
  )
}
