"use client"

import { Check, Circle, Trophy } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useEffect, useState } from "react"
import confetti from 'canvas-confetti'

interface RubricItem {
  id: string
  label: string
  completed: boolean
}

const SHARK_VC_RUBRIC: RubricItem[] = [
  { id: 'team', label: 'Team & Founders', completed: false },
  { id: 'market', label: 'Market Size (TAM)', completed: false },
  { id: 'problem', label: 'Problem/Solution Fit', completed: false },
  { id: 'traction', label: 'Traction & Metrics', completed: false },
  { id: 'economics', label: 'Unit Economics', completed: false },
  { id: 'competition', label: 'Competitive Advantage', completed: false },
  { id: 'model', label: 'Business Model', completed: false },
  { id: 'funding', label: 'Use of Funds', completed: false },
  { id: 'exit', label: 'Exit Strategy', completed: false },
  { id: 'risks', label: 'Risks & Mitigation', completed: false },
]

const PRODUCT_PM_RUBRIC: RubricItem[] = [
  { id: 'market', label: 'Market Clarity', completed: false },
  { id: 'persona', label: 'User Persona & JTBD', completed: false },
  { id: 'problem', label: 'Problem Statement', completed: false },
  { id: 'solution', label: 'Solution Uniqueness', completed: false },
  { id: 'roadmap', label: 'Roadmap & Prioritization', completed: false },
  { id: 'metrics', label: 'Success Metrics', completed: false },
  { id: 'mvp', label: 'MVP → MLP Journey', completed: false },
  { id: 'narrative', label: 'Product Narrative', completed: false },
  { id: 'experiments', label: 'Learning Velocity', completed: false },
]

interface ProgressIndicatorsProps {
  selectedAgent: string
  completedItems: string[]
  className?: string
}

export default function ProgressIndicators({ selectedAgent, completedItems, className }: ProgressIndicatorsProps) {
  const rubric = selectedAgent === 'Product Manager' ? PRODUCT_PM_RUBRIC : SHARK_VC_RUBRIC
  const completedCount = completedItems.length
  const totalCount = rubric.length
  const percentage = (completedCount / totalCount) * 100
  const [hasCompletedAll, setHasCompletedAll] = useState(false)

  useEffect(() => {
    if (percentage === 100 && !hasCompletedAll) {
      setHasCompletedAll(true)
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00ffff', '#ff00ff', '#ffff00']
      })
    }
  }, [percentage, hasCompletedAll])

  return (
    <div className={cn("bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-xl p-5 backdrop-blur-sm border border-border/50 card-hover", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold bg-gradient-to-r from-primary to-starknet-teal bg-clip-text text-transparent">
          Analysis Progress
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {completedCount}/{totalCount} completed
        </span>
      </div>
      
      {/* Progress bar with gradient fill */}
      <div className="w-full bg-secondary/70 rounded-full h-2.5 mb-5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-starknet-teal to-purple-600 transition-all duration-700 ease-out rounded-full"
          style={{ 
            width: `${percentage}%`,
            boxShadow: percentage > 0 ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none'
          }}
        />
      </div>

      {/* Rubric items with enhanced animations */}
      <div className="grid grid-cols-1 gap-2.5">
        {rubric.map((item, index) => {
          const isCompleted = completedItems.includes(item.id)
          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center gap-3 text-xs transition-all duration-300 p-2 rounded-lg",
                isCompleted 
                  ? "text-foreground bg-primary/10" 
                  : "text-muted-foreground hover:bg-secondary/30"
              )}
              style={{
                animationDelay: isCompleted ? `${index * 50}ms` : '0ms'
              }}
            >
              <div className="relative">
                {isCompleted ? (
                  <div className="animate-in zoom-in-50 duration-300">
                    <Check className="h-4 w-4 text-starknet-teal" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4 opacity-50" />
                )}
              </div>
              <span className={cn(
                "transition-all duration-300 flex-1",
                isCompleted && "font-medium"
              )}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Completion celebration with enhanced design */}
      {completedCount === totalCount && (
        <div className="mt-5 p-4 bg-gradient-to-r from-starknet-teal/20 to-starknet-purple/20 rounded-xl border border-starknet-teal/30 animate-pulse-glow">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-starknet-teal" />
            <p className="text-sm font-medium">
              🎉 Complete analysis achieved! Ready for the next level.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 