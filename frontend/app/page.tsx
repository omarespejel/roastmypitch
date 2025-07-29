"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'
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
import { signIn } from 'next-auth/react'
import { analyzeCompletedTopics } from '@/lib/topic-analyzer'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [selectedAgent, setSelectedAgent] = useState('Product PM')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [completedTopics, setCompletedTopics] = useState<string[]>([])
  const [showOnboarding, setShowOnboarding] = useState(true)
  
  // New state for Socket.io and feedback
  const socket = useRef<Socket | null>(null)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastFeedbackCount, setLastFeedbackCount] = useState(0)

  const founderId = session?.user?.email || "anonymous"
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    if (!session) return

    // Initialize Socket.io connection
    socket.current = io(apiUrl, {
      query: { founderId }
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
        setMessages(data.map(msg => ({ role: msg.role, content: msg.content })))
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
      if (data.userId !== session.user.id) {
        setIsOtherUserTyping(data.userId)
        setTimeout(() => setIsOtherUserTyping(null), 3000)
      }
    })

    return () => {
      supabase.removeChannel(channel)
      socket.current?.disconnect()
    }
  }, [founderId, selectedAgent, session, apiUrl])

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
    const rubric = selectedAgent === 'Product PM' 
      ? ['user personas', 'market opportunity', 'product roadmap', 'success metrics', 'competitive landscape']
      : ['your founding team', 'market size (TAM)', 'unit economics', 'competitive advantage', 'use of funds']
    
    const allTopics = selectedAgent === 'Product PM'
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
      
      const data = await response.json() as { filename: string }
      toast({
        title: "Success",
        description: `${data.filename} uploaded successfully!`,
        variant: "success" as any,
      })
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: selectedAgent === 'Product PM'
          ? `I've received your document: ${data.filename}. Let me analyze it through a product lens. What specific product questions should I focus on?`
          : `I've received your pitch deck: ${data.filename}. Let me review it like a VC would. What specific aspects would you like me to focus on?`
      }])
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center animate-fade-up">
            <div className="mb-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 w-fit mx-auto mb-4">
                <Github className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Starknet Founders Bot</h2>
              <p className="text-muted-foreground">
                Sign in with GitHub to get brutally honest feedback on your startup pitch
              </p>
            </div>
            <Button 
              onClick={() => signIn("github")} 
              variant="gradient" 
              size="lg"
              className="w-full gap-2"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>
          </Card>
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
        <AgentSelector 
          selectedAgent={selectedAgent} 
          onSelect={handleAgentSelect}  // Use the new handler
        />
        
        {/* Desktop layout with progress sidebar */}
        <div className="flex-1 flex gap-4 mx-4 mb-4">
          {/* Chat area */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface 
              messages={messages} 
              isLoading={isLoading}
              selectedAgent={selectedAgent}  // Add this prop
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
              
              <SmartSuggestions
                founderId={founderId}
                selectedAgent={selectedAgent}
                onActionClick={(action) => sendMessage(action)}
              />
              
              <AdaptiveQuestions
                missingSections={completedTopics.length < 5 ? ['team', 'market', 'traction'] : []}
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