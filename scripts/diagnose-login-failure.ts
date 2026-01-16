
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

async function diagnose() {
    console.log("🕵️ Starting Detailed Login Diagnosis...")

    // 1. Admin Client (Service Role)
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 2. Public Client (Anon)
    const publicClient = createClient(SUPABASE_URL, ANON_KEY)

    const EMAIL = "guru@tahfidz.test"
    const PASSWORD = "Guru123456!"

    try {
        // A. Check Auth User
        console.log(`\n1️⃣ Checking Auth User: ${EMAIL}`)
        const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers()
        const authUser = users?.find(u => u.email === EMAIL)

        if (!authUser) {
            console.error("❌ Auth User NOT FOUND in Supabase Auth.")
            console.log("   Suggestion: Run 'bun run scripts/setup-accounts.ts' again.")
            return
        }
        console.log(`✅ Auth User Found. ID: ${authUser.id}`)

        // B. Check Public User Profile (Bypassing RLS)
        console.log(`\n2️⃣ Checking public.users Table (Service Role)`)
        const { data: profile, error: dbError } = await adminClient
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single()

        if (dbError || !profile) {
            console.error("❌ Profile NOT FOUND in public.users (or DB error).")
            if (dbError) console.error("   DB Error:", dbError.message)
            console.log("   Suggestion: Run 'bun run scripts/fix-accounts.ts' to sync profile.")
            return
        }
        console.log(`✅ Public Profile Found. Role: ${profile.role}, Name: ${profile.full_name}`)

        // C. Check Login & RLS (Simulating App)
        console.log(`\n3️⃣ Testing Login & RLS (As Guru)`)
        const { data: loginData, error: loginError } = await publicClient.auth.signInWithPassword({
            email: EMAIL,
            password: PASSWORD
        })

        if (loginError || !loginData.user) {
            console.error("❌ Login Failed on Client:", loginError?.message)
            return
        }
        console.log("✅ Client Login Successful.")

        // C.2 Try to fetch own profile using the logged-in client
        console.log("   Attempting to fetch own profile (RLS Check)...")

        // We need a logged-in client state, createClient usually handles this if we pass access token or use the returned session
        // But simpler: just use the client we just signed in with triggers session persistence in memory
        const { data: myProfile, error: rlsError } = await publicClient
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .single()

        if (rlsError) {
            console.error("❌ RLS BLOCKED access to own profile!")
            console.error("   Error:", rlsError.message)
            console.error("   Code:", rlsError.code)
            console.log("   Root Cause: The RLS policy 'Users can view own profile' might be missing, recursive, or broken.")
        } else if (!myProfile) {
            console.error("❌ RLS Allowed query but returned NO DATA (Row invisible).")
        } else {
            console.log("✅ RLS Check Passed. Guru can view their own profile.")
            console.log("   Profile Data:", JSON.stringify(myProfile))
        }

    } catch (err: any) {
        console.error("💥 Unexpected Error:", err.message)
    }
}

diagnose()
