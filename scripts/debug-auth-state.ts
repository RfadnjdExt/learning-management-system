
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TARGET_EMAIL = "abdullah@tahfidz.test"

async function debugState() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("🔍 Debugging User State for:", TARGET_EMAIL)

    // 1. Get Public Profile
    const { data: profile } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", TARGET_EMAIL)
        .single()

    if (profile) {
        console.log(`✅ [DB] Profile Found: ${profile.id} (${profile.full_name})`)
    } else {
        console.log(`❌ [DB] Profile NOT Found`)
    }

    // 2. Get Auth User
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const authUser = users.find(u => u.email === TARGET_EMAIL)

    if (authUser) {
        console.log(`✅ [AUTH] User Found:   ${authUser.id}`)
        console.log(`   - Confirmed: ${authUser.email_confirmed_at}`)
        console.log(`   - Last Signin: ${authUser.last_sign_in_at}`)
    } else {
        console.log(`❌ [AUTH] User NOT Found`)
    }
}

debugState()
