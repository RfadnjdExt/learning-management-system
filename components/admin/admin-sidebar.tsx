import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, Users, Building2, BookOpen, FileText, Settings } from "lucide-react"

async function LogoutButton() {
  async function handleLogout() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return (
    <form action={handleLogout} className="w-full">
      <Button variant="ghost" className="w-full justify-start" type="submit">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </form>
  )
}

export async function AdminSidebar() {
  const { userData } = await getCurrentUserWithRole()

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-sidebar-foreground">Mutabaah</h1>
          <p className="text-xs text-sidebar-accent-foreground/70">Admin Panel</p>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground">{userData.full_name}</p>
        <p className="text-xs text-sidebar-accent-foreground/70">{userData.email}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <Building2 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>

        <Link href="/admin/users">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
        </Link>

        <Link href="/admin/academic">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-2" />
            Academic Structure
          </Button>
        </Link>

        <Link href="/admin/templates">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Evaluation Templates
          </Button>
        </Link>

        <Link href="/admin/settings">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <LogoutButton />
      </div>
    </div>
  )
}
