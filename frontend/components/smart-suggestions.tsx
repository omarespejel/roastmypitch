"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { AlertCircle, HelpCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface AnalysisResult {
  missing_sections: string[]
  suggested_actions: Array<{
    section: string
    action: string
    priority: 'high' | 'medium' | 'low'
  }>
  help_tooltips: Record<string, string>
  next_steps: string[]
}

interface SmartSuggestionsProps {
  founderId: string
  selectedAgent: string
  onActionClick: (action: string) => void
}

export default function SmartSuggestions({ founderId, selectedAgent, onActionClick }: SmartSuggestionsProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${apiUrl}/analyze/${founderId}?agent_type=${selectedAgent}`)
        if (response.ok) {
          const data = await response.json()
          setAnalysis(data)
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (founderId && founderId !== "anonymous") {
      fetchAnalysis()
    }
  }, [founderId, selectedAgent, apiUrl])

  if (isLoading) {
    return (
      <Card className="mb-4 card-hover bg-gradient-to-br from-background to-secondary/20 border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-secondary rounded w-1/2"></div>
            <div className="h-4 bg-secondary rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis || analysis.suggested_actions.length === 0) return null

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedActions = analysis.suggested_actions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  return (
    <Card className="mb-4 card-hover bg-gradient-to-br from-background to-secondary/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis.next_steps.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Priority Actions
            </h4>
            <div className="space-y-2">
              {analysis.next_steps.map((step, index) => (
                <div key={index} className="text-sm text-blue-700 dark:text-blue-300">
                  {index + 1}. {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedActions.slice(0, 3).map((action, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border-l-4 cursor-pointer hover:bg-secondary/50 transition-colors",
              action.priority === 'high' && "border-red-500 bg-red-50/50 dark:bg-red-950/30",
              action.priority === 'medium' && "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
              action.priority === 'low' && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
            )}
            onClick={() => onActionClick(action.action)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    action.priority === 'high' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                    action.priority === 'medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                    action.priority === 'low' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  )}>
                    {action.priority} priority
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {action.section}
                  </span>
                </div>
                <p className="text-sm">{action.action}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
            </div>
          </div>
        ))}

        {analysis.help_tooltips && Object.keys(analysis.help_tooltips).length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Why These Sections Matter
            </summary>
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              {Object.entries(analysis.help_tooltips).slice(0, 3).map(([section, help]) => (
                <div key={section} className="p-2 bg-secondary/30 rounded">
                  <strong className="capitalize">{section}:</strong> {help}
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
} 