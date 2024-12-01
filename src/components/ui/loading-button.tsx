import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function LoadingButton({ children, loading, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
