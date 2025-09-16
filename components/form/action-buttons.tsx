'use client'

import { Button } from '@/components/ui/button'
import { Save, Send } from 'lucide-react'

interface ActionButtonsProps {
  isSubmitting: boolean
  submitMode: 'draft' | 'submit'
  onSaveDraft: () => void
  onSubmit: () => void
  className?: string
  draftButtonText?: string
  submitButtonText?: string
  loadingDraftText?: string
  loadingSubmitText?: string
}

export function ActionButtons({
  isSubmitting,
  submitMode,
  onSaveDraft,
  onSubmit,
  className = "",
  draftButtonText = "Lưu nháp",
  submitButtonText = "Gửi yêu cầu",
  loadingDraftText = "Đang lưu...",
  loadingSubmitText = "Đang gửi..."
}: ActionButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 justify-end ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={onSaveDraft}
        disabled={isSubmitting}
        className="sm:order-1"
      >
        <Save className="h-4 w-4 mr-2" />
        {isSubmitting && submitMode === 'draft' ? loadingDraftText : draftButtonText}
      </Button>
      
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="sm:order-2"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting && submitMode === 'submit' ? loadingSubmitText : submitButtonText}
      </Button>
    </div>
  )
}
