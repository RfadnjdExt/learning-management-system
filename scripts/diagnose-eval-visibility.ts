
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

// We need to login as Guru to test RLS
const GURU_EMAIL = "guru@tahfidz.test"
const GURU_PASSWORD = "Guru123456!"

async function diagnoseEval() {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log(`🕵️ Diagnosing Eval Visibility for ${GURU_EMAIL}...`)

    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: GURU_EMAIL,
        password: GURU_PASSWORD
    })

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message)
        return
    }

    const guruId = session?.user.id
    console.log(`✅ Logged in: ${guruId}`)

    // 1. Check Sessions
    const { data: sessions, error: sessError } = await supabase
        .from("sessions")
        .select("id, session_date")
        .eq("guru_id", guruId)
        .limit(5)

    if (sessError) console.error("❌ Session Fetch Error:", sessError.message)
    else console.log(`✅ Found ${sessions?.length} sessions.`)

    // 2. Check Evaluations
    const { data: evals, error: evalError } = await supabase
        .from("evaluations")
        .select("id, additional_notes, evaluator_id")
        .eq("evaluator_id", guruId)

    if (evalError) {
        console.error("❌ Eval Fetch Error:", evalError.message)
    } else {
        console.log(`✅ Found ${evals?.length} evaluations via RLS.`)
        if (evals && evals.length > 0) {
            console.log("   Legacy Sample:", evals[0])
        }
    }
}

diagnoseEval()
