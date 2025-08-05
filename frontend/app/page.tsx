"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { io, Socket } from 'socket.io-client'
import confetti from 'canvas-confetti'
import { supabase, type ChatMessage } from '@/lib/supabase'
import posthog from 'posthog-js'
import Header from '@/components/header'
import AgentSelector from '@/components/agent-selector'
import ChatInterface from '@/components/chat-interface'
import MessageInput from '@/components/message-input'
import OnboardingGuide from '@/components/onboarding-guide'
import SuggestedQuestions from '@/components/suggested-questions'
import { Card } from '@/app/components/ui/card'
import { useToast } from '@/app/hooks/use-toast'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Github, AlertTriangle, MessageCircle } from 'lucide-react'
import MagicLinkAuth from '@/components/magic-link-auth'


interface Message {
  role: 'user' | 'assistant'
  content: string
  agent?: string // Track which agent sent the message
}

// Enhanced analysis message formatting with agent-specific insights
const formatAnalysisMessage = (analysis: any, agent: string): string => {
  const missing = analysis.missing_sections || []
  const suggestions = analysis.suggested_actions || []
  const nextSteps = analysis.next_steps || []
  
  if (agent === 'Product Manager') {
    let message = `**Product Analysis Complete! 🎯**\n\n`
    
    if (missing.length > 0) {
      message += `**Areas needing attention:**\n`
      missing.forEach((section: string) => {
        message += `• **${section.charAt(0).toUpperCase() + section.slice(1)}** - Critical for product-market fit\n`
      })
      message += `\n`
    }
    
    if (nextSteps.length > 0) {
      message += `**Immediate next steps to strengthen your product:**\n`
      nextSteps.forEach((step: string, i: number) => {
        message += `${i + 1}. ${step}\n`
      })
      message += `\n`
    }
    
    message += `**Product Strategy Insight:** Your pitch shows ${missing.length === 0 ? 'strong product fundamentals' : 'opportunities to clarify your value proposition'}. Focus on the Jobs-to-be-Done framework - what specific problem are you solving that users will pay for?\n\n`
    message += `💡 **Ready to dive deeper?** Click on the suggested questions or ask me about user research, feature prioritization, or go-to-market strategy.`
    
    return message
  } else {
    // Shark VC approach
    let message = `**Investment Analysis Complete! 🦈**\n\n`
    
    if (missing.length > 0) {
      message += `**Red flags for investors:**\n`
      missing.forEach((section: string) => {
        message += `• **Missing ${section}** - VCs need to see this for funding decisions\n`
      })
      message += `\n`
    }
    
    if (nextSteps.length > 0) {
      message += `**Fix these before your next investor meeting:**\n`
      nextSteps.forEach((step: string, i: number) => {
        message += `${i + 1}. ${step}\n`
      })
      message += `\n`
    }
    
    message += `**Investment Reality Check:** ${missing.length === 0 ? 'Your pitch covers the basics, but' : 'You have gaps that will hurt your chances. Fix these and'} focus on proving massive market opportunity and unfair advantage.\n\n`
    message += `🔥 **Want the tough questions?** Use the suggested prompts or ask about market size, traction metrics, or competition.`
    
    return message
  }
}

