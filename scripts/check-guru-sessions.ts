
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_GURU_EMAIL = "guru@tahfidz.test"

async function checkSessions() {
    console.log("📅 Checking Guru Sessions...")

    // 1. Get Guru ID
    const { data: guru } = await supabase.from("users").select("id").eq("email", DEMO_GURU_EMAIL).single()
    if (!guru) { console.log("Guru not found"); return }

    // 2. JS Date Logic
    const jsDate = new Date()
    const jsIso = jsDate.toISOString().split("T")[0]
    const jsLocale = jsDate.toLocaleDateString('en-CA') // YYYY-MM-DD in local time usually

    console.log(`   JS Date (UTC ISO): ${jsIso}`)
    console.log(`   JS Date (Locale): ${jsLocale}`)
    console.log(`   Current Time: ${jsDate.toString()}`)

    // 3. Fetch Sessions
    const { data: sessions } = await supabase
        .from("sessions")
        .select("id, session_date, start_time")
        .eq("guru_id", guru.id)
        .order("session_date", { ascending: false })
        .limit(5)

    console.log("\n   Latest 5 Sessions in DB:")
    sessions?.forEach(s => {
        console.log(`   - ${s.session_date} (Start: ${s.start_time})`)
    })

    // 4. Check Match
    const matchIso = sessions?.filter(s => s.session_date === jsIso)
    console.log(`\n   Matches using ISO (${jsIso}): ${matchIso?.length}`)

    // Note: If the script runs in a different timezone than the Vercel server/browser, results may vary.
}

checkSessions()
