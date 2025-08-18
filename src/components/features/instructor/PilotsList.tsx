'use client'

import { TPilot } from '@/types/pilots'

type TProps = {
  pilots: TPilot[]
  onSelectPilot?: (pilotId: number) => void
  selectedPilotIds: Record<string, boolean>
}

export const PilotsList = ({ pilots, onSelectPilot, selectedPilotIds }: TProps) => {
  return (
    <>
      {pilots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilots.map((pilot) => (
            <div
              key={pilot.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPilotIds[pilot.id]
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => onSelectPilot?.(pilot.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectPilot?.(pilot.id)
                }
              }}
              tabIndex={0}
              role="button"
            >
              <p className="font-medium">
                {pilot.profile.lastName} {pilot.profile.firstName}
              </p>
              <p className="text-sm text-gray-600">
                {pilot.profile.position || 'Должность не указана'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Нет доступных пилотов для оценки</p>
      )}
    </>
  )
}
