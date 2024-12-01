'use client'

import { useState } from 'react'
import { Session } from '@/types/forum'
import { InstructorExerciseList } from './InstructorExerciseList'

interface InstructorSessionCardProps {
  session: Session
}

export function InstructorSessionCard({ session }: InstructorSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow">
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold mb-2">{session.title}</h2>
            <p className="text-gray-600 mb-2">{session.description}</p>
            <div className="text-sm text-gray-500">{session.exercises.length} упражнений</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">{session.number}</span>
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t">
          <InstructorExerciseList sessionId={session.id} />
        </div>
      )}
    </div>
  )
}
