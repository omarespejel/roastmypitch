"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/app/lib/utils"
import { Bot, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { SharkIcon, BrainIcon } from "./custom-icons"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  selectedAgent?: string
  onSendMessage?: (message: string) => void
}

export default function ChatInterface({ messages, isLoading, selectedAgent = 'Shark VC', onSendMessage }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAgentIcon = () => {
    if (selectedAgent === 'Product Manager') {
      return <BrainIcon className="h-5 w-5" />
    }
    return <SharkIcon className="h-5 w-5" />
  }

  const getAgentColor = () => {
    return selectedAgent === 'Product Manager' 
      ? 'from-blue-600/20 to-cyan-600/20' 
      : 'from-red-600/20 to-orange-600/20'
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center animate-slide-up">
          <div className={cn(
            "p-6 rounded-full bg-gradient-to-br mb-6 animate-pulse-glow",
            getAgentColor()
          )}>
            {getAgentIcon()}
          </div>
          <h3 className="text-xl font-semibold mb-4">
            Ready to help with your startup
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ask me anything about your business idea
          </p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-3 animate-slide-up",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className={cn(
                "p-2.5 rounded-full bg-gradient-to-br shadow-lg",
                getAgentColor()
              )}>
                {getAgentIcon()}
              </div>
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm",
              message.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
                : 'bg-secondary/60 backdrop-blur-sm border border-border/50'
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
          
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="p-2.5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-3 justify-start animate-slide-up">
          <div className="flex-shrink-0">
            <div className={cn(
              "p-2.5 rounded-full bg-gradient-to-br shadow-lg",
              getAgentColor()
            )}>
              {getAgentIcon()}
            </div>
          </div>
          <div className="bg-secondary/60 backdrop-blur-sm border border-border/50 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">
                {selectedAgent === 'Product Manager' 
                  ? 'Analyzing product strategy...'
                  : 'Consulting VC frameworks...'
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
} 