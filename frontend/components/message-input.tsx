"use client"

import { useState, useRef } from 'react'
import { Button } from "@/app/components/ui/button"
import { Textarea } from "@/app/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface MessageInputProps {
  onSendMessage: (message: string) => void
  onUploadFile: (file: File) => void
  isLoading: boolean
  suggestedTopic?: string  // Add this
}

export default function MessageInput({ onSendMessage, onUploadFile, isLoading, suggestedTopic }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return
    onSendMessage(message)
    setMessage('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onUploadFile(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <form onSubmit={handleSend} className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Add suggested topic hint */}
        {suggestedTopic && (
          <div className="mb-2 text-xs text-muted-foreground flex items-center gap-2">
            <span>💡 Try asking about:</span>
            <button
              type="button"
              onClick={() => setMessage(`Tell me about ${suggestedTopic}`)}
              className="text-primary hover:underline"
            >
              {suggestedTopic}
            </button>
          </div>
        )}
        
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to help define your user persona, problem statement, market strategy, or just describe your idea..."
            className="min-h-[80px] pr-24 resize-none"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              size="icon"
              variant={message.trim() ? "gradient" : "ghost"}
              disabled={isLoading || !message.trim()}
              className={cn(
                "h-8 w-8",
                message.trim() && "hover:scale-110"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <p>Press Enter to send, Shift+Enter for new line</p>
          <p>Documents optional - just start chatting about your idea!</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </form>
  )
} 