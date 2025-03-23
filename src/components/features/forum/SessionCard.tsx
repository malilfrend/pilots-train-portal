'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Session } from '@/types/forum'
import { ExerciseList } from './ExerciseList'

interface SessionCardProps {
  session: Session
  isInstructorMode?: boolean
}

export function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between p-6">
        <Link href={`/forum/sessions/${session.id}`} className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">{session.title}</h2>
              <p className="text-gray-600 mb-2">{session.description}</p>
              <div className="text-sm text-gray-500">{session.exercises.length} упражнений</div>
            </div>
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }}
          className="ml-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="border-t">
          <ExerciseList sessionId={session.id} />
        </div>
      )}
    </div>
  )
}
