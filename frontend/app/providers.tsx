"use client"

import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/app/components/ui/toaster"
import type { ReactNode } from "react"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
} 