'use client'

export function SelfAssessmentForms() {
  const assessments = [
    {
      id: 1,
      date: '2024-03-15',
      session: 'Сессия 1',
      competencies: [
        { name: 'Применение процедур', score: 4 },
        { name: 'Коммуникация', score: 5 },
        { name: 'Управление траекторией полета', score: 3 },
        // ... другие компетенции
      ],
    },
    // ... другие оценки
  ]

  return (
    <div className="space-y-6">
      {assessments.map((assessment) => (
        <div key={assessment.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">{assessment.session}</h3>
              <p className="text-sm text-gray-500">{assessment.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {assessment.competencies.map((comp) => (
              <div key={comp.name} className="flex justify-between">
                <span className="text-sm">{comp.name}</span>
                <span className="text-sm font-medium">{comp.score}/5</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
