'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import {
  COMPETENCIES,
  COMPETENCIES_CODES,
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPES_LABELS,
  CompetencyCode,
  AssessmentSourceType,
} from '@/types/assessment'

export default function CompetencyWeightsPage() {
  const [editWeights, setEditWeights] = useState<
    Record<CompetencyCode, Record<AssessmentSourceType, string>>
  >({} as any)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<CompetencyCode, boolean>>({} as any)

  useEffect(() => {
    fetchWeights()
  }, [])

  // Проверка суммы весов для каждой компетенции
  useEffect(() => {
    const errors: Record<CompetencyCode, boolean> = {} as any
    for (const code of COMPETENCIES_CODES) {
      let sum = 0
      for (const type of ASSESSMENT_TYPES) {
        const val = editWeights[code]?.[type]
        if (val && !isNaN(Number(val))) {
          sum += Number(val)
        }
      }
      errors[code] = Math.abs(sum - 1) > 0.001 // допускаем небольшую погрешность
    }
    setRowErrors(errors)
  }, [editWeights])

  const fetchWeights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/competency-weights')
      if (!res.ok) throw new Error('Ошибка загрузки весов')
      const data = await res.json()
      // Для редактирования используем строки (для удобства input)
      setEditWeights(
        Object.fromEntries(
          COMPETENCIES_CODES.map((code) => [
            code,
            Object.fromEntries(
              ASSESSMENT_TYPES.map((type) => [type, data.weights?.[code]?.[type]?.toString() ?? ''])
            ),
          ])
        ) as any
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (code: CompetencyCode, type: AssessmentSourceType, value: string) => {
    setEditWeights((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [type]: value,
      },
    }))
  }

  const handleSave = async () => {
    // Не отправлять, если есть ошибки
    if (Object.values(rowErrors).some(Boolean)) {
      setError('Сумма весов по каждой компетенции должна быть равна 1!')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      // Преобразуем строки в числа
      const toSave: Record<CompetencyCode, Record<AssessmentSourceType, number>> = {} as any
      for (const code of COMPETENCIES_CODES) {
        toSave[code] = {} as any
        for (const type of ASSESSMENT_TYPES) {
          const val = editWeights[code]?.[type]
          if (val && !isNaN(Number(val))) {
            toSave[code][type] = Number(val)
          }
        }
      }
      const res = await fetch('/api/competency-weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: toSave }),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      setSuccess('Веса успешно сохранены!')
      fetchWeights()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Весовые коэффициенты компетенций</h1>
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 mb-4 rounded">{error}</div>}
      {success && (
        <div className="bg-green-100 text-green-700 px-4 py-2 mb-4 rounded">{success}</div>
      )}
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse border border-gray-300">
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-300 px-4 py-2">Компетенция</TableHead>
                {ASSESSMENT_TYPES.map((type) => (
                  <TableHead key={type} className="border border-gray-300 px-4 py-2 text-center">
                    {type} <br /> <span className="text-xs">{ASSESSMENT_TYPES_LABELS[type]}</span>
                  </TableHead>
                ))}
                <TableHead className="border border-gray-300 px-4 py-2 text-center">
                  Сумма
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPETENCIES_CODES.map((code) => {
                const sum = ASSESSMENT_TYPES.reduce((acc, type) => {
                  const val = editWeights[code]?.[type]
                  return acc + (val && !isNaN(Number(val)) ? Number(val) : 0)
                }, 0)
                return (
                  <TableRow key={code}>
                    <TableCell className="border border-gray-300 px-4 py-2 font-medium">
                      {code} - {COMPETENCIES[code].nameEn}
                      <br />
                      <span className="text-xs text-gray-500">{COMPETENCIES[code].name}</span>
                    </TableCell>
                    {ASSESSMENT_TYPES.map((type) => (
                      <TableCell
                        key={type}
                        className="border border-gray-300 px-4 py-2 text-center"
                      >
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="w-20 border rounded px-2 py-1 text-center"
                          value={editWeights[code]?.[type] ?? ''}
                          onChange={(e) => handleChange(code, type, e.target.value)}
                          disabled={saving}
                        />
                      </TableCell>
                    ))}
                    <TableCell
                      className={`border border-gray-300 px-4 py-2 text-center font-bold ${rowErrors[code] ? 'text-red-600' : 'text-green-700'}`}
                    >
                      {sum.toFixed(2)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="mt-2 text-sm text-red-600">
            {Object.entries(rowErrors).some(([_, v]) => v) &&
              'Сумма весов по каждой компетенции должна быть равна 1!'}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleSave}
              disabled={saving || Object.values(rowErrors).some(Boolean)}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
