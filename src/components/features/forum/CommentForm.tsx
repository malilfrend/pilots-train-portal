'use client'

import { useState } from 'react'
import { LoadingButton } from '@/components/ui/loading-button'
import { Comment } from '@/types/forum'

interface CommentFormProps {
  exerciseId: number
  onCommentAdded: (comment: Comment) => void
}

export function CommentForm({ exerciseId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      setLoading(true)
      setError(null)

      console.log('JSON.stringify({ content }) :', JSON.stringify({ content }))
      const response = await fetch(
        `/api/exercises/${exerciseId}/comments?exerciseId=${exerciseId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при добавлении комментария')
      }

      const newComment = await response.json()
      onCommentAdded(newComment)
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Добавьте ваш комментарий..."
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <LoadingButton
        loading={loading}
        disabled={!content.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Отправить
      </LoadingButton>
    </form>
  )
}
