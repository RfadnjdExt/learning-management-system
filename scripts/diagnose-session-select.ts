
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NON_ADMIN_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

const GURU_EMAIL = "guru@tahfidz.test"
const GURU_PASSWORD = "Guru123456!"

async function diagnoseSessionSelect() {
    console.log("🕵️ Diagnose Session SELECT RLS...")
    const client = createClient(SUPABASE_URL, NON_ADMIN_KEY)

    // 1. Login
    const { data: { user }, error: loginError } = await client.auth.signInWithPassword({
        email: GURU_EMAIL,
        password: GURU_PASSWORD
    })

    if (loginError || !user) {
        console.error("❌ Login Failed:", loginError?.message)
        return
    }
    console.log(`✅ Logged in as Guru: ${user.id}`)

    // 2. Try SELECT
    console.log("🔍 Attempting to fetch sessions...")
    const { data, error } = await client
        .from("sessions")
        .select("*")
        .eq("guru_id", user.id)

    if (error) {
        console.error("❌ SELECT Failed (RLS Blocked):", error.message)
        console.log("   Legacy Code:", error.code)
    } else {
        console.log(`✅ SELECT Success. Found ${data.length} sessions.`)
        if (data.length === 0) {
            console.warn("⚠️  Result is empty. If sessions exist in DB but not returned here, RLS is hiding them.")
        } else {
            console.table(data.map(s => ({ id: s.id, date: s.session_date })))
        }
    }
}

diagnoseSessionSelect()