export default function Home() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState('Product Manager')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [analysisData, setAnalysisData] = useState<any>(null)
  // New state for Socket.io
  const socket = useRef<Socket | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<string | null>(null)

  const founderId = user?.email || "anonymous"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Reset conversation function (resets all agents)
  const resetConversation = async () => {
    try {
      // Reset all agents by not specifying agent_type
      const response = await fetch(`${apiUrl}/reset/${founderId}`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setMessages([])
        setShowOnboarding(true)
        toast({
          title: "🔄 New conversation started",
          description: "Chat memory has been reset for all agents. Start fresh!",
          variant: "success" as any,
        })
      }
    } catch (error) {
      console.error('Error resetting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to reset conversation. Please try again.",
        variant: "destructive",
      })
    }
  }



  // Connection monitoring
  useEffect(() => {
    const checkConnection = () => {
      fetch(`${apiUrl}/`, { method: 'HEAD' })
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false))
    }
    
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [apiUrl])



  // Enhanced useEffect for Supabase and Socket.io integration
  useEffect(() => {
    if (!user) return

    // Initialize Socket.io connection with enhanced configuration
    socket.current = io(apiUrl, {
      query: { founderId },
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      forceNew: true
    })

    // Load messages from Supabase (all agents for unified conversation)
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('founder_id', founderId)
        .order('created_at', { ascending: true })

      if (data && !error) {
        const loadedMessages = data.map(msg => ({ 
          role: msg.role, 
          content: msg.content, 
          agent: msg.agent_type 
        }))
        setMessages(loadedMessages)
        
        // Check if this is a returning user with previous messages
        if (loadedMessages.length > 0 && !loadedMessages.some(msg => msg.content.includes('Welcome back'))) {
          // Send a welcome back message
          sendWelcomeBackMessage(loadedMessages.length)
        }
      }
    }

    // Send welcome back message for returning users
    const sendWelcomeBackMessage = async (messageCount: number) => {
      try {
        const welcomeMessage = `Welcome back! 👋 I see we've had ${messageCount} previous message${messageCount > 1 ? 's' : ''} together. 

Would you like to:
• Continue our previous discussion about your startup
• Start a fresh conversation (click "New Chat" in the header)
• Ask me something new

What would you like to focus on today?`

        const response = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            founder_id: founderId, 
            message: `SYSTEM: Returning user with ${messageCount} previous messages`,
            agent_type: selectedAgent,
            is_welcome_back: true
          }),
        })

        if (response.ok) {
          const data = await response.json() as { reply: string }
          
          // Add welcome back message to UI
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, agent: selectedAgent }])
          
          // Store in Supabase
          await supabase.from('chat_messages').insert({
            founder_id: founderId,
            agent_type: selectedAgent,
            role: 'assistant',
            content: data.reply
          })
        }
      } catch (error) {
        console.error('Error sending welcome back message:', error)
      }
    }

    loadMessages()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`chat:${founderId}:${selectedAgent}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `founder_id=eq.${founderId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          if (newMessage.agent_type === selectedAgent) {
            setMessages(prev => [...prev, { 
              role: newMessage.role, 
              content: newMessage.content 
            }])
          }
        }
      )
      .subscribe()

    // Socket.io event handlers
    socket.current.on('user_typing', (data: { userId: string }) => {
      if (data.userId !== user.id) {
        setIsOtherUserTyping(data.userId)
        setTimeout(() => setIsOtherUserTyping(null), 3000)
      }
    })

    // 🎉 Real-time analysis completion handler
    socket.current.on('analysis_ready', (data: { 
      founder_id: string
      analysis: any
      filename: string 
         }) => {
       if (data.founder_id === founderId) {
         // 🎊 Real-time confetti celebration!
         confetti({
           particleCount: 150,
           spread: 90,
           origin: { y: 0.6 }
         })
         
         // Show celebration toast for real-time update
         toast({
           title: "🚀 Analysis Complete!",
           description: `Your document "${data.filename}" has been fully analyzed!`,
           variant: "success" as any,
         })
        
        // Update analysis results for current agent
        const currentAnalysis = data.analysis[selectedAgent as 'Product Manager' | 'Shark VC']
        if (currentAnalysis) {
          const analysisMessage = formatAnalysisMessage(currentAnalysis, selectedAgent)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: analysisMessage
          }])
          

        }
      }
    })

    return () => {
      supabase.removeChannel(channel)
      socket.current?.disconnect()
    }
  }, [founderId, selectedAgent, user, apiUrl])



  const handleAgentSelect = (agent: string) => {
    // Simply switch agents without clearing messages for unified conversation
    setSelectedAgent(agent)
    
    // Show a toast to indicate the agent switch
    if (agent !== selectedAgent) {
      toast({
        title: `🔄 Switched to ${agent}`,
        description: "Continuing the same conversation with a different perspective",
        variant: "default",
      })
    }
  }



  const sendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message, agent: selectedAgent }])
    setIsLoading(true)
    
    try {
      // Store user message in Supabase
      await supabase.from('chat_messages').insert({
        founder_id: founderId,
        agent_type: selectedAgent,
        role: 'user',
        content: message
      })

      // Send to backend
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          founder_id: founderId, 
          message,
          agent_type: selectedAgent
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      const data = await response.json() as { reply: string }
      
      // Store assistant response in Supabase
      await supabase.from('chat_messages').insert({
        founder_id: founderId,
        agent_type: selectedAgent,
        role: 'assistant',
        content: data.reply
      })

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      

      
      // Emit typing indicator via Socket.io
      socket.current?.emit('stop_typing', { founderId })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    // Set uploading state and show immediate feedback
    setIsUploading(true)
    
    // Show immediate upload started feedback
    toast({
      title: "📄 Uploading Document...",
      description: `Processing ${file.name} - this may take a moment`,
      variant: "default",
    })
    
    try {
      const response = await fetch(`${apiUrl}/upload/${founderId}`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      // Show processing feedback while waiting for response
      toast({
        title: "🔄 Analyzing Document...",
        description: "Our AI is reviewing your document and generating insights",
        variant: "default",
      })
      
      const data = await response.json() as { 
        filename: string
        analysis?: {
          'Product Manager'?: any
          'Shark VC'?: any
        }
      }
      
      // Optional: Set flag that document has been uploaded
      setHasUploadedDocument(true)
      
      // Show enhanced analysis toast
      if (data.analysis) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        
        toast({
          title: "🎉 Document Analyzed!",
          description: "Enhanced analysis available! Check the suggestions panel.",
          variant: "success" as any,
        })
        
        // Auto-display analysis results for current agent
        const currentAnalysis = data.analysis[selectedAgent as 'Product Manager' | 'Shark VC']
        if (currentAnalysis) {
          const analysisMessage = formatAnalysisMessage(currentAnalysis, selectedAgent)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: analysisMessage
          }])
        }
      } else {
        toast({
          title: "✅ Document Uploaded Successfully",
          description: `${data.filename} is ready! I can now provide more detailed analysis.`,
          variant: "success" as any,
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "❌ Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Always reset uploading state
      setIsUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <MagicLinkAuth />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onResetConversation={resetConversation} />
      
      {/* Alpha Version Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200 dark:from-orange-950/20 dark:to-yellow-950/20 dark:border-orange-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-orange-800 dark:text-orange-200">
              <span className="font-semibold">Alpha Version:</span> This bot is actively being improved. 
              Your feedback helps us build better features!
            </span>
            <div className="flex items-center gap-1 text-orange-600">
              <MessageCircle className="h-3 w-3" />
              <span className="text-xs">Share feedback with @espejelomar</span>
            </div>
          </div>
        </div>
      </div>
      
      {showOnboarding && messages.length === 0 && (
        <OnboardingGuide onClose={() => setShowOnboarding(false)} />
      )}
      
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mx-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-yellow-700 border-t-transparent rounded-full" />
              Connection lost. Reconnecting...
            </div>
          </div>
        )}



        <AgentSelector 
          selectedAgent={selectedAgent} 
          onSelect={handleAgentSelect}  // Use the new handler
        />
        
        {/* Contextual help explaining agent differences */}
        <div className="text-center text-xs text-muted-foreground mb-4 px-4">
          💡 <strong>Product Manager:</strong> For product strategy, user research, roadmaps
          • <strong>Shark VC:</strong> For investor feedback, business model, fundraising
        </div>
        
        {/* Desktop layout with progress sidebar */}
        <div className="flex-1 flex gap-4 mx-4 mb-4">
          {/* Chat area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface 
              messages={messages} 
              isLoading={isLoading}
              selectedAgent={selectedAgent}
              onSendMessage={sendMessage}
            />
          </Card>
          

        </div>
        

      </main>
      
      <MessageInput
        onSendMessage={sendMessage}
                  onUploadFile={uploadFile}
          isLoading={isLoading || isUploading}
          selectedAgent={selectedAgent}
        />
        
        {/* Suggested Questions Panel */}
        {user && (
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
            <SuggestedQuestions
              selectedAgent={selectedAgent}
              analysisData={analysisData}
              hasUploadedDocument={hasUploadedDocument}
              onQuestionClick={sendMessage}
              isVisible={!showOnboarding}
            />
          </div>
        )}
    </div>
  )
} 