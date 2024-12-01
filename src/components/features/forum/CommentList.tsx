'use client'

import { useState } from 'react'
import { Comment } from '@/types/forum'
import { formatDate } from '@/lib/utils'

interface CommentListProps {
  comments: Comment[]
  canEdit?: (comment: Comment) => boolean
  canDelete?: (comment: Comment) => boolean
  onEdit?: (commentId: number, newContent: string) => Promise<void>
  onDelete?: (commentId: number) => Promise<void>
}

export function CommentList({
  comments,
  canEdit = () => false,
  canDelete = () => false,
  onEdit,
  onDelete,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleEditClick = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: number) => {
    try {
      await onEdit?.(commentId, editContent)
      setEditingId(null)
    } catch (error) {
      console.error('Error saving edit:', error)
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b pb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-medium">
                {comment.author.firstName} {comment.author.lastName}
              </span>
              <span className="text-sm text-gray-500 ml-2">{formatDate(comment.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm px-2 py-1 rounded ${
                  comment.author.role === 'INSTRUCTOR'
                    ? 'bg-blue-100 text-blue-800'
                    : comment.author.role === 'SUPER_ADMIN'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {comment.author.role === 'INSTRUCTOR'
                  ? 'Инструктор'
                  : comment.author.role === 'SUPER_ADMIN'
                    ? 'Администратор'
                    : 'Пилот'}
              </span>
              {(canEdit(comment) || canDelete(comment)) && (
                <div className="flex gap-2">
                  {canEdit(comment) && (
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Редактировать
                    </button>
                  )}
                  {canDelete(comment) && (
                    <button
                      onClick={() => onDelete?.(comment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {editingId === comment.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(comment.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Сохранить
                </button>
                <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>
      ))}
    </div>
  )
}
