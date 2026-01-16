"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function loginAction(email: string, password: string) {
  const cookieStore = await cookies()

  // 1️⃣ Client untuk AUTH (PAKAI ANON)
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch { }
        },
      },
    },
  )

  // 2️⃣ Client untuk DATABASE (PAKAI SERVICE ROLE)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // 🔐 AUTH
    const { data, error: authError } =
      await authClient.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      return { error: authError?.message ?? "Authentication failed", redirectUrl: null }
    }

    console.log("[v0] Auth successful:", data.user.id)

    // 🧠 QUERY USER PROFILE (BYPASS RLS)
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (userError || !userData) {
      await authClient.auth.signOut()
      return { error: "User profile not found. Contact admin.", redirectUrl: null }
    }

    const role = userData.role?.toLowerCase()

    const redirectMap: Record<string, string> = {
      admin: "/admin/dashboard",
      guru: "/guru/dashboard",
      murid: "/murid/dashboard",
    }

    return {
      error: null,
      redirectUrl: redirectMap[role] ?? "/",
    }
  } catch (err) {
    console.error("[v0] Unexpected login error:", err)
    return { error: "Unexpected error", redirectUrl: null }
  }
}
