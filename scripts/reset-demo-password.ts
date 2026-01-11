
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function resetGuruPassword() {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1. Find Guru ID
    const { data: users } = await supabase.from("users").select("id").eq("email", "guru@tahfidz.test").single()

    if (!users) {
        console.error("❌ Guru user not found in public.users table!")
        return
    }

    console.log(`Found Guru ID: ${users.id}`)

    // 2. Update Password via Auth Admin
    const { data: user, error } = await supabase.auth.admin.updateUserById(
        users.id,
        { password: "password123" }
    )

    if (error) {
        console.error("❌ Failed to reset password:", error.message)
    } else {
        console.log("✅ Password reset to 'password123' for guru@tahfidz.test")
    }
}

resetGuruPassword()
