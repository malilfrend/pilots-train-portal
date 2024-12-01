'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'

interface InstructorCommentFormProps {
  exerciseId: number
  onCommentAdded: (comment: any) => void
}

export function InstructorCommentForm({ exerciseId, onCommentAdded }: InstructorCommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      setLoading(true)
      const response = await fetch(`/api/exercises/${exerciseId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error()
      const comment = await response.json()
      onCommentAdded(comment)
      setContent('')
    } catch (error) {
      alert('Ошибка при добавлении комментария')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Добавьте комментарий..."
        className="w-full p-3 border rounded-lg mb-2"
        rows={3}
        name="content"
      />
      <LoadingButton loading={loading} disabled={!content.trim()}>
        Отправить
      </LoadingButton>
    </form>
  )
}
