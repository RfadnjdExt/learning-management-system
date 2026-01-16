
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

const MURID_EMAIL = "murid1@tahfidz.test"
const MURID_PASSWORD = "password123"

async function diagnoseMuridSearch() {
    console.log("🕵️ Starting Murid Search Diagnosis...")

    const client = createClient(SUPABASE_URL, supabaseKey)

    // 1. Login
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: MURID_EMAIL,
        password: MURID_PASSWORD
    })

    if (authError || !authData.user) {
        console.error("❌ Login Failed for Murid:", authError?.message)
        return
    }
    const studentId = authData.user.id
    console.log(`✅ Logged in as: ${MURID_EMAIL} (${studentId})`)

    // 2. Fetch Evaluations with Explicit FK
    console.log("\n🧪 Fetching Evaluations (users!evaluator_id)...")
    const { data: evals, error: fetchError } = await client
        .from("evaluations")
        .select("id, created_at, additional_notes, guru:users!evaluator_id(full_name)")
        .eq("user_id", studentId)
        .limit(5)

    if (fetchError) {
        console.error("❌ Fetch Evaluations FAILED:")
        console.error(JSON.stringify(fetchError, null, 2))
        return
    }

    if (!evals || evals.length === 0) {
        console.log("⚠️ No evaluations found for this student.")
        return
    }

    console.log(`✅ Found ${evals.length} evaluations.`)
    evals.forEach((e: any, i) => {
        console.log(`\n[${i + 1}] Eval ID: ${e.id}`)
        console.log(`    Additional Notes: ${e.additional_notes}`)
        console.log(`    Guru Object:`, e.guru)
        if (e.guru && e.guru.full_name) {
            console.log(`    ✅ Guru Name Visible: "${e.guru.full_name}"`)
        } else {
            console.log(`    ❌ Guru Name MISSING (Check RLS on public.users)`)
        }
    })
}

diagnoseMuridSearch()
