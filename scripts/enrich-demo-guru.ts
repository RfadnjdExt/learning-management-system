
import { createClient } from "@supabase/supabase-js"
import { fakerID_ID as faker } from "@faker-js/faker"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_GURU_EMAIL = "guru@tahfidz.test"

async function enrichDemoGuru() {
    console.log("🚀 Enriching Demo Guru Data...")

    // 1. Get Guru Context
    const { data: guru } = await supabase.from("users").select("*").eq("email", DEMO_GURU_EMAIL).single()
    if (!guru) { console.error("Guru not found"); return }

    console.log(`   Target Guru: ${guru.full_name} (${guru.id})`)

    // 2. Create Bulk Students (30 Students)
    console.log("   Creating 30 Bulk Students...")
    const newStudentIds: string[] = []

    for (let i = 1; i <= 30; i++) {
        const email = `santri.dummy.${i}@tahfidz.test`

        // Check existence first to avoid duplicate key errors if re-run
        const { data: existing } = await supabase.from("users").select("id").eq("email", email).single()

        if (existing) {
            newStudentIds.push(existing.id)
            continue
        }

        // Create Auth User
        const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password: "Password123!",
            email_confirm: true,
            user_metadata: { full_name: faker.person.fullName() }
        })

        if (auth.user) {
            // Create Public User
            const { data: pubUser } = await supabase.from("users").insert({
                id: auth.user.id,
                email,
                full_name: auth.user.user_metadata.full_name,
                role: "murid",
                institution_id: guru.institution_id,
                phone: faker.phone.number(),
                address: faker.location.city()
            }).select().single()

            if (pubUser) newStudentIds.push(pubUser.id)
        }
    }
    console.log(`   ✅ Ready with ${newStudentIds.length} extra students.`)

    // 3. Get Guru's Classes
    const { data: classes } = await supabase.from("classes").select("id, name").eq("guru_id", guru.id)

    if (!classes || classes.length === 0) {
        console.log("   ❌ Guru has no classes. Please run refine-demo-data.ts first.")
        return
    }

    // 4. Enroll Students & Generate History
    const { data: template } = await supabase.from("evaluation_templates").select("id").limit(1).single()
    const levels = ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"] // snake_case

    for (const cls of classes) {
        console.log(`   Processing Class: ${cls.name}...`)

        // Enroll all 30 students to Halaqah classes, split for others
        const studentsToEnroll = cls.name.includes("Halaqah")
            ? newStudentIds
            : faker.helpers.arrayElements(newStudentIds, 15)

        // Batch Enroll
        for (const sid of studentsToEnroll) {
            await supabase.from("class_enrollments").upsert({ class_id: cls.id, user_id: sid })
                .then(({ error }) => { if (error && !error.message.includes("duplicate")) console.error(error.message) })
        }

        // Generate 20 Sessions (Past 2 months)
        let sessionsCreated = 0
        for (let d = 0; d < 20; d++) {
            const date = new Date()
            date.setDate(date.getDate() - (d * 2)) // Every 2 days

            const { data: session } = await supabase.from("sessions").insert({
                class_id: cls.id,
                guru_id: guru.id,
                session_date: date.toISOString().split('T')[0],
                start_time: "07:30",
                end_time: "09:00",
                notes: `Setoran Rutin Hari ke-${d + 1}`
            }).select().single()

            if (session) {
                sessionsCreated++
                // Evaluate 80% of data
                const attendees = faker.helpers.arrayElements(studentsToEnroll, Math.floor(studentsToEnroll.length * 0.8))

                const evals = attendees.map(uid => ({
                    session_id: session.id,
                    user_id: uid,
                    evaluator_id: guru.id,
                    template_id: template?.id,
                    tajweed_level: faker.helpers.arrayElement(levels),
                    hafalan_level: faker.helpers.arrayElement(levels),
                    tartil_level: faker.helpers.arrayElement(levels),
                    created_at: date.toISOString()
                }))

                if (evals.length) await supabase.from("evaluations").insert(evals)
            }
        }
        console.log(`      + ${sessionsCreated} sessions created.`)
    }

    console.log("✅ Enrichment Complete! Guru Demo now has rich data.")
}

enrichDemoGuru()
