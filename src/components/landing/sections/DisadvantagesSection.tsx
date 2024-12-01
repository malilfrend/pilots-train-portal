export function DisadvantagesSection() {
  const disadvantages = [
    {
      number: '1',
      title: 'Отсутствие единого обменника информацией о тренажерной подготовке',
      description:
        'Обсуждения пилотами аспектов тренажерной подготовки происходят в чатах и личных беседах, то есть нигде не хранятся и не доступны для всеобщего пользования.',
    },
    {
      number: '2',
      title: 'Отсутствует возможность адаптации тренажерной сессии под конкретного пилота',
      description:
        'Инструктор не имеет возможности ознакомиться с сильными и слабыми сторонами каждого пилота заранее.',
    },
    {
      number: '3',
      title: 'Инструкторский опыт не централизован в одном месте',
      description: 'Инструкторы пердают опыт только лично.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[24px]">Недостатки текущей системы</h2>
        <div className="space-y-8">
          {disadvantages.map((item) => (
            <div key={item.number} className="flex gap-8 max-w-3xl mx-auto">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold">
                  {item.number}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
