"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { MessageCircle, Send, ChevronRight } from 'lucide-react'

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchQuestions = async () => {
      if (missingSections.length === 0) return

      setIsLoading(true)
      try {
        const response = await fetch(`${apiUrl}/adaptive-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missing_sections: missingSections,
            agent_type: selectedAgent,
            founder_context: founderContext,
            document_content: "" // Could be enhanced with actual document content
          })
        })

        if (response.ok) {
          const data = await response.json()
          setQuestions(data.questions || [])
        }
      } catch (error) {
        console.error('Failed to fetch adaptive questions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [missingSections, selectedAgent, founderContext, apiUrl])

  if (isLoading || questions.length === 0) return null

  const getSectionColor = (section: string) => {
    if (section.includes('team') || section.includes('traction')) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    if (section.includes('market') || section.includes('economics')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  }

  return (
    <Card className="mb-4">
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