"use client"

import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { X, FileText, MessageSquare, CheckCircle, AlertCircle, Zap } from "lucide-react"
import { useState } from "react"

interface OnboardingGuideProps {
  onClose: () => void
}

export default function OnboardingGuide({ onClose }: OnboardingGuideProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button 
          onClick={() => setIsMinimized(false)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Show Guide
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl p-4 z-40">
      <Card className="relative border-primary/20 shadow-lg animate-fade-up">
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            onClick={() => setIsMinimized(true)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <span className="text-xs">−</span>
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Welcome to Starknet Founders Bot</h3>
            <Badge 
              variant="secondary" 
              className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-800 border-orange-300"
            >
              ALPHA
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* Alpha Version Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Alpha Version - We Need Your Feedback!
              </h4>
              <p className="text-sm text-muted-foreground">
                You're using an early version of this AI advisor. Every conversation helps us improve. 
                Please share your experience, bugs, or suggestions with <span className="font-medium text-orange-700">@espejelomar</span> on Telegram.
              </p>
            </div>

            <div className="bg-primary/5 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <span className="text-lg">👋</span> Getting Started
              </h4>
              <p className="text-sm text-muted-foreground">
                This tool helps Starknet ecosystem founders refine their ideas through structured feedback.
                We've carefully curated two advisor personalities to guide you through product development and fundraising.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">How to Use:</h4>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-sm">Start by Describing Your Idea</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    No documents needed! Just describe your product idea, target users, or business concept. 
                    Ask questions like: "Help me define my user persona" or "What's wrong with my problem statement?" 
                    <span className="text-primary">Upload a Product Requirements Document for deeper analysis (completely optional).</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-sm">Then Face the VCs</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Discuss your startup strategy or upload your pitch deck for detailed feedback. 
                    Our VC advisor (based on top partners from Sequoia, a16z, YC) will stress-test your assumptions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pro Tip: Documents Optional
              </h4>
              <p className="text-xs text-muted-foreground">
                You can start chatting immediately! Upload documents (PRD or pitch deck) 
                for more detailed analysis and gap identification.
              </p>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t space-y-1">
              <p>A Starknet Foundation program to support ecosystem startups</p>
              <p className="font-medium text-orange-700">
                🚧 Alpha Version: Help us improve by sharing your feedback!
              </p>
              <p>Issues or feedback? Contact <span className="text-primary font-medium">@espejelomar</span> on Telegram</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 