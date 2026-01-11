
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Valid Guru Credentials from seeding
const GURU_EMAIL = "guru@tahfidz.test"
const GURU_PASSWORD = "password123"

async function diagnoseGuruInsert() {
    console.log("🕵️ Starting Guru INSERT RLS Diagnosis...")

    // 1. Client as Guru (Auth)
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Login
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: GURU_EMAIL,
        password: GURU_PASSWORD
    })

    if (authError || !authData.user) {
        console.error("❌ Login Failed:", authError?.message)
        return
    }
    console.log(`✅ Logged in as: ${GURU_EMAIL} (${authData.user.id})`)

    const guruId = authData.user.id

    // 2. Get a Class ID (Read Permission Check)
    const { data: classes, error: classError } = await client.from("classes").select("id").eq("guru_id", guruId).limit(1)

    if (classError) {
        console.error("❌ READ Classes Failed:", classError.message)
        return
    }
    if (!classes || classes.length === 0) {
        console.error("⚠️ No classes found for this guru. Cannot test Session Insert.")
        return
    }
    const classId = classes[0].id
    console.log(`✅ READ Access verified. Found Class ID: ${classId}`)

    // 3. Test INSERT Session
    console.log("\n🧪 Testing SESSION Insert...")
    const { data: session, error: sessError } = await client.from("sessions").insert({
        class_id: classId,
        guru_id: guruId,
        session_date: new Date().toISOString().split('T')[0],
        notes: "RLS Diagnostic Test Session"
    }).select().single()

    if (sessError) {
        console.error("❌ INSERT Session FAILED:", sessError.message)
        console.error("   (Check RLS policy on 'sessions' table for INSERT)")
    } else {
        console.log(`✅ INSERT Session SUCCESS. ID: ${session.id}`)
    }

    if (!session) return

    // 4. Test INSERT Evaluation
    // Need a student and template first
    const { data: enroll } = await client.from("class_enrollments").select("user_id").eq("class_id", classId).limit(1).single()
    const { data: tmpl } = await client.from("evaluation_templates").select("id").limit(1).single()

    if (!enroll || !tmpl) {
        console.log("⚠️ Missing student or template, skipping Eval test.")
        // Clean up session
        await client.from("sessions").delete().eq("id", session.id)
        return
    }

    console.log("\n🧪 Testing EVALUATION Insert...")
    const { data: evaluation, error: evalError } = await client.from("evaluations").insert({
        session_id: session.id,
        user_id: enroll.user_id,
        evaluator_id: guruId,
        template_id: tmpl.id,
        tajweed_level: 'hafal_lancar',
        hafalan_level: 'hafal_lancar',
        tartil_level: 'hafal_lancar',
        additional_notes: "RLS Test Eval"
    }).select().single()

    if (evalError) {
        console.error("❌ INSERT Evaluation FAILED:", evalError.message)
        console.error("   (Check RLS policy on 'evaluations' table for INSERT)")
    } else {
        console.log(`✅ INSERT Evaluation SUCCESS. ID: ${evaluation.id}`)

        // Cleanup
        await client.from("evaluations").delete().eq("id", evaluation.id)
        console.log("   🧹 Cleanup: Deleted test evaluation.")
    }

    // Cleanup Session
    await client.from("sessions").delete().eq("id", session.id)
    console.log("   🧹 Cleanup: Deleted test session.")

    console.log("\n🏁 Diagnosis Complete.")
}

diagnoseGuruInsert()
