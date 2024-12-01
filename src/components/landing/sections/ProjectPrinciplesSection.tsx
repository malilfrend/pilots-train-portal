export function ProjectPrinciplesSection() {
  const principles = [
    {
      number: '1',
      title: 'Открытость',
      description:
        'Есть возможность открытого обсуждения упражнений со всеми коллегами независимо от должности.',
    },
    {
      number: '2',
      title: 'Хранение данных',
      description:
        'Комментарии и обсуждения остаются в базе, даже через 5 лет можно просмотреть свои ошибки или особенности выполнения определенного упражнения.',
    },
    {
      number: '3',
      title: 'Индивидуальный подход',
      description:
        'Перед подготовкой к проведению сессии инструктор имеет возможность адаптировать программу под конкретного пилота.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[90px]">Принципы проекта</h2>
        <div className="space-y-8">
          {principles.map((principle) => (
            <div key={principle.number} className="flex gap-8 max-w-3xl mx-auto">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold">
                  {principle.number}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{principle.title}</h3>
                <p className="text-gray-600">{principle.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
