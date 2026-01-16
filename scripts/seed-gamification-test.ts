
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const GURU_EMAIL = "guru@tahfidz.test"
const BADGE_KEYWORD = "Lulus setoran hafalan Juz 30"

async function seedGamificationData() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("🌱 Seeding Gamification Test Data...")

    // 1. Get Guru User
    const { data: guruAuth } = await supabase.auth.admin.listUsers()
    const guruUser = guruAuth.users.find(u => u.email === GURU_EMAIL)

    if (!guruUser) {
        console.error("❌ Guru Abdullah not found.")
        return
    }
    const guruId = guruUser.id
    console.log(`✅ Guru Found: ${guruId}`)

    // 2. Get a Class for this Guru
    const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("guru_id", guruId)
        .limit(1)
        .single()

    if (!classes) {
        console.error("❌ No class found for Abdullah.")
        return
    }
    const classId = classes.id
    console.log(`✅ Class Found: ${classes.name}`)

    // 3. Get a Student in this Class
    const { data: enrollment } = await supabase
        .from("class_enrollments")
        .select("user_id, user:users(full_name)")
        .eq("class_id", classId)
        .limit(1)
        .single()

    if (!enrollment) {
        console.error("❌ No student enrolled in this class.")
        return
    }
    const studentId = enrollment.user_id
    const studentName = enrollment.user?.full_name
    console.log(`✅ Student Found: ${studentName} (${studentId})`)

    // 3.5 Get a Valid Template
    const { data: template } = await supabase
        .from("evaluation_templates")
        .select("id")
        .limit(1)
        .single()

    // If no template, we might need to create one or fail
    const templateId = template?.id || null
    if (!templateId) {
        console.error("❌ No evaluation template found. Please create one in Admin first.")
        // Optional: Create one if missing
        // return
    }

    // 4. Create 7 Sessions (Last 6 days + Today)
    console.log("   Creating 7 Days of Sessions & Evaluations...")

    const today = new Date()

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

        // Check/Create Session
        let sessionId = ""
        const { data: existingSession } = await supabase
            .from("sessions")
            .select("id")
            .eq("class_id", classId)
            .eq("session_date", dateStr)
            .maybeSingle()

        if (existingSession) {
            sessionId = existingSession.id
            console.log(`   - Session ${dateStr}: Exists`)
        } else {
            const { data: newSession, error: sessError } = await supabase
                .from("sessions")
                .insert({
                    class_id: classId,
                    guru_id: guruId,
                    session_date: dateStr,
                    notes: i === 0 ? "Sesi Ujian & Streak Akhir" : `Sesi Latihan Hari ke-${7 - i}`
                })
                .select()
                .single()

            if (sessError) {
                console.error(`     ❌ Error creating session ${dateStr}:`, sessError.message)
                continue
            }
            sessionId = newSession.id
            console.log(`   - Session ${dateStr}: Created`)
        }

        // Create Evaluation
        const note = i === 0 ? BADGE_KEYWORD : "Setoran lancar"

        if (templateId) {
            const { error: evalError } = await supabase
                .from("evaluations")
                .upsert({
                    session_id: sessionId,
                    user_id: studentId,
                    evaluator_id: guruId,
                    tajweed_level: "hafal_lancar",
                    hafalan_level: "hafal_lancar",
                    tartil_level: "hafal_lancar",
                    additional_notes: note,
                    template_id: templateId
                }, { onConflict: "session_id, user_id" })

            if (evalError) console.error(`     ❌ Eval Error: ${evalError.message}`)
            else console.log(`     ✅ Eval Added (Note: "${note}")`)
        }
    }
}

seedGamificationData()
