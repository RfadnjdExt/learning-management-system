
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Use ANON key this time ( simulates frontend)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function diagnoseRLS() {
    console.log("🔐 Diagnosing RLS (as Logged-in Admin)...")

    // 1. Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: "admin@tahfidz.test",
        password: "Admin123456!"
    })

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message)
        process.exit(1)
    }
    console.log("✅ Login Success")

    // 2. Fetch Templates
    const { data: templates, error: fetchError } = await supabase
        .from("evaluation_templates")
        .select("*")

    if (fetchError) {
        console.error("❌ Fetch Error:", fetchError.message) // RLS might allow fetch but return empty
    } else {
        console.log(`📋 Fetched Templates via Anon Key: ${templates?.length}`)
    }
}

diagnoseRLS()
