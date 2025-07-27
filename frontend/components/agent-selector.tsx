"use client"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { Briefcase, Brain, Coffee, Lock } from "lucide-react"

const AGENTS = [
  { 
    name: 'Product PM', 
    available: true, 
    icon: Brain,
    description: 'Start here - Product strategy insights',
    gradient: 'from-blue-600 to-cyan-600',
    basedOn: 'Based on Lenny Rachitsky'
  },
  { 
    name: 'Shark VC', 
    available: true, 
    icon: Briefcase,
    description: 'Next step - Brutal investor feedback',
    gradient: 'from-red-600 to-orange-600',
    basedOn: 'Based on top VCs from Sequoia, a16z, YC'
  }
]

interface AgentSelectorProps {
  selectedAgent: string
  onSelect: (agent: string) => void
}

export default function AgentSelector({ selectedAgent, onSelect }: AgentSelectorProps) {
  return (
    <div className="w-full p-6">
      <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">
        Choose your VC personality
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {AGENTS.map((agent) => {
          const Icon = agent.icon
          const isSelected = selectedAgent === agent.name
          
          return (
            <Button
              key={agent.name}
              onClick={() => agent.available && onSelect(agent.name)}
              variant="outline"
              className={cn(
                "relative h-auto p-6 flex flex-col items-center gap-3 transition-all",
                isSelected && "border-primary shadow-lg shadow-primary/20",
                !agent.available && "opacity-50 cursor-not-allowed"
              )}
              disabled={!agent.available}
            >
              {!agent.available && (
                <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
              )}
              <div className={cn(
                "p-3 rounded-lg",
                isSelected 
                  ? `bg-gradient-to-br ${agent.gradient}` 
                  : "bg-secondary"
              )}>
                <Icon className={cn(
                  "h-6 w-6",
                  isSelected ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {agent.available ? agent.description : "Coming soon"}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 italic">
                  {agent.basedOn}
                </p>
              </div>
              {agent.name === 'Product PM' && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  Start here
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
} 