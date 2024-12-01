export function SiteStructureSection() {
  const features = [
    {
      number: '1',
      title: 'Персональный профиль пилота',
      description:
        'В профиле хранятся бланки от проверяющего и инструктора, бланки самооценивания и дневник пилота о пройденных сессиях.',
    },
    {
      number: '2',
      title: 'Открытый форум',
      description:
        'На форуме представлены ветки обсуждений всех 6 сессий. Можно выбрать любой отказ из любой сессии и оставить свои комментарии - поделиться ошибками, неожиданными моментами, неоднозначным описанием процедуры в документах и др.',
    },
    {
      number: '3',
      title: 'Раздел инструкторского состава',
      description:
        'Инструкторы и проверяющие смогут накапливать свой опыт на единой платформе и делиться им с коллегами: особенностями работы систем при конкретных отказах, распределением обязанностей в нестандартных ситуациях, любыми другими аспектами, которые выходят за рамки существующей документации.',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[90px]">Структура сайта</h2>
        <div className="space-y-8">
          {features.map((feature) => (
            <div key={feature.number} className="flex gap-8 max-w-3xl mx-auto">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full border-2 border-[#1f5bff] text-[#1f5bff] flex items-center justify-center font-bold">
                  {feature.number}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
