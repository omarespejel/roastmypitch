"use client"

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Mail, Send, Github, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/app/hooks/use-toast"



export default function MagicLinkAuth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { signInWithMagicLink, signInWithOAuth } = useAuth()
  const { toast } = useToast()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    const { error } = await signInWithMagicLink(email)
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setSent(true)
      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign-in link.",
        variant: "success" as any,
      })
    }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'github') => {
    const { error } = await signInWithOAuth(provider)
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (sent) {
    return (
      <Card className="max-w-md w-full p-8 text-center animate-fade-up">
        <CardContent className="pt-6">
          <div className="p-4 rounded-full bg-green-600/20 w-fit mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Check your email!</h2>
          <p className="text-muted-foreground mb-4">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to sign in instantly. No password needed!
          </p>
          <Button
            variant="ghost"
            onClick={() => setSent(false)}
            className="mt-4"
          >
            Use different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full p-8 text-center animate-fade-up">
      <CardHeader>
        <div className="p-4 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 w-fit mx-auto mb-4">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold mb-2">
          Welcome to Starknet Founders Bot
        </CardTitle>
        <p className="text-muted-foreground">
          Get brutally honest feedback on your startup pitch
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Magic Link Sign In - Priority */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div className="text-left">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              ✨ Sign in with Magic Link (Recommended)
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={loading || !email.trim()}
                className="gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* OAuth Options */}
        <div className="space-y-3">
          <Button 
            onClick={() => handleOAuth('github')} 
            variant="outline" 
            size="lg"
            className="w-full gap-2"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          Magic Link = No passwords, instant access via email ✨
        </div>
      </CardContent>
    </Card>
  )
}