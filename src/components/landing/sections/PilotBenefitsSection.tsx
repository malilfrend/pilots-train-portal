import Image from 'next/image'

export function PilotBenefitsSection() {
  const benefits = [
    {
      title: 'Бланк самооценивания',
      description:
        'После окончания сессии необходимо заполнить бланк по 9 компетенциям. Это позволит пилотам лучше прорабатывать компетенции. Хранится в личном профиле (доступен только инструкторам и проверяющим)',
      imageSrc: 'https://static.tildacdn.info/tild6535-3433-4933-a566-613366303535/_.png',
    },
    {
      title: 'Дневник',
      description:
        'Также можно оставить свои комментарии по поводу выполнения определенных упражнений или работы систем при отказах. Это позволит просмотреть ошибки, совершенные на предыдущих тренировках, при подготовке к следующей сессии. Хранится в личном профиле (доступен только инструкторам и проверяющим)',
      imageSrc: 'https://static.tildacdn.info/tild3461-3135-4762-b262-393637353065/__.jpg',
    },
    {
      title: 'Форум',
      description:
        'На форуме созданы ветки всех сессий и всех отказов. Есть возможность открыто обсудить ошибки, особенности выполнения процедур, "ловушки", в которые экипаж может попасть, сталкиваясь с определенными ситуациями, или же просто оставить свои комментарии. У всех пилотов появляется возможность учиться на чужих ошибках.',
      imageSrc: 'https://static.tildacdn.info/tild3263-3265-4634-b835-343665386261/scale_1200.jpeg',
    },
  ]

  return (
    <section className="py-[32px]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-[90px]">Преимущества для пилота</h2>
        <div className="space-y-20">
          {benefits.map((benefit, index) => (
            <div key={index} className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
              {index % 2 === 0 ? (
                <>
                  <div className="relative h-[300px]">
                    <Image
                      src={benefit.imageSrc}
                      alt={benefit.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                  <div className="relative h-[300px]">
                    <Image
                      src={benefit.imageSrc}
                      alt={benefit.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
