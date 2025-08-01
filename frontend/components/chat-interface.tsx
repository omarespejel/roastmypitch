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
            Let's build your startup strategy
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button 
              onClick={() => onSendMessage && onSendMessage("Help me identify my target customer")}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={!onSendMessage}
            >
              🎯 Define Target Customer
            </Button>
            <Button 
              onClick={() => onSendMessage && onSendMessage("What's the biggest risk to my business?")}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              disabled={!onSendMessage}
            >
              ⚠️ Identify Key Risks
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Or just type your question below ↓
          </p>
          <div className="mt-2 text-xs text-muted-foreground/70">
            💡 Document upload is optional - you can start chatting right away!
          </div>
          
          {/* Additional Starter Prompts */}
          {onSendMessage && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {selectedAgent === 'Product Manager' ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("👥 Who exactly should use my product?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">👥 Define User Persona</div>
                      <div className="text-xs text-muted-foreground">Who exactly should use my product?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("💡 How do I validate my product idea?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">💡 Validate Product Idea</div>
                      <div className="text-xs text-muted-foreground">How do I validate my product idea?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("🎯 What features should I build first?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">🎯 Feature Prioritization</div>
                      <div className="text-xs text-muted-foreground">What features should I build first?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("📊 How do I measure product success?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">📊 Success Metrics</div>
                      <div className="text-xs text-muted-foreground">How do I measure product success?</div>
                    </div>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("💰 How big is my market opportunity?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">💰 Market Size</div>
                      <div className="text-xs text-muted-foreground">How big is my market opportunity?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("📈 What traction do investors want to see?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">📈 Investor Traction</div>
                      <div className="text-xs text-muted-foreground">What traction do investors want to see?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("🏆 What's my competitive advantage?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">🏆 Competitive Edge</div>
                      <div className="text-xs text-muted-foreground">What's my competitive advantage?</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSendMessage("💸 How much should I raise and when?")}
                    className="text-left justify-start h-auto p-3"
                  >
                    <div>
                      <div className="font-medium text-sm">💸 Fundraising Strategy</div>
                      <div className="text-xs text-muted-foreground">How much should I raise and when?</div>
                    </div>
                  </Button>
                </>
              )}
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