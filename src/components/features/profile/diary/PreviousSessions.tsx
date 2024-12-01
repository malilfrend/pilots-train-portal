'use client'

export function PreviousSessions() {
  const sessions = [
    {
      id: 1,
      date: '2024-03-15',
      type: 'Тренировка',
      instructor: 'Иванов И.И.',
      result: 'Успешно',
      notes:
        'Хорошее выполнение стандартных процедур. Требуется дополнительная практика в нестандартных ситуациях.',
    },
    // ... другие сессии
  ]

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <div key={session.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{session.type}</h3>
              <p className="text-sm text-gray-500">{session.date}</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-sm ${
                session.result === 'Успешно'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {session.result}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-sm text-gray-600">Инструктор: {session.instructor}</p>
          </div>
          <p className="text-sm text-gray-700">{session.notes}</p>
        </div>
      ))}
    </div>
  )
}
