
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey
)

async function debugMurid() {
    console.log("🕵️ Debugging Murid Access...")

    // 1. Login as Ahmad Santri (murid1)
    const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
        email: "murid1@tahfidz.test",
        password: "Murid123456!"
    })

    if (loginErr) {
        console.error("❌ Login Failed:", loginErr.message)
        return
    }

    const uid = session?.user.id
    console.log(`✅ Logged in as: ${session?.user.email} (${uid})`)

    // 2. Check Name
    const { data: userProfile } = await supabase.from("users").select("full_name").eq("id", uid).single()
    console.log(`   Name in DB: ${userProfile?.full_name}`)

    // 3. Check Enrollments (Visible?)
    const { data: enrolls, error: enrollError } = await supabase
        .from("class_enrollments")
        .select("*, class:classes(name)")
        .eq("user_id", uid)

    if (enrollError) console.error("❌ Enrollment Query Error:", enrollError.message)
    else {
        console.log(`\n📚 Enrollments found: ${enrolls.length}`)
        enrolls.forEach(e => console.log(`   - ${e.class?.name}`))
    }

    // 4. Check Evaluations (Visible?)
    const { count: evalCount, error: evalError } = await supabase
        .from("evaluations")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", uid)

    if (evalError) console.error("❌ Eval Query Error:", evalError.message)
    else console.log(`\n📝 Evaluations found: ${evalCount}`)
}

debugMurid()
