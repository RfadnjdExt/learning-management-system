
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

// Demo Credentials (Must match app/auth/login/page.tsx)
const DEMO_USERS = [
    { email: "admin@tahfidz.test", password: "Admin123456!", role: "admin", name: "Administrator Utama" },
    { email: "guru@tahfidz.test", password: "Guru123456!", role: "guru", name: "Ustadz Abdullah" },
    { email: "murid1@tahfidz.test", password: "Murid123456!", role: "murid", name: "Ahmad Santri" },
    { email: "murid2@tahfidz.test", password: "Murid123456!", role: "murid", name: "Fatimah Santri" },
]

async function seed() {
    console.log("🌱 Starting Big Data Seed...")

    // 1. Cleanup
    console.log("🧹 Cleaning up existing data...")

    // Try RPC first
    const { error: cleanError } = await supabase.rpc("cleanup_all_data")

    if (cleanError) {
        console.log("   ℹ️ cleanup_all_data RPC not found or failed. Proceeding with manual cleanup.")

        // Manual Cleanup Order: Child -> Parent
        const tables = [
            "evaluations",
            "sessions",
            "class_enrollments",
            "classes",
            "semesters",
            "evaluation_templates"
        ]

        for (const table of tables) {
            process.stdout.write(`   - Deleting ${table}... `)
            const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
            if (error) console.log(`Error: ${error.message}`)
            else console.log("Done.")
        }

        // Public Users
        process.stdout.write("   - Deleting public users... ")
        const { error: uDelError } = await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        if (uDelError) console.log(`Error: ${uDelError.message}`)
        else console.log("Done.")

        // Auth Users
        const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        if (existingUsers && existingUsers.length > 0) {
            console.log(`   - Deleting ${existingUsers.length} existing Auth users...`)
            for (const u of existingUsers) {
                const { error: delAuthErr } = await supabase.auth.admin.deleteUser(u.id)
                if (delAuthErr) console.error(`     Failed to delete user ${u.id}:`, delAuthErr.message)
            }
        } else {
            console.log("   - No Auth users to delete.")
        }

        // Institutions
        process.stdout.write("   - Deleting institutions... ")
        const { error: iDelError } = await supabase.from("institutions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        if (iDelError) console.log(`Error: ${iDelError.message}`)
        else console.log("Done.")
    } else {
        console.log("   ✅ Data cleaned via RPC.")
    }

    // 2. Create Institution
    console.log("🏫 Creating Institution...")
    // Using explicit UUID or letting DB generate it? DB generate is safer unless we need constant ID.
    const { data: instData, error: instError } = await supabase
        .from("institutions")
        .insert({
            name: "Ma'had Al-Fatih Bogor",
            code: "MAHAD-001",
            address: "Jl. Raya Puncak No. 123",
            email: "admin@alfatih.test",
            description: "Pesantren modern berbasis teknologi",
        })
        .select()
        .single()

    if (instError) {
        console.error("❌ Error creating institution:", JSON.stringify(instError, null, 2))
        throw instError
    }
    const institutionId = instData.id
    console.log(`   ✅ Institution created: ${institutionId}`)

    // 3. Create Users (Auth + Public)
    console.log("👥 Creating Users...")
    const createdUsers: Record<string, string> = {} // email -> id

    // 3a. Demo Users
    for (const cred of DEMO_USERS) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: cred.email,
            password: cred.password,
            email_confirm: true,
            user_metadata: { full_name: cred.name },
        })
        if (authError) {
            console.error(`   ❌ Failed to create Auth user ${cred.email}:`, authError.message)
            continue
        }

        const userId = authData.user.id
        createdUsers[cred.email] = userId

        // Update/Insert public user record
        const { error: userError } = await supabase.from("users").upsert({
            id: userId,
            email: cred.email,
            full_name: cred.name,
            role: cred.role, // Now lowercase
            institution_id: institutionId,
        })

        if (userError) {
            console.error(`   ❌ Error upserting public user ${cred.email}:`, userError.message)
            throw userError
        }
    }
    console.log("   ✅ Demo users created.")

    // 3b. Fake Gurus (20)
    const guruIds: string[] = [createdUsers["guru@tahfidz.test"]].filter(Boolean)
    console.log("   Generating 20 Gurus...")
    for (let i = 0; i < 20; i++) {
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()
        const email = faker.internet.email({ firstName, lastName }).toLowerCase()

        const { data: authData } = await supabase.auth.admin.createUser({
            email,
            password: "User123!",
            email_confirm: true,
            user_metadata: { full_name: `${firstName} ${lastName}` },
        })

        if (authData.user) {
            const uid = authData.user.id
            guruIds.push(uid)
            await supabase.from("users").upsert({
                id: uid,
                email,
                full_name: `Ustadz ${firstName} ${lastName}`,
                role: "guru", // Lowercase
                institution_id: institutionId,
            })
        }
    }

    // 3c. Fake Murids (200)
    const muridIds: string[] = [createdUsers["murid1@tahfidz.test"], createdUsers["murid2@tahfidz.test"]].filter(Boolean)

    console.log(`   Generating 200 Students...`)
    let muridCount = 0;

    for (let i = 0; i < 200; i++) {
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()
        const email = `santri${i + 1}@tahfidz.test`

        const { data: authData } = await supabase.auth.admin.createUser({
            email,
            password: "User123!",
            email_confirm: true,
            user_metadata: { full_name: `${firstName} ${lastName}` },
        })

        if (authData.user) {
            const uid = authData.user.id

            const { error: uParamsError } = await supabase.from("users").upsert({
                id: uid,
                email,
                full_name: `${firstName} ${lastName}`,
                role: "murid", // Lowercase
                institution_id: institutionId,
                phone: faker.phone.number(),
            })
            if (!uParamsError) {
                muridIds.push(uid)
                muridCount++;
            }
            else console.error(`     Error fake user public ${email}: ${uParamsError.message}`)
        }
        if (i % 20 === 0) process.stdout.write(".")
    }
    console.log(`\n   ✅ ${muridCount} Students created.`)


    // 4. Academic Structure
    console.log("📚 Creating Academic Structure...")

    // Semesters
    const { data: semData, error: semError } = await supabase.from("semesters").insert([
        { institution_id: institutionId, name: "Ganjil 2024/2025", start_date: "2024-07-01", end_date: "2024-12-31", is_active: false },
        { institution_id: institutionId, name: "Genap 2024/2025", start_date: "2025-01-01", end_date: "2025-06-30", is_active: true }
    ]).select()

    if (semError) {
        console.error("❌ Error creating semesters:", semError.message)
        throw semError
    }

    const activeSemesterId = semData?.find(s => s.is_active)?.id || semData?.[0]?.id

    // Evaluation Templates
    const { data: tmplData, error: tmplError } = await supabase.from("evaluation_templates").insert([
        { institution_id: institutionId, name: "Hafalan Ziyadah (Harian)", type: "tahfidz", description: "Setoran hafalan baru" },
        { institution_id: institutionId, name: "Murojaah (Pengulangan)", type: "tahfidz", description: "Setoran pengulangan" }
    ]).select()

    if (tmplError) {
        console.error("❌ Error creating templates:", tmplError.message)
        throw tmplError
    }
    const templateId = tmplData?.[0]?.id

    // Classes (50 classes)
    const classIds: string[] = []
    console.log("   Generating 50 Classes...")
    for (let i = 0; i < 50; i++) {
        const randomGuru = guruIds[Math.floor(Math.random() * guruIds.length)]
        if (!randomGuru) continue

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

    // 5. Enrollments & Activity
    console.log("📝 Generating Activity (Sessions & Evaluations)...")

    const levels = ["belum_hafal", "hafal_tidak_lancar", "hafal_lancar", "hafal_sangat_lancar"]
    let totalSessions = 0;
    let totalEvaluations = 0;

    for (const classId of classIds) {
        // Enroll random 10-20 students per class
        const classStudents = faker.helpers.arrayElements(muridIds, faker.number.int({ min: 10, max: 20 }))

        for (const studentId of classStudents) {
            await supabase.from("class_enrollments").insert({
                class_id: classId,
                user_id: studentId,
                joined_at: new Date().toISOString()
            })
        }

        // Create 15 sessions in the last 30 days
        for (let i = 0; i < 15; i++) {
            const sessionDate = faker.date.recent({ days: 30 })

            const { data: session, error: sessError } = await supabase.from("sessions").insert({
                class_id: classId,
                guru_id: guruIds[0],
                session_date: sessionDate.toISOString().split("T")[0],
                start_time: "07:00",
                end_time: "09:00",
                topic: "Setoran Rutin"
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

    console.log("\n✅ Seed Complete!")
    console.log("Stats:")
    console.log(`- Institutions: 1`)
    console.log(`- Users: ${1 + 20 + 200}`)
    console.log(`- Classes: ${classIds.length}`)
    console.log(`- Sessions: ${totalSessions}`)
    console.log(`- Evaluations: ${totalEvaluations}`)
}

seed().catch((e) => {
    console.error("UNKNOWN ERROR:", e)
    process.exit(1)
})
