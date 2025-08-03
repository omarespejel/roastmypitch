"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="p-4 rounded-full bg-red-600/20 w-fit mx-auto mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-red-600 mb-2">
            Authentication Error
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            There was an issue processing your authentication request. This could be due to:
          </p>
          
          <ul className="text-left text-sm text-muted-foreground space-y-1">
            <li>• Expired or invalid magic link</li>
            <li>• OAuth authorization was cancelled</li>
            <li>• Network connectivity issues</li>
          </ul>
          
          <div className="pt-4">
            <Link href="/">
              <Button className="gap-2 w-full">
                <ArrowLeft className="h-4 w-4" />
                Try Again
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  )
}