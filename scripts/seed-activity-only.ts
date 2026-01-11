
import { createClient } from "@supabase/supabase-js"
import { fakerID_ID as faker } from "@faker-js/faker"
import * as dotenv from "dotenv"
import path from "path"

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local")
    process.exit(1)
}

// Admin client to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

async function seedActivity() {
    console.log("🌱 Starting Activity Seed (Classes, Sessions, Evaluations)...")

    // 1. Get Institution
    const { data: instData } = await supabase.from("institutions").select("id").single()
    if (!instData) {
        console.error("❌ No institution found. Please run the main seed script first.")
        process.exit(1)
    }
    const institutionId = instData.id
    console.log(`   Detailed to Institution: ${institutionId}`)

    // Cleanup Activity Data
    console.log("🧹 Cleaning up partial activity data...")
    await supabase.from("evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("class_enrollments").delete().neq("user_id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    // We can also cleanup templates if we want fresh ones, but let's check duplicates.
    // Actually, to be safe, let's delete templates too since we are redefining them completely.
    await supabase.from("evaluation_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    console.log("   Cleanup done.")

    // 2. Get Users
    console.log("   Fetching Users...")
    const { data: users } = await supabase.from("users").select("id, role, full_name")

    const guruIds = users?.filter(u => u.role === 'guru').map(u => u.id) || []
    const muridIds = users?.filter(u => u.role === 'murid').map(u => u.id) || []

    if (guruIds.length === 0 || muridIds.length === 0) {
        console.error("❌ Not enough users found. Gurus:", guruIds.length, "Murids:", muridIds.length)
        process.exit(1)
    }
    console.log(`   Found ${guruIds.length} Gurus and ${muridIds.length} Murids.`)

    // 3. Get/Create Semester
    const { data: semData } = await supabase.from("semesters").select("id").eq("is_active", true).single()
    let activeSemesterId = semData?.id

    if (!activeSemesterId) {
        console.log("   Creating Active Semester...")
        const { data: newSem } = await supabase.from("semesters").insert({
            institution_id: institutionId,
            name: "Genap 2024/2025",
            start_date: "2025-01-01",
            end_date: "2025-06-30",
            is_active: true
        }).select().single()
        activeSemesterId = newSem.id
    }

    // 4. Create Evaluation Templates
    console.log("   Creating Evaluation Templates...")
    const templatesToSeed = [
        {
            name: "Hafalan Ziyadah (Harian)",
            description: "Setoran hafalan baru",
            evaluator_label: "Ustadz",
            evaluation_criteria: {
                tajweed: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
                hafalan: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
                tartil: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
            }
        },
        {
            name: "Murojaah (Pengulangan)",
            description: "Setoran pengulangan hafalan lama",
            evaluator_label: "Ustadz",
            evaluation_criteria: {
                tajweed: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
                hafalan: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
                tartil: ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"],
            }
        },
        {
            name: "Tahsin / Tajwid",
            description: "Evaluasi kualitas bacaan",
            evaluator_label: "Ustadz",
            evaluation_criteria: {
                makharijul_huruf: ["kurang", "cukup", "baik", "sangat_baik"],
                shifatul_huruf: ["kurang", "cukup", "baik", "sangat_baik"],
                kelancaran: ["kurang", "cukup", "baik", "sangat_baik"],
            }
        }
    ]

    const createdTemplateIds: string[] = []

    for (const t of templatesToSeed) {
        const { data: newT, error } = await supabase.from("evaluation_templates").insert({
            institution_id: institutionId,
            ...t
        }).select().single()

        if (error) {
            console.error(`Error creating template ${t.name}:`, error.message)
        } else if (newT) {
            createdTemplateIds.push(newT.id)
            console.log(`   - Created: ${t.name}`)
        }
    }

    // Use the first one (Ziyadah) for main seeding loop to keep simple
    let templateId = createdTemplateIds[0]

    // 5. Classes (50 classes)
    console.log("   Generating 50 Classes...")
    const classIds: string[] = []

    for (let i = 0; i < 50; i++) {
        const randomGuru = guruIds[Math.floor(Math.random() * guruIds.length)]
        const className = `${faker.helpers.arrayElement(["Halaqah", "Kelas", "Kelompok"])} ${faker.person.firstName()}`

        const { data: cls, error: clsError } = await supabase.from("classes").insert({
            institution_id: institutionId,
            semester_id: activeSemesterId,
            guru_id: randomGuru,
            name: className,
            description: `Kelas tahfidz level ${faker.number.int({ min: 1, max: 5 })}`
        }).select().single()

        if (clsError) {
            console.error(`     Error creating class: ${clsError.message}`)
            continue
        }
        if (cls) classIds.push(cls.id)
    }
    console.log(`   ✅ ${classIds.length} Classes created.`)

    // 6. Enrollments & Activity
    console.log("📝 Generating Activity (Sessions & Evaluations)...")

    const levels = ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"] // Match DB Enum
    let totalSessions = 0;
    let totalEvaluations = 0;

    for (const classId of classIds) {
        // Enroll random 10-20 students per class
        const classStudents = faker.helpers.arrayElements(muridIds, faker.number.int({ min: 10, max: 20 }))

        // Batch enroll
        const enrollments = classStudents.map(sid => ({
            class_id: classId,
            user_id: sid
        }))

        const { error: enrollError } = await supabase.from("class_enrollments").insert(enrollments)
        if (enrollError) console.error(`Error enrolling: ${enrollError.message}`)

        // Create 15 sessions in the last 30 days
        for (let i = 0; i < 15; i++) {
            const sessionDate = faker.date.recent({ days: 30 })

            const { data: session, error: sessError } = await supabase.from("sessions").insert({
                class_id: classId,
                guru_id: guruIds[0],
                session_date: sessionDate.toISOString().split("T")[0],
                start_time: "07:00",
                end_time: "09:00",
                notes: "Setoran Rutin"
            }).select().single()

            if (!session) {
                if (sessError) console.error(`Error creating session: ${sessError.message}`)
                continue;
            }
            totalSessions++;

            // Evaluate 80% of students in the session
            const attendees = faker.helpers.arrayElements(classStudents, Math.floor(classStudents.length * 0.8))

            const evaluations = attendees.map(sid => ({
                session_id: session.id,
                user_id: sid,
                evaluator_id: guruIds[0],
                template_id: templateId,
                tajweed_level: faker.helpers.arrayElement(levels),
                hafalan_level: faker.helpers.arrayElement(levels),
                tartil_level: faker.helpers.arrayElement(levels),
                additional_notes: Math.random() > 0.7 ? faker.lorem.sentence() : null,
                created_at: sessionDate.toISOString() // Backdate creation
            }))

            if (evaluations.length > 0) {
                const { error: evalError } = await supabase.from("evaluations").insert(evaluations)
                if (evalError) console.error(`Error creating evaluations: ${evalError.message}`)
                else totalEvaluations += evaluations.length
            }
        }
        process.stdout.write(".")
    }

    console.log("\n✅ Activity Seed Complete!")
    console.log("Stats:")
    console.log(`- Classes: ${classIds.length}`)
    console.log(`- Sessions: ${totalSessions}`)
    console.log(`- Evaluations: ${totalEvaluations}`)
}

seedActivity().catch((e) => {
    console.error("UNKNOWN ERROR:", e)
    process.exit(1)
})
