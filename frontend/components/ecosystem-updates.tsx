"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { ExternalLink, TrendingUp, Building, Calendar } from 'lucide-react'

interface EcosystemUpdatesProps {
  founderSpace: string
}

export default function EcosystemUpdates({ founderSpace }: EcosystemUpdatesProps) {
  const [updates, setUpdates] = useState<any>(null)
  const [caseStudies, setCaseStudies] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [updatesRes, casesRes] = await Promise.all([
          fetch(`${apiUrl}/ecosystem-updates/${encodeURIComponent(founderSpace)}`),
          fetch(`${apiUrl}/case-studies`)
        ])
        
        if (updatesRes.ok) {
          setUpdates(await updatesRes.json())
        }
        if (casesRes.ok) {
          setCaseStudies(await casesRes.json())
        }
      } catch (error) {
        console.error('Failed to fetch ecosystem data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (founderSpace) {
      fetchData()
    }
  }, [founderSpace, apiUrl])

  if (isLoading) {
    return (
      <Card>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Starknet Ecosystem Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="updates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="updates">Latest Updates</TabsTrigger>
            <TabsTrigger value="cases">Success Stories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="updates" className="space-y-4">
            {updates && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Recent developments in {founderSpace}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Relevance: {updates.relevance_score}
                  </span>
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {updates.updates}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Sources: {updates.sources}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cases" className="space-y-4">
            {caseStudies && !caseStudies.error && (
              <div className="space-y-6">
                {Object.entries(caseStudies).map(([key, study]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{study.name}</h3>
                        <Badge variant="secondary">{study.category}</Badge>
                      </div>
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-primary mb-1">Key Innovation:</p>
                      <p className="text-sm text-muted-foreground">{study.key_innovation}</p>
                    </div>
                    
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-sm leading-relaxed">
                        {study.insights?.substring(0, 300)}...
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="mt-3 gap-1">
                      Read Full Case Study
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {caseStudies?.error && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Unable to load case studies at this time.</p>
                <p className="text-xs text-muted-foreground mt-1">{caseStudies.error}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 