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
import ProgressIndicators from '@/components/progress-indicators'
import OnboardingGuide from '@/components/onboarding-guide'
import SmartSuggestions from '@/components/smart-suggestions'
import AdaptiveQuestions from '@/components/adaptive-questions'
import FeedbackModal from '@/components/feedback-modal'
import { Card } from '@/app/components/ui/card'
import { useToast } from '@/app/hooks/use-toast'
import { Button } from '@/app/components/ui/button'
import { Github } from 'lucide-react'
import MagicLinkAuth from '@/components/magic-link-auth'
import { analyzeCompletedTopics } from '@/lib/topic-analyzer'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Helper function to format analysis results into a readable message
const formatAnalysisMessage = (analysis: any, agent: string): string => {
  const sections = []
  
  if (analysis.missing_sections && analysis.missing_sections.length > 0) {
    sections.push(`**Missing Sections Identified:**\n${analysis.missing_sections.map((section: string) => `• ${section}`).join('\n')}`)
  }
  
  if (analysis.smart_suggestions && analysis.smart_suggestions.length > 0) {
    sections.push(`**Smart Suggestions:**\n${analysis.smart_suggestions.map((suggestion: any) => `• ${suggestion.title || suggestion}`).join('\n')}`)
  }
  
  if (analysis.score) {
    sections.push(`**Overall Score:** ${analysis.score}/100`)
  }
  
  const intro = agent === 'Product Manager' 
    ? "I've analyzed your document from a product perspective. Here's what I found:"
    : "I've reviewed your pitch deck like a VC would. Here are my insights:"
  
  return sections.length > 0 
    ? `${intro}\n\n${sections.join('\n\n')}\n\nWhat would you like to explore further?`
    : `${intro}\n\nYour document looks comprehensive! What specific aspects would you like to discuss?`
}

