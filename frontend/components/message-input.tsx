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
  selectedAgent: string
  isUploadDisabled?: boolean
}

export default function MessageInput({ onSendMessage, onUploadFile, isLoading, selectedAgent, isUploadDisabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading || isUploadDisabled) return
    onSendMessage(message)
    setMessage('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf' && !isUploadDisabled) {
      onUploadFile(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const getPlaceholder = () => {
    if (selectedAgent === 'Product Manager') {
      return "Ask me: 'Help me define my user persona' or 'What's my product roadmap?'"
    }
    return "Ask me: 'Is my market big enough?' or 'What do VCs want to see?'"
  }

  return (
    <form onSubmit={handleSend} className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Add suggested topic hint */}

        
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isUploadDisabled ? "Please wait while document is being processed..." : getPlaceholder()}
            className="min-h-[80px] pr-24 resize-none"
            disabled={isLoading || isUploadDisabled}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploadDisabled}
              className={cn(
                "h-8 w-8",
                isUploadDisabled && "opacity-50 cursor-not-allowed"
              )}
              title={isUploadDisabled ? "Please wait while document is being processed" : "Upload PDF document"}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              size="icon"
              variant={message.trim() ? "gradient" : "ghost"}
              disabled={isLoading || !message.trim() || isUploadDisabled}
              className={cn(
                "h-8 w-8",
                message.trim() && !isUploadDisabled && "hover:scale-110"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <p>Press Enter to send, Shift+Enter for new line</p>
            <p>Documents optional - just start chatting about your idea!</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2 space-y-1">
            <p className="text-blue-700 dark:text-blue-300 font-medium">
              📄 Pitch Deck Tips:
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              • Compress your PDF first at{' '}
              <a 
                href="https://smallpdf.com/compress-pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-800 dark:hover:text-blue-200"
              >
                smallpdf.com/compress-pdf
              </a>{' '}
              for faster processing
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              • Large files with charts may take up to a minute to analyze
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              • Check the suggested questions panel after upload!
            </p>
          </div>
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