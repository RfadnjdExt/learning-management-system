
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import path from "path"

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const guruEmail = "guru@tahfidz.test"

async function diagnose() {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    console.log("--- Diagnosing Templates ---")

    // 1. Check ALL templates (Admin view)
    const { data: allTemplates, error: countError } = await supabaseAdmin
        .from("evaluation_templates")
        .select("*")

    if (countError) {
        console.error("Error reading templates (Admin):", countError)
        return
    }

    console.log(`Total Templates in DB: ${allTemplates?.length}`)
    if (allTemplates && allTemplates.length > 0) {
        console.log("Sample 1:", allTemplates[0])
    } else {
        console.log("No templates found in DB.")
    }

    // 2. Check Guru's Institution (from public.users)
    const { data: guruProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("id, institution_id, email, full_name")
        .eq("email", guruEmail)
        .single()

    if (profileError || !guruProfile) {
        console.error("Guru profile not found:", profileError)
        return
    }

    console.log("Guru Profile:", guruProfile)

    // 3. Match Logic
    if (allTemplates) {
        const matchInst = allTemplates.filter(t => t.institution_id === guruProfile.institution_id)
        const nullInst = allTemplates.filter(t => t.institution_id === null)

        console.log(`Templates with matching institution_id (${guruProfile.institution_id}): ${matchInst.length}`)
        console.log(`Templates with NULL institution_id (global?): ${nullInst.length}`)

        if (matchInst.length === 0 && nullInst.length === 0) {
            console.warn("WARNING: No templates match this guru's institution!")
        }
    }

    // 4. Check RLS Policies (Query pg_policies)
    // Note: This requires postgres level access usually, but we can try rpc if available.
    // Instead, we trust step 3 results properly.
}

diagnose()
