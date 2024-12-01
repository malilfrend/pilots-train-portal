'use client'

import { useState } from 'react'
import { SelfAssessmentForms } from './diary/SelfAssessmentForms'
import { TrainingNotes } from './diary/TrainingNotes'
import { PreviousSessions } from './diary/PreviousSessions'

type TabType = 'self-assessment' | 'notes' | 'previous-sessions'

export function TrainingDiary() {
  const [activeTab, setActiveTab] = useState<TabType>('self-assessment')

  const tabs = [
    { id: 'self-assessment', label: 'Бланки самооценивания' },
    { id: 'notes', label: 'Заметки по упражнениям' },
    { id: 'previous-sessions', label: 'Предыдущие сессии' },
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-6">Дневник тренажерной подготовки</h2>

      <div className="border-b mb-6">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'self-assessment' && <SelfAssessmentForms />}
        {activeTab === 'notes' && <TrainingNotes />}
        {activeTab === 'previous-sessions' && <PreviousSessions />}
      </div>
    </div>
  )
}
