'use client'

import { useAuth } from '@/contexts/auth-context'

export function HeroSection() {
  const { user } = useAuth()

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Единая база тренажерной подготовки
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Главная цель - создание единой базы данных, с помощью которой тренажерная подготовка
            выйдет на новый уровень.
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="px-8 py-3 bg-[#1f5bff] text-white rounded-lg hover:bg-blue-700 transition"
              >
                Войти в систему
              </a>
              <a
                href="/register"
                className="px-8 py-3 border border-[#1f5bff] text-[#1f5bff] rounded-lg hover:bg-blue-50 transition"
              >
                Зарегистрироваться
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
