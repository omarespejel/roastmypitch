"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/app/lib/utils"
import { Bot, User } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  selectedAgent?: string  // Add this
}

export default function ChatInterface({ messages, isLoading, selectedAgent = 'Shark VC' }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 mb-4">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {selectedAgent === 'Product PM' ? 'Ready to refine your product?' : 'Ready for investor feedback?'}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {selectedAgent === 'Product PM' 
              ? "Upload your PRD or describe your product. I'll help you refine your product strategy with frameworks from top tech companies."
              : "Upload your pitch deck. I'll analyze it like a top-tier VC would, focusing on what matters for fundraising."
            }
          </p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-3 message-enter",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-secondary">
                <Bot className="h-5 w-5" />
              </div>
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[70%] rounded-lg px-4 py-3",
              message.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                : 'bg-secondary'
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-secondary">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div className="bg-secondary rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {selectedAgent === 'Shark VC' && (
                <span className="text-xs text-muted-foreground">Researching market data...</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
} 