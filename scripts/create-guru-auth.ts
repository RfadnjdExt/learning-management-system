
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TARGET_EMAIL = "abdullah@tahfidz.test"
const TARGET_PASSWORD = "Guru123456!"
const TARGET_ROLE = "guru"

async function createAuthForExistingUser() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`🚀 Fixing Auth for: ${TARGET_EMAIL}`)

    // 1. Check if profile exists in public.users
    const { data: profile } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("email", TARGET_EMAIL)
        .single()

    if (!profile) {
        console.error("❌ Profile not found in public.users! Did you create it in Admin panel?")
        return
    }

    console.log(`✅ Found Public Profile: ${profile.full_name} (ID: ${profile.id})`)

    // 2. Check if Auth user already exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingAuth = users.find(u => u.email === TARGET_EMAIL)

    let authId = ""

    if (existingAuth) {
        console.log(`⚠️  Auth User already exists (ID: ${existingAuth.id}). Checking linkage...`)
        authId = existingAuth.id

        // If IDs don't match, we have the "Split Brain" issue again.
        if (authId !== profile.id) {
            console.error("❌ CRITICAL: Auth ID and Profile ID do not match!")
            console.error(`   Auth ID: ${authId}`)
            console.error(`   Prof ID: ${profile.id}`)
            console.log("   > Recommendation: Delete the Profile and re-create it using the Auth ID, or update Profile ID.")

            // Auto-fix: Update Profile ID to match Auth ID?
            // But Profile ID is PK. Changing PK is hard due to FKs.
            // Better: Delete Auth and re-create with Profile ID? 
            // Supabase Auth `createUser` allows specifying ID? Yes!

            console.log("   Attempting to delete OLD Auth user and re-create with CORRECT ID...")
            await supabase.auth.admin.deleteUser(authId)
            // Set flag to recreate
            authId = ""
        }
    }

    // 3. Create Auth User with specific ID if possible
    if (!authId) {
        console.log("➕ Creating new Auth User linked to Profile ID...")
        const { data: newAuth, error } = await supabase.auth.admin.createUser({
            email: TARGET_EMAIL,
            password: TARGET_PASSWORD,
            email_confirm: true,
            user_metadata: { role: TARGET_ROLE },
            // CRITICAL: Force the Auth ID to match the existing Profile ID
            // Note: verify if Supabase JS supports this param directly. 
            // Usually it doesn't allow setting ID on create. 
            // STRATEGY CHANGE: 
            // If we cannot set Auth ID, we must update the Profile ID to match the new Auth ID.
            // But updating Profile ID breaks FKs.

            // WAIT! Supabase `createUser` DOES NOT allow setting ID.
            // So the flow MUST be:
            // 1. Create Auth User -> Get New ID.
            // 2. Update `public.users` ID to New ID. (Cascade?)
            //    If `public.users` has ON UPDATE CASCADE on FKs, we are good.
            //    Let's check schema. `users.id` is PK. 
            //    Classes, Sessions etc reference `users(id)`.
            //    Standard PG: UPDATE users SET id = ... works if FKs are ON UPDATE CASCADE.
            //    Looking at schema: `REFERENCES users(id) ON DELETE ...` NO 'ON UPDATE CASCADE'.
            //    Default is RESTRICT/NO ACTION. So Update will FAIL.
        })

        // OK, manual approach:
        // We cannot change User ID easily if FKs exist. 
        // BUT! This is a NEW user. Likely no FKs yet (no classes assigned, no sessions).
        // So we CAN update the ID.

        const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
            email: TARGET_EMAIL,
            password: TARGET_PASSWORD,
            email_confirm: true,
            user_metadata: { role: TARGET_ROLE }
        })

        if (createError) {
            console.error("❌ Failed to create Auth User:", createError.message)
            return
        }

        const newAuthId = createdUser.user.id
        console.log(`✅ Auth User Created! New ID: ${newAuthId}`)

        console.log("🔄 Updating public.users ID to match Auth ID...")
        // We need to bypass RLS or use Service Role. 'supabase' is Service Role here.
        const { error: updateError } = await supabase
            .from("users")
            .update({ id: newAuthId })
            .eq("id", profile.id)

        if (updateError) {
            console.error("❌ Failed to update Profile ID:", updateError.message)
            console.error("   This usually means dependent records (FKs) exist. Since this is a new user, check if you assigned them to a class already?")

            // Fallback: If update failed, we must Delete Profile and Re-insert with New ID.
            // Safe if no dependencies.
        } else {
            console.log("✨ SUCCESS! Profile Linked to Auth Account.")
            console.log(`   Email: ${TARGET_EMAIL}`)
            console.log(`   Pass : ${TARGET_PASSWORD}`)
        }
    }
}

createAuthForExistingUser()
