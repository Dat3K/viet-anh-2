'use client'

import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface ActionButtonsProps {
  isSubmitting: boolean
  onSubmit: () => void
  disabled?: boolean
  className?: string
  submitButtonText?: string
  loadingSubmitText?: string
}

export function ActionButtons({
  isSubmitting,
  onSubmit,
  disabled = false,
  className = "",
  submitButtonText = "Gửi yêu cầu",
  loadingSubmitText = "Đang gửi..."
}: ActionButtonsProps) {
  return (
    <div className={`flex justify-end ${className}`}>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? loadingSubmitText : submitButtonText}
      </Button>
    </div>
  )
}
