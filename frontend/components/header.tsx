"use client"

import { Button } from "@/app/components/ui/button"
import { LogOut, Sparkles, Mail, Github } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

// Add Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function Header() {
  const { user, signOut, signInWithOAuth } = useAuth()

  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Starknet Founders Bot
                </h1>
                <p className="text-xs text-muted-foreground">A Starknet Foundation program</p>
              </div>
            </div>
            <div className="hidden md:block text-xs text-muted-foreground/70 border-l pl-4 ml-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span>AI advisor online</span>
              </div>
              <p>Get AI feedback on your startup ideas & strategy</p>
              <p>Issues? Contact <span className="text-primary">@espejelomar</span> on Telegram</p>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => signInWithOAuth('google')}
                variant="gradient"
                className="gap-2"
              >
                <GoogleIcon className="h-4 w-4" />
                Google
              </Button>
              <Button
                onClick={() => signInWithOAuth('github')}
                variant="outline"
                className="gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 