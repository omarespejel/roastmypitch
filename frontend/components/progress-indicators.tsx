"use client"

import { Check, Circle } from "lucide-react"
import { cn } from "@/app/lib/utils"

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
  const rubric = selectedAgent === 'Product PM' ? PRODUCT_PM_RUBRIC : SHARK_VC_RUBRIC
  const completedCount = completedItems.length
  const totalCount = rubric.length
  const percentage = (completedCount / totalCount) * 100

  return (
    <div className={cn("bg-secondary/50 rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Analysis Progress</h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} completed
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Rubric items */}
      <div className="grid grid-cols-1 gap-2">
        {rubric.map((item) => {
          const isCompleted = completedItems.includes(item.id)
          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center gap-2 text-xs transition-all duration-200",
                isCompleted ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                {isCompleted ? (
                  <div className="animate-in zoom-in-50 duration-200">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span className={cn(
                "transition-all duration-200",
                isCompleted && "font-medium"
              )}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Completion celebration */}
      {completedCount === totalCount && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg border border-primary/20">
          <p className="text-xs text-center font-medium">
            🎉 Complete analysis achieved! Ready for the next round.
          </p>
        </div>
      )}
    </div>
  )
} 