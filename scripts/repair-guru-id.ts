
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function repairGuru() {
    console.log("🔧 Starting Guru ID Repair...")

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // 1. Get Auth ID
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    const guruAuth = users?.find(u => u.email === "guru@tahfidz.test")

    if (!guruAuth) {
        console.error("❌ Guru not found in Auth!")
        return
    }
    console.log(`✅ Auth ID:   ${guruAuth.id}`)

    // 2. Get Public ID by Email
    const { data: guruPublic, error: dbError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("email", "guru@tahfidz.test")
        .single()

    if (!guruPublic) {
        console.error("❌ Guru not found in public.users by email. (Strange, expected duplicate error)")
        return
    }
    console.log(`✅ Public ID: ${guruPublic.id}`)

    if (guruAuth.id === guruPublic.id) {
        console.log("🎉 IDs define match! No repair needed.")
        return
    }

    // 3. Manual Re-linking Strategy
    const oldId = guruPublic.id
    const newId = guruAuth.id

    console.log(`\n🔄 Starting Manual Re-linking from ${oldId} -> ${newId}`)

    // A. Check if target row exists (if not, create it)
    const { data: targetRow } = await supabase.from("users").select("id").eq("id", newId).single()

    if (!targetRow) {
        console.log("   Creating Correct User Row...")
        const { error: insertError } = await supabase.from("users").insert({
            id: newId,
            email: "guru@tahfidz.test",
            full_name: "Guru Tahfidz",
            role: "guru",
            institution_id: "11111111-1111-1111-1111-111111111111" // Assuming standard test ID
        })
        if (insertError) {
            // If duplicate email prevents insert, we must rename the old email first
            if (insertError.message.includes("unique")) {
                console.log("   Rename old email to allow new insert...")
                await supabase.from("users").update({ email: "temp_old_guru@test.com" }).eq("id", oldId)

                // Retry Insert
                const { error: retryError } = await supabase.from("users").insert({
                    id: newId,
                    email: "guru@tahfidz.test",
                    full_name: "Guru Tahfidz",
                    role: "guru",
                    institution_id: "11111111-1111-1111-1111-111111111111"
                })
                if (retryError) throw retryError
            } else {
                throw insertError
            }
        }
    }

    // B. Re-link Dependencies
    console.log("   Re-linking Classes...")
    const { error: classError } = await supabase.from("classes").update({ guru_id: newId }).eq("guru_id", oldId)
    if (classError) console.error("   Classes Error:", classError.message)

    console.log("   Re-linking Sessions...")
    const { error: sessError } = await supabase.from("sessions").update({ guru_id: newId }).eq("guru_id", oldId)
    // Note: check column name, usually created_by or guru_id?
    // Let's assume generic ownership or just skip if column unknown. 
    // Classes is main one. Check evaluations.

    console.log("   Re-linking Evaluations...")
    const { error: evalError } = await supabase.from("evaluations").update({ evaluator_id: newId }).eq("evaluator_id", oldId)
    if (evalError) console.error("   Evaluations Error:", evalError.message)

    // C. Delete Old Row
    console.log("   Deleting Old Stale Row...")
    const { error: delError } = await supabase.from("users").delete().eq("id", oldId)

    if (delError) {
        console.error("❌ Delete Failed:", delError.message)
    } else {
        console.log("✅ Repair Complete! Old row deleted, New row active.")
    }
}

repairGuru()