export default function Home() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState('Product Manager')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [completedTopics, setCompletedTopics] = useState<string[]>([])
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [actionFeedback, setActionFeedback] = useState('')
  
  // New state for Socket.io and feedback
  const socket = useRef<Socket | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastFeedbackCount, setLastFeedbackCount] = useState(0)

  const founderId = user?.email || "anonymous"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Helper function to show success feedback
  const showSuccessFeedback = (message: string) => {
    setActionFeedback(message)
    setTimeout(() => setActionFeedback(''), 3000)
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

  // Memoize missingSections to prevent unnecessary API calls
  const missingSections = useMemo(() => {
    return completedTopics.length < 5 ? ['team', 'market', 'traction'] : []
  }, [completedTopics.length]) // Only recalculate when the length changes

  // Analyze messages for completed topics with toast notifications
  useEffect(() => {
    if (messages.length > 0) {
      const newTopics = analyzeCompletedTopics(messages, selectedAgent)
      
      // Check if any new topics were completed
      const newlyCompleted = newTopics.filter(topic => !completedTopics.includes(topic))
      
      if (newlyCompleted.length > 0 && completedTopics.length > 0) {
        // Show a toast for newly completed topics
        const topicLabels: { [key: string]: string } = {
          team: 'Team & Founders',
          market: 'Market Analysis',
          problem: 'Problem/Solution Fit',
          traction: 'Traction Metrics',
          economics: 'Unit Economics',
          competition: 'Competitive Analysis',
          model: 'Business Model',
          funding: 'Use of Funds',
          exit: 'Exit Strategy',
          risks: 'Risk Assessment',
          persona: 'User Persona',
          solution: 'Solution Design',
          roadmap: 'Product Roadmap',
          metrics: 'Success Metrics',
          mvp: 'MVP Strategy',
          narrative: 'Product Story',
          experiments: 'Learning Velocity'
        }
        
        newlyCompleted.forEach(topic => {
          toast({
            title: "✅ Topic Analyzed",
            description: `${topicLabels[topic] || topic} has been covered!`,
            duration: 3000,
          })
        })
      }
      
      setCompletedTopics(newTopics)
    }
  }, [messages, selectedAgent, completedTopics, toast])

  // Enhanced useEffect for Supabase and Socket.io integration
  useEffect(() => {
    if (!user) return

    // Initialize Socket.io connection with enhanced configuration
    socket.current = io(apiUrl, {
      query: { founderId },
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      forceNew: true
    })

    // Load messages from Supabase
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('founder_id', founderId)
        .eq('agent_type', selectedAgent)
        .order('created_at', { ascending: true })

      if (data && !error) {
        setMessages(data.map((msg: ChatMessage) => ({ role: msg.role, content: msg.content })))
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
        (payload: any) => {
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
          
          // Auto-expand analysis sections
          if (currentAnalysis.missing_sections) {
            setCompletedTopics(prev => [...prev, ...currentAnalysis.missing_sections.slice(0, 3)])
          }
        }
      }
    })

    return () => {
      supabase.removeChannel(channel)
      socket.current?.disconnect()
    }
  }, [founderId, selectedAgent, user, apiUrl])

  // Feedback tracking useEffect
  useEffect(() => {
    const assistantMessageCount = messages.filter(m => m.role === 'assistant').length
    
    // Show feedback every 3 assistant messages
    if (assistantMessageCount > 0 && 
        assistantMessageCount % 3 === 0 && 
        assistantMessageCount !== lastFeedbackCount) {
      setShowFeedback(true)
      setLastFeedbackCount(assistantMessageCount)
    }
  }, [messages, lastFeedbackCount])

  const handleAgentSelect = (agent: string) => {
    if (agent !== selectedAgent && messages.length > 0) {
      // Optionally clear messages when switching agents
      const shouldSwitch = confirm('Switching agents will start a new conversation. Continue?')
      if (shouldSwitch) {
        setMessages([])
        setCompletedTopics([]) // Reset progress
        setSelectedAgent(agent)
      }
    } else {
      setSelectedAgent(agent)
    }
  }

  // Get next suggested topic
  const getNextSuggestedTopic = () => {
    const rubric = selectedAgent === 'Product Manager' 
      ? ['user personas', 'market opportunity', 'product roadmap', 'success metrics', 'competitive landscape']
      : ['your founding team', 'market size (TAM)', 'unit economics', 'competitive advantage', 'use of funds']
    
    const allTopics = selectedAgent === 'Product Manager'
      ? ['persona', 'market', 'roadmap', 'metrics', 'competition']
      : ['team', 'market', 'economics', 'competition', 'funding']
    
    // Find first uncovered topic
    const uncoveredIndex = allTopics.findIndex(topic => !completedTopics.includes(topic))
    
    return uncoveredIndex >= 0 ? rubric[uncoveredIndex] : undefined
  }

  const sendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }])
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
      
      // Show success feedback
      showSuccessFeedback('Message sent successfully!')
      
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
    
    try {
      const response = await fetch(`${apiUrl}/upload/${founderId}`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
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
          title: "Document Uploaded",
          description: `${data.filename} uploaded successfully! I can now provide more detailed analysis.`,
          variant: "success" as any,
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
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
      <Header />
      
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

        {/* Success Feedback */}
        {actionFeedback && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm mx-4 mb-4 animate-slide-up">
            ✅ {actionFeedback}
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
          
          {/* Progress sidebar - visible on desktop */}
          {messages.length > 0 && (
            <div className="hidden lg:block w-80 space-y-4">
              <ProgressIndicators 
                selectedAgent={selectedAgent}
                completedItems={completedTopics}
                className="sticky top-4"
              />
              
              {/* Show smart suggestions based on conversation, not just document upload */}
              {messages.length > 2 && (
                <SmartSuggestions
                  founderId={founderId}
                  selectedAgent={selectedAgent}
                  onActionClick={(action) => sendMessage(action)}
                />
              )}
              
              <AdaptiveQuestions
                missingSections={missingSections}
                selectedAgent={selectedAgent}
                founderContext="starknet founder"
                onQuestionSelect={(question) => sendMessage(question)}
              />
            </div>
          )}
        </div>
        
        {/* Mobile progress - shows as collapsible */}
        {messages.length > 0 && (
          <div className="lg:hidden mx-4 mb-4">
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm font-medium">Analysis Progress</span>
                  <span className="text-xs text-muted-foreground">
                    {completedTopics.length}/10 • Tap to expand
                  </span>
                </div>
              </summary>
              <div className="mt-2">
                <ProgressIndicators 
                  selectedAgent={selectedAgent}
                  completedItems={completedTopics}
                />
              </div>
            </details>
          </div>
        )}
      </main>
      
      <MessageInput
        onSendMessage={sendMessage}
        onUploadFile={uploadFile}
        isLoading={isLoading}
        suggestedTopic={messages.length > 2 ? getNextSuggestedTopic() : undefined}
        selectedAgent={selectedAgent}
      />
      
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={async (feedback, rating) => {
          try {
            await supabase.from('feedback').insert({
              founder_id: founderId,
              content: feedback,
              rating: rating,
              agent_type: selectedAgent
            })
            
            // Track with PostHog if initialized
            if (typeof window !== 'undefined' && (window as any).posthog) {
              posthog.capture('feedback_submitted', {
                rating,
                has_comment: feedback.length > 0,
                agent_type: selectedAgent
              })
            }
            
            toast({
              title: "Thanks for your feedback!",
              description: "Your input helps us improve.",
              variant: "success" as any,
            })
          } catch (error) {
            console.error('Error submitting feedback:', error)
          }
        }}
      />
    </div>
  )
} 