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
    if (selectedAgent === 'Product PM') {
      return <BrainIcon className="h-5 w-5" />
    }
    return <SharkIcon className="h-5 w-5" />
  }

  const getAgentColor = () => {
    return selectedAgent === 'Product PM' 
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
          <h3 className="text-xl font-semibold mb-2">
            {selectedAgent === 'Product PM' ? 'Ready to discuss your product?' : 'Ready to talk strategy?'}
          </h3>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            {selectedAgent === 'Product PM' 
              ? "Ask me anything about your product strategy! Need help defining your user persona, problem statement, or product roadmap? Just start chatting. You can also upload a PRD for detailed analysis (completely optional)."
              : "Tell me about your startup idea and I'll provide investor-grade feedback! Ask me to help you refine your pitch, analyze your market, or identify risks. Upload your pitch deck for detailed analysis (optional)."
            }
          </p>
          <div className="mt-4 text-xs text-muted-foreground/70">
            💡 Document upload is optional - you can start chatting right away!
          </div>
          
          {/* Example Question Buttons */}
          {onSendMessage && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendMessage("Help me define my target user persona")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">Define User Persona</div>
                  <div className="text-xs text-muted-foreground">Who exactly is your target user?</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendMessage("Help me clarify my problem statement")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">Clarify Problem Statement</div>
                  <div className="text-xs text-muted-foreground">What specific problem are you solving?</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendMessage("Analyze my go-to-market strategy")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">Go-to-Market Strategy</div>
                  <div className="text-xs text-muted-foreground">How will you acquire customers?</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSendMessage("What are the risks in my business model?")}
                className="text-left justify-start h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">Identify Business Risks</div>
                  <div className="text-xs text-muted-foreground">What could kill your startup?</div>
                </div>
              </Button>
            </div>
          )}
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
              <div className="flex gap-1.5">
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