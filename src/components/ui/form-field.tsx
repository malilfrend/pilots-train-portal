import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input ref={ref} className={cn(error && 'border-red-500', className)} {...props} />
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    )
  }
)
FormField.displayName = 'FormField'
