
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NON_ADMIN_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

const ADMIN_EMAIL = "admin@tahfidz.test"
const ADMIN_PASSWORD = "Admin123456!"

async function verifyAdminEnrollment() {
    console.log("🕵️ Verifying Admin Enrollment RLS...")
    const client = createClient(SUPABASE_URL, NON_ADMIN_KEY)

    // 1. Login as Admin
    const { data: { user }, error: loginError } = await client.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    })

    if (loginError || !user) {
        console.error("❌ Login Failed:", loginError?.message)
        return
    }
    console.log(`✅ Logged in as Admin: ${user.id}`)

    // 2. Need a User ID (Murid) and Class ID
    const { data: murid } = await client.from("users").select("id").eq("role", "murid").limit(1).single()
    const { data: cls } = await client.from("classes").select("id").limit(1).single()

    if (!murid || !cls) {
        console.error("⚠️  Missing Murid or Class data to test.")
        return
    }

    console.log(`   Target Murid: ${murid.id}`)
    console.log(`   Target Class: ${cls.id}`)

    // 3. Test INSERT
    console.log("🧪 Testing INSERT Enrollment...")
    const { data: insertData, error: insertError } = await client.from("class_enrollments").insert({
        class_id: cls.id,
        user_id: murid.id
    }).select().single()

    if (insertError) {
        // If error is duplicate key, try delete first
        if (insertError.code === '23505') {
            console.log("   (Already enrolled, trying delete first...)")
        } else {
            console.error("❌ INSERT Failed:", insertError.message)
            return
        }
    } else {
        console.log("✅ INSERT Success")
    }

    // 4. Test DELETE
    console.log("🧪 Testing DELETE Enrollment...")
    const { error: deleteError } = await client
        .from("class_enrollments")
        .delete()
        .eq("class_id", cls.id)
        .eq("user_id", murid.id)

    if (deleteError) {
        console.error("❌ DELETE Failed:", deleteError.message)
    } else {
        console.log("✅ DELETE Success")
    }
}

verifyAdminEnrollment()
