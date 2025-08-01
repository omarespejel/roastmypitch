"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/app/components/ui/toaster"
import type { ReactNode } from "react"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  )
} 