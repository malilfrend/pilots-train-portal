export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">О проекте</h3>
            <p className="text-sm text-gray-600">
              Система для эффективного обучения и подготовки пилотов
            </p>
          </div>
          {/* Добавьте дополнительные колонки с ссылками */}
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          © 2024 Авиатренажер. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
