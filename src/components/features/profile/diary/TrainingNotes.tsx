'use client'

export function TrainingNotes() {
  const notes = [
    {
      id: 1,
      date: '2024-03-15',
      session: 'Сессия 1',
      exercise: 'Отказ двигателя на взлете',
      content:
        'Необходимо улучшить скорость принятия решения при отказе двигателя V1. Отработать действия по памяти.',
    },
    // ... другие заметки
  ]

  return (
    <div className="space-y-6">
      {notes.map((note) => (
        <div key={note.id} className="border rounded-lg p-4">
          <div className="mb-2">
            <h3 className="font-semibold">
              {note.session} - {note.exercise}
            </h3>
            <p className="text-sm text-gray-500">{note.date}</p>
          </div>
          <p className="text-sm text-gray-700">{note.content}</p>
        </div>
      ))}
    </div>
  )
}
