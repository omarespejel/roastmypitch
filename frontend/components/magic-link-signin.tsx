"use client"

import { useState } from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Mail, Send, Github, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/app/hooks/use-toast"

// Add Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MagicLinkSignIn() {
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

  const handleOAuth = async (provider: 'google' | 'github') => {
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
            onClick={() => handleOAuth('google')} 
            variant="outline" 
            size="lg"
            className="w-full gap-2"
          >
            <GoogleIcon className="h-5 w-5" />
            Sign in with Google
          </Button>
          
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