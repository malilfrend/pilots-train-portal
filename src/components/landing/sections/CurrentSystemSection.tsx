export function CurrentSystemSection() {
  const steps = [
    {
      number: '1',
      title: 'Самоподготовка',
      description:
        'Повторение SOP, FCOM, QRH, Часть В РПП, ознакомление с содержанием сессии, изучение особенностей аэродромов и различных материалов (презентаций).',
    },
    {
      number: '2',
      title: 'Опрос и наземная подготовка',
      description:
        'Опрос по следующим темам: LIMITATIONS, MEMORY ITEMS, RECOMMENDED ELEMENTS OF A STABILIZED APPROACH, GO-AROUND AND MISSED APPROACH PROCEDURE, LANDING. В ходе проведения наземной подготовки инструктор рассказывает о содержании сессии.',
    },
    {
      number: '3',
      title: '1 день - Тренировочная сессия',
      description: 'Брифинг с инструктором, 4 часа отработки программы, разбор.',
    },
    {
      number: '4',
      title: '2 день - Тренировка и проверка / LOFT и проверка',
      description:
        'Брифинг с инструктором, 2 часа отработки программы и 2 часа проверка или Брифинг с инструктором, допущенным к проведению LOFT, 2 часа LOFT и 2 часа проверка, разбор.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Текущая система</h2>
        <div className="text-xl text-center mb-[24px]">
          На данный момент тренажерная подготовка состоит из:
        </div>
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-8 max-w-3xl mx-auto">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold">
                  {step.number}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
