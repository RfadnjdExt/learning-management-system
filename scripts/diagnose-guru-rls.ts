
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use ANON key to simulate real user
)

async function testGuruAccess() {
    console.log("🕵️ Testing Guru Access (RLS Check)...")

    // 1. Login as Guru
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: "guru@tahfidz.test",
        password: "Guru123456!"
    })

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message)
        return
    }
    console.log(`✅ Logged in as ${session?.user.email} (${session?.user.id})`)

    // 2. Check Sessions (Should act as regression test for the previous fix)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
    console.log(`   Query Date: ${today}`)

    const { data: sessions, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("guru_id", session?.user.id)
        .eq("session_date", today)

    if (error) console.error("❌ Session Query Error:", error.message)
    else console.log(`   Found ${sessions.length} sessions for today.`)

    // 3. Check Evaluations
    const { count: evalCount, error: evalError } = await supabase
        .from("evaluations")
        .select("*", { count: 'exact', head: true })
        .eq("evaluator_id", session?.user.id)

    if (evalError) console.error("❌ Eval Query Error:", evalError.message)
    else console.log(`   Total Evaluations visible to Guru: ${evalCount}`)
}

testGuruAccess()
