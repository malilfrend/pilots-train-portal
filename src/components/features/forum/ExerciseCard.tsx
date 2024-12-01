'use client'

import { useState } from 'react'
import { Exercise, Comment } from '@/types/forum'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import { useAuth } from '@/contexts/auth-context'

interface ExerciseCardProps {
  exercise: Exercise
  onCommentAdded: (comment: Comment) => void
  isInstructorMode?: boolean
}

export function ExerciseCard({
  exercise,
  onCommentAdded,
  isInstructorMode = false,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { user } = useAuth()

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Ошибка при удалении комментария')

      const updatedComments = exercise.comments.filter((c) => c.id !== commentId)
      exercise.comments = updatedComments
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Не удалось удалить комментарий')
    }
  }

  const handleEditComment = async (commentId: number, newContent: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent, commentId }),
      })

      if (!response.ok) throw new Error('Ошибка при редактировании комментария')

      const updatedComment = await response.json()

      const updatedComments = exercise.comments.map((c) =>
        c.id === commentId ? updatedComment : c
      )
      exercise.comments = updatedComments
    } catch (error) {
      console.error('Error editing comment:', error)
      alert('Не удалось отредактировать комментарий')
    }
  }

  return (
    <div className="p-6 border-b">
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <h3 className="text-xl font-semibold mb-2">{exercise.title}</h3>
        <p className="text-gray-600 mb-2">{exercise.description}</p>
        <div className="text-sm text-gray-500">{exercise.comments.length} комментариев</div>
      </div>

      {isExpanded && (
        <div className="mt-6">
          <CommentForm exerciseId={exercise.id} onCommentAdded={onCommentAdded} />
          <CommentList
            comments={exercise.comments}
            canEdit={(comment) => user?.id === comment.author.id || user?.role === 'SUPER_ADMIN'}
            canDelete={(comment) => user?.id === comment.author.id || user?.role === 'SUPER_ADMIN'}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
          />
        </div>
      )}
    </div>
  )
}
