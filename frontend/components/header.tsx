"use client"

import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { LogOut, Sparkles, Mail, Github, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

interface HeaderProps {
  onResetConversation?: () => void
}

export default function Header({ onResetConversation }: HeaderProps) {
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
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Starknet Founders Bot
                  </h1>
                  <Badge 
                    variant="destructive" 
                    className="text-[10px] px-2 py-0.5 bg-orange-500 hover:bg-orange-600 border-orange-600 animate-pulse"
                  >
                    ALPHA
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  A Starknet Foundation program • Alpha version - Help us improve with your feedback!
                </p>
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
            <div className="flex items-center gap-2">
              {/* Reset Conversation Button */}
              {onResetConversation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetConversation}
                  className="gap-2"
                  title="Start a fresh conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">New Chat</span>
                </Button>
              )}
              
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
            <Button
              onClick={() => signInWithOAuth('github')}
              variant="gradient"
              className="gap-2"
            >
              <Github className="h-4 w-4" />
              Sign in with GitHub
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 