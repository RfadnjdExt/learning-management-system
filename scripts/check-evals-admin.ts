
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVICE ROLE
)

async function checkEvals() {
    console.log("🕵️ Checking Evaluations (Admin Mode)...")

    // 1. Get Murid ID
    const { data: user } = await supabase.from("users").select("id, email").eq("email", "murid1@tahfidz.test").single()
    console.log(`   Target User: ${user?.email} (${user?.id})`)

    if (!user) return

    // 2. Count Evals
    const { count, data } = await supabase
        .from("evaluations")
        .select("*", { count: 'exact' })
        .eq("user_id", user.id)

    console.log(`   Total Evaluations in DB: ${count}`)

    if (data && data.length > 0) {
        console.log("   Sample:", data[0])
    } else {
        console.log("   ⚠️ Database has NO evaluations for this user!")
    }
}

checkEvals()
