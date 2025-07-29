"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import { Textarea } from '@/app/components/ui/textarea'
import { Button } from '@/app/components/ui/button'
import { Star } from 'lucide-react'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (feedback: string, rating: number) => void
}

export default function FeedbackModal({ open, onClose, onSubmit }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)

  const handleSubmit = () => {
    if (feedback.trim() || rating > 0) {
      onSubmit(feedback, rating)
      setFeedback('')
      setRating(0)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] card-hover bg-gradient-to-br from-background to-secondary/20 border-border/50">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-primary to-starknet-teal bg-clip-text text-transparent">
            Quick Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve! How's your experience so far?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-all hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could we improve? (optional)"
            rows={3}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button onClick={handleSubmit} className="btn-starknet">
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 