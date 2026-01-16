
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TARGET_EMAIL = "abdullah@tahfidz.test"
const TARGET_PASSWORD = "Guru123456!"

async function repairAbdullah() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log(`🛠️ Repairing User: ${TARGET_EMAIL}`)

    // 1. Get Old Profile
    const { data: oldProfile } = await supabase
        .from("users")
        .select("*")
        .eq("email", TARGET_EMAIL)
        .single()

    if (!oldProfile) {
        console.error("❌ Old profile not found.")
        return
    }
    const oldId = oldProfile.id
    console.log(`   Old ID (DB): ${oldId}`)

    // 2. Handle Auth User
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingAuth = users.find(u => u.email === TARGET_EMAIL)

    if (existingAuth) {
        console.log(`   Found existing Auth User (${existingAuth.id}). Deleting to start fresh...`)
        await supabase.auth.admin.deleteUser(existingAuth.id)
    }

    // 3. Rename Old Profile Email to avoid Unique Constraint
    console.log("   Renaming Old Profile Email to free up constraint...")
    const tempEmail = `temp_${Date.now()}_${TARGET_EMAIL}`
    const { error: renameError } = await supabase
        .from("users")
        .update({ email: tempEmail })
        .eq("id", oldId)

    if (renameError) {
        console.error("❌ Failed to rename old profile:", renameError.message)
        return
    }
    console.log(`   Renames old profile to: ${tempEmail}`)

    // 4. Create New Auth User
    console.log("   Creating NEW Auth User...")
    const { data: newAuth, error: createError } = await supabase.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: { role: oldProfile.role }
    })

    if (createError) {
        console.error("❌ Failed to create Auth:", createError.message)
        // Rollback rename?
        await supabase.from("users").update({ email: TARGET_EMAIL }).eq("id", oldId)
        return
    }

    const newId = newAuth.user.id
    console.log(`   New ID (Auth): ${newId}`)

    // 5. Create New Profile (Clone)
    console.log("   Cloning Profile...")
    const { error: insertError } = await supabase.from("users").insert({
        id: newId,
        email: oldProfile.email, // Use original email
        full_name: oldProfile.full_name,
        role: oldProfile.role,
        institution_id: oldProfile.institution_id,
        phone: oldProfile.phone,
        address: oldProfile.address
    })

    if (insertError) {
        console.error("❌ Failed to insert new profile:", insertError.message)
        return
    }

    // 6. Re-link Dependencies
    console.log("   Re-linking Classes...")
    const { error: classError } = await supabase
        .from("classes")
        .update({ guru_id: newId })
        .eq("guru_id", oldId)

    if (classError) console.error("   ⚠️ Class update failed:", classError.message)

    console.log("   Re-linking Sessions...")
    const { error: sessionError } = await supabase
        .from("sessions")
        .update({ guru_id: newId })
        .eq("guru_id", oldId)

    if (sessionError) console.error("   ⚠️ Session update failed:", sessionError.message)

    // 7. Delete Old Profile
    console.log("   Deleting Old Profile...")
    const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", oldId)

    if (deleteError) {
        console.error("❌ Failed to delete old profile:", deleteError.message)
    } else {
        console.log("✅ Repair Complete! Old profile deleted.")
    }
}

repairAbdullah()
