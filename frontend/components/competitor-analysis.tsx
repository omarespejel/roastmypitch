"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Textarea } from '@/app/components/ui/textarea'
import { Switch } from '@/app/components/ui/switch'
import { Users, Target, Shield, TrendingUp, AlertTriangle } from 'lucide-react'

export default function CompetitorAnalysis() {
  const [description, setDescription] = useState('')
  const [starknetFocus, setStarknetFocus] = useState(true)
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleAnalyze = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/competitor-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description,
          starknet_focus: starknetFocus
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
      }
    } catch (error) {
      console.error('Failed to analyze competitors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="card-hover bg-gradient-to-br from-background to-secondary/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Competitor Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Describe your project/idea:
            </label>
            <Textarea
              placeholder="E.g., A DeFi lending protocol that uses AI for risk assessment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Focus on Starknet ecosystem
            </label>
            <Switch
              checked={starknetFocus}
              onCheckedChange={setStarknetFocus}
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!description.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Competitors'}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-sm">Direct Competitors</h3>
                  </div>
                  {analysis.direct_competitors?.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.direct_competitors.map((competitor: any, index: number) => (
                        <div key={index} className="p-2 bg-secondary/30 rounded text-xs">
                          <div className="font-medium">{competitor.name}</div>
                          <div className="text-muted-foreground">{competitor.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Analysis includes direct competitor information
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-green-500" />
                    <h3 className="font-semibold text-sm">Competitive Advantages</h3>
                  </div>
                  {analysis.competitive_advantages?.length > 0 ? (
                    <div className="space-y-1">
                      {analysis.competitive_advantages.map((advantage: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {advantage}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Analysis includes competitive positioning insights
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold">Full Competitive Analysis</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {analysis.analysis}
                  </div>
                </div>
              </CardContent>
            </Card>

            {analysis.recommended_positioning && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Strategic Positioning</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.recommended_positioning}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {analysis.error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-red-700 dark:text-red-300">Analysis Error</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {analysis.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 