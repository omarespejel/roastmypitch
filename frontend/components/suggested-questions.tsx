"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { MessageSquare, Lightbulb, Target, Users, TrendingUp, DollarSign } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface SuggestedQuestionsProps {
  selectedAgent: string
  analysisData?: any
  hasUploadedDocument: boolean
  onQuestionClick: (question: string) => void
  isVisible: boolean
}

export default function SuggestedQuestions({ 
  selectedAgent, 
  analysisData, 
  hasUploadedDocument, 
  onQuestionClick,
  isVisible 
}: SuggestedQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])

  // Generate Lenny Rachitsky-style questions based on agent and analysis
  useEffect(() => {
    const generateQuestions = () => {
      if (selectedAgent === 'Product Manager') {
        const pmQuestions = [
          "What job is the user hiring my product to do? (Jobs-to-be-Done)",
          "Who exactly is my ideal customer? Get granular.",
          "How do people solve this problem today? What's broken?",
          "What's the smallest version that proves people want this?",
          "How will I know if people actually need this product?",
          "What's my wedge into the market? First 100 users strategy?",
        ]

        // Add analysis-specific questions if document uploaded
        if (hasUploadedDocument && analysisData) {
          const missing = analysisData[selectedAgent]?.missing_sections || []
          if (missing.includes('user_research')) {
            pmQuestions.unshift("Show me user interview insights - who did you talk to?")
          }
          if (missing.includes('metrics')) {
            pmQuestions.unshift("What are your key product metrics? Retention? Engagement?")
          }
          if (missing.includes('competition')) {
            pmQuestions.unshift("Who are your competitors and what makes you different?")
          }
        }

        return pmQuestions.slice(0, 6)
      } else {
        // Shark VC questions
        const vcQuestions = [
          "How big is this market? Show me TAM/SAM numbers.",
          "Is this a painkiller or vitamin? How urgent is the problem?",
          "Why now? What's changed that makes this possible today?",
          "What's your unfair advantage? Network effects? Data moat?",
          "How will you get your first 100 customers without spending money?",
          "What's the biggest risk to this business? How do you mitigate it?",
        ]

        // Add analysis-specific questions if document uploaded
        if (hasUploadedDocument && analysisData) {
          const missing = analysisData[selectedAgent]?.missing_sections || []
          if (missing.includes('traction')) {
            vcQuestions.unshift("Show me your traction - revenue, users, growth metrics")
          }
          if (missing.includes('market')) {
            vcQuestions.unshift("Prove the market size - is this a billion-dollar opportunity?")
          }
          if (missing.includes('team')) {
            vcQuestions.unshift("Why is your team uniquely qualified to solve this problem?")
          }
        }

        return vcQuestions.slice(0, 6)
      }
    }

    setQuestions(generateQuestions())
  }, [selectedAgent, analysisData, hasUploadedDocument])

  const getIcon = () => {
    if (selectedAgent === 'Product Manager') {
      return <Lightbulb className="h-4 w-4" />
    }
    return <TrendingUp className="h-4 w-4" />
  }

  const getIconForQuestion = (index: number) => {
    const icons = [Target, Users, MessageSquare, DollarSign, TrendingUp, Lightbulb]
    const IconComponent = icons[index % icons.length] as React.ComponentType<{ className?: string }>
    return <IconComponent className="h-3 w-3" />
  }

  if (!isVisible) return null

  return (
    <Card className="w-80 border-border/50 bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getIcon()}
          {selectedAgent === 'Product Manager' ? 'Product Questions' : 'VC Questions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className={cn(
              "w-full justify-start text-left h-auto p-3 whitespace-normal",
              "hover:bg-primary/5 hover:text-primary transition-colors",
              selectedAgent === 'Product Manager' ? "text-blue-700 dark:text-blue-300" : "text-red-700 dark:text-red-300"
            )}
          >
            <div className="flex items-start gap-2 w-full">
              <div className="mt-1">
                {getIconForQuestion(index)}
              </div>
              <span className="text-xs leading-relaxed">
                {question}
              </span>
            </div>
          </Button>
        ))}
        
        {hasUploadedDocument && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              💡 Questions tailored to your uploaded pitch deck
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}