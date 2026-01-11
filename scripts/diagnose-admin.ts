
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function diagnose() {
    console.log("🔍 Diagnosing Data...")

    // 1. Check Admin User
    const { data: users } = await supabase.from("users").select("*").eq("email", "admin@tahfidz.test")
    const admin = users?.[0]

    if (!admin) {
        console.log("❌ Admin user not found!")
    } else {
        console.log(`✅ Admin Found: ${admin.email}`)
        console.log(`   - ID: ${admin.id}`)
        console.log(`   - Institution ID: ${admin.institution_id}`)
        console.log(`   - Role: ${admin.role}`)
    }

    // 2. Check Templates
    const { data: templates } = await supabase.from("evaluation_templates").select("*")
    console.log(`\n📋 Found ${templates?.length} Templates:`)
    templates?.forEach(t => {
        console.log(`   - [${t.id}] ${t.name} (Inst: ${t.institution_id})`)
    })

    // 3. Match
    if (admin && templates) {
        const match = templates.filter(t => t.institution_id === admin.institution_id)
        console.log(`\n🔗 Matches: ${match.length} templates belong to Admin's institution.`)
    }
}

diagnose()
