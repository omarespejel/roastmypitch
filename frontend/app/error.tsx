"use client"

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="p-4 rounded-full bg-orange-600/20 w-fit mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-orange-600 mb-2">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an unexpected error. This could be due to:
          </p>
          
          <ul className="text-left text-sm text-muted-foreground space-y-1">
            <li>• Network connectivity issues</li>
            <li>• Temporary server problems</li>
            <li>• Invalid data or configuration</li>
          </ul>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={reset}
              className="gap-2 w-full"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="gap-2 w-full">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
          
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}