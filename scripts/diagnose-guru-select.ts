
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NON_ADMIN_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Simulate client

// Use the Guru's credentials (we know their password is Guru123456!)
async function diagnoseGuruSelect() {
    console.log("🕵️ Diagnose Guru SELECT Permissions...")
    const supabase = createClient(SUPABASE_URL, NON_ADMIN_KEY)

    // 1. Login as Guru
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: "guru@tahfidz.test",
        password: "Guru123456!"
    })

    if (loginError || !user) {
        console.error("❌ Login Failed:", loginError?.message)
        return
    }
    console.log("✅ Logged in as Guru:", user.id)

    // 2. Try to SELECT from evaluations (as done in the component)
    console.log("🔍 Attempting to fetch evaluations...")
    const { data, error } = await supabase
        .from("evaluations")
        .select("user_id, session_id")
        .eq("evaluator_id", user.id)
        .limit(5)

    if (error) {
        console.error("❌ SELECT Failed:", error.message)
        console.error("   Code:", error.code)
        console.error("   Details:", error.details)
        console.error("   Hint:", error.hint)
    } else {
        console.log(`✅ SELECT Success. Found ${data.length} evaluations.`)
        if (data.length > 0) {
            console.log("   Sample:", JSON.stringify(data[0]))
        }
    }
}

diagnoseGuruSelect()
