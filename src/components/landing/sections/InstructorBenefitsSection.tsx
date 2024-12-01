export function InstructorBenefitsSection() {
  const benefits = [
    {
      number: '1',
      title: 'Профиль пилота',
      description:
        'Перед очередной сессией инструктор изучает профиль каждого пилота: бланки самооценивания и дневник. Перед инструктором не будет "чистого листа".',
    },
    {
      number: '2',
      title: 'Бланки проверяющих',
      description:
        'Инструктор может изучить бланки проверяющих с предыдущих сессий, что позволит ему оценить динамику развития пилота и составить общую картину.',
    },
    {
      number: '3',
      title: 'Индивидуальные особенности',
      description:
        'Инструктор делает акцент на "отстающих" компетенциях и определенных упражнениях.',
    },
    {
      number: '4',
      title: 'LOFT',
      description: 'Процесс создания сценария становится легче, а сам сценарий - эффективнее.',
    },
    {
      number: '5',
      title: 'Высокий уровень фасилитации',
      description:
        'Заполнение пилотами бланков самооценивания совершенствует качество самоанализа.',
    },
    {
      number: '6',
      title: 'Передача опыта',
      description:
        'Каждый инструктор может поделиться своим опытом, а также рассказать о частых ошибках тренируемых пилотов.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[90px]">
          Преимущества для инструктора и проверяющего
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.number} className="bg-white p-6 rounded-lg shadow">
              <div className="w-10 h-10 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold mb-4">
                {benefit.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
