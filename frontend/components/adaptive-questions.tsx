"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { MessageCircle, Send, ChevronRight, AlertTriangle } from 'lucide-react'

interface AdaptiveQuestion {
  section: string
  question: string
  alternatives: string[]
  priority: number
}

interface AdaptiveQuestionsProps {
  missingSections: string[]
  selectedAgent: string
  founderContext: string
  onQuestionSelect: (question: string) => void
}

export default function AdaptiveQuestions({ 
  missingSections, 
  selectedAgent, 
  founderContext, 
  onQuestionSelect 
}: AdaptiveQuestionsProps) {
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // Debouncing and request deduplication
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastRequestPayloadRef = useRef<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      if (missingSections.length === 0) return

      // Create request payload for comparison
      const requestPayload = JSON.stringify({
        missing_sections: missingSections,
        agent_type: selectedAgent,
        founder_context: founderContext,
        document_content: ""
      })

      // Skip if this is the same request as last time (deduplication)
      if (requestPayload === lastRequestPayloadRef.current) {
        return
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Debounce the API call
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true)
        setError(null)
        setRateLimited(false)

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController()
        
        try {
          const response = await fetch(`${apiUrl}/adaptive-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestPayload,
            signal: abortControllerRef.current.signal
          })

          if (response.status === 429) {
            setRateLimited(true)
            setError('You\'re making requests too quickly. Please wait a few seconds and try again.')
            return
          }

          if (response.ok) {
            const data = await response.json()
            setQuestions(data.questions || [])
            lastRequestPayloadRef.current = requestPayload // Remember this successful request
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // Request was cancelled, this is normal
            return
          }
          console.error('Failed to fetch adaptive questions:', error)
          setError('Failed to load questions. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }, 500) // 500ms debounce delay
    }

    fetchQuestions()

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [missingSections, selectedAgent, founderContext, apiUrl])

  // Auto-retry after rate limit cooldown
  useEffect(() => {
    if (rateLimited) {
      const retryTimer = setTimeout(() => {
        setRateLimited(false)
        setError(null)
        // Trigger a refetch by clearing the last payload
        lastRequestPayloadRef.current = ''
      }, 30000) // Retry after 30 seconds

      return () => clearTimeout(retryTimer)
    }
  }, [rateLimited])

  // Show error state
  if (error) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {rateLimited ? 'Rate Limited' : 'Error Loading Questions'}
            </span>
          </div>
          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{error}</p>
          {rateLimited && (
            <p className="text-xs text-orange-500 dark:text-orange-500 mt-2">
              Retrying automatically in a few seconds...
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading || questions.length === 0) return null

  const getSectionColor = (section: string) => {
    if (section.includes('team') || section.includes('traction')) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    if (section.includes('market') || section.includes('economics')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  }

  return (
    <Card className="mb-4 card-hover bg-gradient-to-br from-background to-secondary/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageCircle className="h-4 w-4 text-primary" />
          Key Questions to Address
          <Badge variant="secondary" className="ml-auto">
            {questions.length} priority questions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.map((question, index) => (
          <div key={index} className="border rounded-lg p-3 hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getSectionColor(question.section)}`}
              >
                Priority {question.priority}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className={`h-3 w-3 transition-transform ${
                  expandedQuestion === index ? 'rotate-90' : ''
                }`} />
              </Button>
            </div>
            
            <p className="text-sm mb-3 leading-relaxed">{question.question}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground capitalize">
                {question.section.replace(/_/g, ' ')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuestionSelect(question.question)}
                className="gap-1 h-7 text-xs"
              >
                <Send className="h-3 w-3" />
                Ask This
              </Button>
            </div>
            
            {expandedQuestion === index && question.alternatives.length > 0 && (
              <div className="mt-3 pt-3 border-t border-secondary">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Alternative questions:
                </p>
                <div className="space-y-2">
                  {question.alternatives.map((alt, altIndex) => (
                    <div key={altIndex} className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground flex-1">{alt}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuestionSelect(alt)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 These questions are generated based on gaps identified in your pitch. 
            Addressing them will strengthen your {selectedAgent === 'Shark VC' ? 'investor presentation' : 'product strategy'}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 