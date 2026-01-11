import { getCurrentUserWithRole } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, LayoutDashboard, BookOpen, Users, CheckSquare } from "lucide-react"

async function LogoutButton() {
  async function handleLogout() {
    "use server"
    const supabase = await import("@/lib/supabase/server").then((m) => m.createClient())
    await supabase.auth.signOut()
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
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

export async function GuruSidebar() {
  const { userData } = await getCurrentUserWithRole()

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="block hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-sidebar-foreground">Mutabaah</h1>
          <p className="text-xs text-sidebar-accent-foreground/70">Panel Guru</p>
        </Link>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground">{userData.full_name}</p>
        <p className="text-xs text-sidebar-accent-foreground/70">{userData.email}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link href="/guru/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>

        <Link href="/guru/classes">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="w-4 h-4 mr-2" />
            Kelas Saya
          </Button>
        </Link>

        <Link href="/guru/sessions">
          <Button variant="ghost" className="w-full justify-start">
            <CheckSquare className="w-4 h-4 mr-2" />
            Sesi
          </Button>
        </Link>

        <Link href="/guru/students">
          <Button variant="ghost" className="w-full justify-start">
            <Users className="w-4 h-4 mr-2" />
            Santri
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <LogoutButton />
      </div>
    </div>
  )
}
