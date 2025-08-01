"use client"

import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"
import { Briefcase, Lock } from "lucide-react"
import { SharkIcon, BrainIcon } from "./custom-icons"

const AGENTS = [
  { 
    name: 'Product Manager', 
    available: true, 
    icon: BrainIcon,
    description: '🚀 Perfect your product strategy',
    subtitle: 'User research • Roadmaps • Market fit',
    gradient: 'from-blue-600 to-cyan-600',
    bgGradient: 'from-blue-600/10 to-cyan-600/10',
    basedOn: 'Based on top PM frameworks from Stripe, Airbnb, Notion'
  },
  { 
    name: 'Shark VC', 
    available: true, 
    icon: SharkIcon,
    description: '💼 Get investor-ready',
    subtitle: 'Pitch feedback • Traction • Fundraising',
    gradient: 'from-red-600 to-orange-600',
    bgGradient: 'from-red-600/10 to-orange-600/10',
    basedOn: 'Based on patterns from Sequoia, a16z, YC partners'
  }
]

interface AgentSelectorProps {
  selectedAgent: string
  onSelect: (agent: string) => void
}

export default function AgentSelector({ selectedAgent, onSelect }: AgentSelectorProps) {
  return (
    <div className="w-full p-6 md:p-8">
      <h2 className="text-center text-sm font-medium text-muted-foreground mb-6">
        Choose your advisor personality
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {AGENTS.map((agent) => {
          const Icon = agent.icon
          const isSelected = selectedAgent === agent.name
          
          return (
            <Button
              key={agent.name}
              onClick={() => agent.available && onSelect(agent.name)}
              variant="outline"
              className={cn(
                "relative h-auto p-6 flex flex-col items-center gap-4 transition-all duration-300 group card-hover",
                isSelected && "border-primary shadow-xl shadow-primary/20 scale-[1.02]",
                !agent.available && "opacity-50 cursor-not-allowed"
              )}
              disabled={!agent.available}
            >
              <div className={cn(
                "absolute inset-0 rounded-lg opacity-10 transition-opacity duration-300",
                `bg-gradient-to-br ${agent.bgGradient}`,
                isSelected && "opacity-20"
              )} />
              
              {!agent.available && (
                <Lock className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />
              )}
              
              <div className={cn(
                "p-4 rounded-xl transition-all duration-300",
                isSelected 
                  ? `bg-gradient-to-br ${agent.gradient} shadow-lg` 
                  : "bg-secondary group-hover:bg-secondary/70"
              )}>
                <Icon className={cn(
                  "h-8 w-8 transition-transform duration-300 group-hover:scale-110",
                  isSelected ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              
              <div className="text-center z-10">
                <h3 className="font-semibold text-lg">{agent.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.available ? agent.description : "Coming soon"}
                </p>
                {agent.subtitle && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {agent.subtitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-2 italic">
                  {agent.basedOn}
                </p>
              </div>
              
              {agent.name === 'Product Manager' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-starknet-teal to-starknet-purple text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
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