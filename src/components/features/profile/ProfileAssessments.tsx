'use client'

import { useState } from 'react'
import { AssessmentTable } from './AssessmentTable'
import { Assessment, AssessmentType } from '@/types/assessment'

const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: '1',
    type: 'EVAL',
    date: '2024-03-15',
    competencyScores: [
      { competencyCode: 'APK', score: 3 },
      { competencyCode: 'COM', score: 4 },
      { competencyCode: 'FPA', score: 3 },
      { competencyCode: 'FPM', score: 3 },
      { competencyCode: 'LTW', score: 4 },
      { competencyCode: 'PSD', score: 3 },
      { competencyCode: 'SAW', score: 4 },
      { competencyCode: 'WLM', score: 3 },
      { competencyCode: 'KNO', score: 4 },
    ],
    instructorComment:
      'Хорошее знание процедур, но нужно улучшить коммуникацию в критических ситуациях.',
  },
  {
    id: '2',
    type: 'QUALIFICATION',
    date: '2024-03-10',
    competencyScores: [
      { competencyCode: 'APK', score: 4 },
      { competencyCode: 'COM', score: 3 },
      { competencyCode: 'FPA', score: 4 },
      { competencyCode: 'FPM', score: 4 },
      { competencyCode: 'LTW', score: 3 },
      { competencyCode: 'PSD', score: 4 },
      { competencyCode: 'SAW', score: 3 },
      { competencyCode: 'WLM', score: 4 },
      { competencyCode: 'KNO', score: 3 },
    ],
    instructorComment:
      'Квалификационная проверка пройдена успешно. Рекомендуется уделить внимание ситуационной осознанности.',
  },
  {
    id: '3',
    type: 'AVIATION_EVENT',
    date: '2024-02-20',
    competencyScores: [
      { competencyCode: 'APK', score: 3 },
      { competencyCode: 'COM', score: 3 },
      { competencyCode: 'FPA', score: 4 },
      { competencyCode: 'FPM', score: 3 },
      { competencyCode: 'LTW', score: 3 },
      { competencyCode: 'PSD', score: 4 },
      { competencyCode: 'SAW', score: 3 },
      { competencyCode: 'WLM', score: 3 },
      { competencyCode: 'KNO', score: 4 },
    ],
    instructorComment:
      'Действия при авиационном событии были адекватными. Необходимо усилить контроль за выполнением стандартных операционных процедур.',
  },
  {
    id: '4',
    type: 'FLIGHT_DATA_ANALYSIS',
    date: '2024-01-15',
    competencyScores: [
      { competencyCode: 'APK', score: 4 },
      { competencyCode: 'COM', score: 4 },
      { competencyCode: 'FPA', score: 3 },
      { competencyCode: 'FPM', score: 4 },
      { competencyCode: 'LTW', score: 4 },
      { competencyCode: 'PSD', score: 3 },
      { competencyCode: 'SAW', score: 4 },
      { competencyCode: 'WLM', score: 4 },
      { competencyCode: 'KNO', score: 3 },
    ],
    instructorComment:
      'Анализ полетных данных показывает хорошую технику пилотирования. Обратите внимание на точность выдерживания параметров при заходе на посадку.',
  },
]

const assessmentTypeLabels: Record<AssessmentType, string> = {
  EVAL: 'Этап Оценки (EVAL)',
  QUALIFICATION: 'Квалификационная проверка',
  AVIATION_EVENT: 'Авиационное событие (АС)',
  FLIGHT_DATA_ANALYSIS: 'Программа анализа полетных данных',
}

export function ProfileAssessments() {
  // Находим последнюю оценку для каждого типа
  const evalAssessment = MOCK_ASSESSMENTS.find((a) => a.type === 'EVAL') || null
  const qualificationAssessment = MOCK_ASSESSMENTS.find((a) => a.type === 'QUALIFICATION') || null
  const aviationEventAssessment = MOCK_ASSESSMENTS.find((a) => a.type === 'AVIATION_EVENT') || null
  const flightDataAssessment =
    MOCK_ASSESSMENTS.find((a) => a.type === 'FLIGHT_DATA_ANALYSIS') || null

  const generalAssessment: Assessment = {
    id: 'general',
    type: 'EVAL',
    date: new Date().toISOString(),
    competencyScores: [
      { competencyCode: 'APK', score: 3 },
      { competencyCode: 'COM', score: 3 },
      { competencyCode: 'FPA', score: 4 },
      { competencyCode: 'FPM', score: 3 },
      { competencyCode: 'LTW', score: 4 },
      { competencyCode: 'PSD', score: 3 },
      { competencyCode: 'SAW', score: 3 },
      { competencyCode: 'WLM', score: 4 },
      { competencyCode: 'KNO', score: 3 },
    ],
  }

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-2xl font-bold mb-6">Оценка компетенций пилота</h2>

      <div className="mb-12">
        <AssessmentTable title={assessmentTypeLabels.EVAL} assessment={evalAssessment} />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Этап оценки (EVAL) — это формальная оценка компетенций пилота, проводимая после
            завершения определенного этапа обучения или периода работы.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.QUALIFICATION}
          assessment={qualificationAssessment}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Квалификационная проверка — официальная процедура подтверждения квалификации пилота,
            проводимая в соответствии с авиационными правилами.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.AVIATION_EVENT}
          assessment={aviationEventAssessment}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Оценка компетенций пилота после авиационного события или инцидента, направленная на
            выявление потенциальных областей для улучшения.
          </p>
        </div>
      </div>

      <div className="mb-12">
        <AssessmentTable
          title={assessmentTypeLabels.FLIGHT_DATA_ANALYSIS}
          assessment={flightDataAssessment}
        />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Анализ полетных данных позволяет объективно оценить технику пилотирования и соблюдение
            стандартных операционных процедур на основе фактических данных полета.
          </p>
        </div>
      </div>

      <div>
        <AssessmentTable title="Общая таблица компетенций" assessment={generalAssessment} />
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm italic">
            Сводная таблица компетенций отражает обобщенную оценку навыков пилота по всем ключевым
            областям компетенций.
          </p>
        </div>
      </div>
    </div>
  )
}
