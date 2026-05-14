type TProps = {
  totalExercisesTime: number
  duration: number | string
  totalScenarioValue: number
  className?: string
}

export function ScenarioTotals({
  totalExercisesTime,
  duration,
  totalScenarioValue,
  className,
}: TProps) {
  return (
    <div className={className ?? 'text-gray-900'}>
      Общее время упражнений: {totalExercisesTime} из {duration} минут
      {totalScenarioValue > 0 && <> | Общая ценность сценария: {totalScenarioValue}</>}
    </div>
  )
}
