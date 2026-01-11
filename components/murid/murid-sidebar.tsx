import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, LayoutDashboard, BookOpen, FileText, User } from "lucide-react"

async function LogoutButton() {
  async function handleLogout() {
    "use server"
    const supabase = await import("@/lib/supabase/server").then((m) => m.createClient())
    await supabase.auth.signOut()
  }

  return (
    <form action={handleLogout} className="w-full">
      <Button variant="ghost" className="w-full justify-start" type="submit">
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>
    </form>
  )
}

export async function MuridSidebar() {
  const { userData } = await getCurrentUserWithRole()

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-sidebar-foreground">Mutabaah</h1>
          <p className="text-xs text-sidebar-accent-foreground/70">Portal Santri</p>
        </Link>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground">{userData.full_name}</p>
        <p className="text-xs text-sidebar-accent-foreground/70">{userData.email}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link href="/murid/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>

        <Link href="/murid/evaluations">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-2" />
            Evaluasi Saya
          </Button>
        </Link>

        <Link href="/murid/reports">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Laporan
          </Button>
        </Link>

        <Link href="/murid/profile">
          <Button variant="ghost" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Profil
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <LogoutButton />
      </div>
    </div>
  )
}
