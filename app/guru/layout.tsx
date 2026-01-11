import type React from "react"
import { requireRole } from "@/lib/auth-utils"
import { GuruSidebar } from "@/components/guru/guru-sidebar"

export default async function GuruLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["guru"])

  return (
    <div className="flex min-h-screen bg-background">
      <GuruSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
