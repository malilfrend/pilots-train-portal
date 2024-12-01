export interface Session {
  id: number
  number: number
  title: string
  description: string
  exercises: {
    id: number
    title: string
    description: string
    _count: {
      comments: number
    }
  }[]
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: number
  title: string
  description: string
  sessionId: number
  comments: Comment[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  content: string
  exerciseId: number
  author: {
    id: number
    firstName: string
    lastName: string
    role: string
  }
  createdAt: string
  updatedAt: string
}
