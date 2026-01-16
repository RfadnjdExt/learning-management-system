import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAccounts() {
    console.log("🔧 Fixing User Accounts...")

    // 1. Get Institution ID (Assume first one)
    const { data: instData, error: instError } = await supabase
        .from("institutions")
        .select("id")
        .limit(1)
        .single()

    if (instError || !instData) {
        console.error("❌ No Institution found. Please run seed data first.")
        return
    }
    const institutionId = instData.id
    console.log(`✅ Using Institution ID: ${institutionId}`)

    // 2. Get All Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error("❌ Error listing auth users:", authError)
        return
    }

    console.log(`Found ${users.length} auth users. Syncing to public.users...`)

    for (const user of users) {
        const email = user.email || ""
        let role = "murid" // default
        let fullName = "User"

        if (email.includes("admin")) {
            role = "admin"
            fullName = "Admin Tahfidz"
        } else if (email.includes("guru")) {
            role = "guru"
            fullName = "Ustaz Muhammad"
        } else if (email.includes("murid")) {
            role = "murid"
            // Extract number from email if possible, e.g. murid1 -> Murid 1
            const num = email.match(/\d+/)
            fullName = num ? `Murid ${num[0]}` : "Murid Test"
        }

        // 2.5 Delete existing user with same email but different ID (to avoid unique constraint error)
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .neq("id", user.id) // Only if ID is different
            .maybeSingle()

        if (existingUser) {
            console.log(`   ⚠️ Found conflict for ${email}. Deleting old record ${existingUser.id}...`)
            await supabase.from("users").delete().eq("id", existingUser.id)
        }

        // 3. Upsert into public.users
        const { error: upsertError } = await supabase
            .from("users")
            .upsert({
                id: user.id,
                institution_id: institutionId,
                email: email,
                full_name: fullName,
                role: role,
                updated_at: new Date().toISOString()
            }, { onConflict: "id" }) // Upsert based on ID

        if (upsertError) {
            console.error(`❌ Failed to sync ${email}:`, upsertError.message)
        } else {
            console.log(`✅ Synced: ${email} (${role})`)
        }
    }

    // 4. Also Ensure Class Enrollment for Murid (Optional but helpful for testing)
    // Let's check if there's a class
    const { data: classData } = await supabase.from("classes").select("id").limit(1).single()
    if (classData) {
        const muridUsers = users.filter(u => u.email?.includes("murid"))
        for (const m of muridUsers) {
            const { error: enrollError } = await supabase
                .from("class_enrollments")
                .upsert({
                    class_id: classData.id,
                    user_id: m.id
                }, { onConflict: "class_id,user_id" })

            if (!enrollError) console.log(`   - Enrolled ${m.email} to class`)
        }
    }

    console.log("\n✨ Fix complete. Try logging in now.")
}

fixAccounts()
