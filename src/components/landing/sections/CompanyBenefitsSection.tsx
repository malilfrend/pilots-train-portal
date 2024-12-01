export function CompanyBenefitsSection() {
  const benefits = [
    {
      number: '1',
      title: 'EBT',
      description:
        'Сбор полётных данных и их анализ являются неотъемлемой частью парадигмы EBT. Но данные тренажерных сессий являются не менее ценным материалом, который необходимо сохранять и анализировать.',
    },
    {
      number: '2',
      title: 'Универсальность',
      description:
        'Подходит как для текущей концепции тренажерной подготовки (тренировка-проверка), так и для концепции EBT (проверка-тренировка)',
    },
    {
      number: '3',
      title: 'Простота внедрения и использования',
      description: 'Не требуется колоссальных вложений и систематических изменений.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[90px]">
          Преимущества для руководства авиакомпании
        </h2>
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <div key={benefit.number} className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold text-2xl mx-auto mb-6">
                {benefit.number}
              </div>
              <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
              <p className="text-gray-600 text-lg">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
