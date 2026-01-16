
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Use ANON key to simulate frontend/user access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

async function testUpdate() {
    console.log("🔐 Testing Institution Update (as Admin)...")

    // 1. Login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: "admin@tahfidz.test",
        password: "Admin123456!"
    })

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message)
        process.exit(1)
    }

    const user = session?.user
    if (!user || !user.user_metadata.institution_id) {
        // Fetch user profile to get institution_id if not in metadata
        console.log("...fetching user details for institution_id")
    }

    // Get current user details to find institution_id (using service role if needed, but let's try strict first)
    // Actually, let's just assume we know the logic or fetch profile
    // The 'users' table is readable per our previous fix (hopefully? Or maybe not verified)

    // Let's try to update the institution linked to this user.
    // We need to know the institution ID first.

    // Trick: We can try to fetch it first.
    const { data: instData, error: fetchError } = await supabase
        .from("institutions")
        .select("id, phone")
        .limit(1)
        .single() // This might fail if RLS blocks SELECT on institutions

    if (fetchError) {
        console.log("⚠️ Could not fetch institution (RLS Blocked Read?):", fetchError.message)
        // If we can't read, we likely can't update.
    } else {
        console.log(`✅ Fetched Institution: ${instData.id}, Phone: ${instData.phone}`)

        // 2. Try Update
        console.log("📝 Attempting Update...")
        const { data: updateData, error: updateError } = await supabase
            .from("institutions")
            .update({ phone: "08123456789" })
            .eq("id", instData.id)
            .select()
            .single()

        if (updateError) {
            console.error("❌ Link Update Failed (RLS Blocked Write):", updateError.message)
        } else {
            console.log("✅ Update Success! New Phone:", updateData.phone)
        }
    }
}

testUpdate()
