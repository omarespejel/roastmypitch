"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/app/components/ui/button"
import { Github, LogOut, Sparkles } from "lucide-react"
import Image from "next/image"

export default function Header() {
  const { data: session } = useSession()

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
          
          {session?.user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src={session.user.image || ""}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-primary/20"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
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
              onClick={() => signIn("github")}
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