
import { createClient } from "@supabase/supabase-js"
import { fakerID_ID as faker } from "@faker-js/faker"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_EMAILS = [
    "admin@tahfidz.test",
    "guru@tahfidz.test",
    "murid1@tahfidz.test",
    "murid2@tahfidz.test"
]

async function refineDemoData() {
    console.log("🧹 Starting Demo Refinement (STRICT ENUMS)...")

    // 1. Fetch Demo Users
    const { data: demoUsers } = await supabase.from("users").select("*").in("email", DEMO_EMAILS)

    if (!demoUsers || demoUsers.length === 0) {
        console.error("❌ No demo users found!")
        return
    }
    console.log(`✅ Found ${demoUsers.length} Demo Users.`)

    // 2. Wipe
    console.log("🔥 Burning non-demo data...")
    await supabase.from("evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("class_enrollments").delete().neq("user_id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    const demoIds = demoUsers.map(u => u.id)
    await supabase.from("users").delete().not("id", "in", `(${demoIds.join(',')})`)
    console.log("   ✅ Data wiped.")

    // 3. Seed
    console.log("🌱 Seeding Activity...")

    const guru = demoUsers.find(u => u.email === "guru@tahfidz.test")
    const murids = demoUsers.filter(u => u.email.startsWith("murid"))

    if (!guru || murids.length === 0) return

    const { data: sem } = await supabase.from("semesters").select("id").eq("is_active", true).single()
    const { data: tmpl } = await supabase.from("evaluation_templates").select("id").limit(1).single()

    if (!sem) { console.error("❌ No active semester!"); return; }
    if (!tmpl) { console.error("❌ No evaluation template!"); return; }

    const classesToMake = ["Halaqah Pagi", "Halaqah Sore", "Kelas Tahsin Ekstra"]
    for (const cName of classesToMake) {
        const { data: cls, error: clsError } = await supabase.from("classes").insert({
            institution_id: guru.institution_id,
            semester_id: sem.id,
            guru_id: guru.id,
            name: cName,
            description: "Kelas khusus akun demo"
        }).select().single()

        if (clsError) console.error("❌ Class Error:", clsError.message)

        if (cls) {
            // Enroll
            for (const m of murids) {
                await supabase.from("class_enrollments").insert({ class_id: cls.id, user_id: m.id })
            }

            // --- MANUAL UNIQUE DATA ---
            // VALID ENUMS ONLY: 'belum_hafal', 'hafal_tidak_lancar', 'hafal_lancar', 'hafal_sangat_lancar'
            const demoData = [
                {
                    note: "Hafalan hari ini sangat lancar, Mumtaz! Pertahankan semangatnya.",
                    hLevel: 'hafal_sangat_lancar',
                    tLevel: 'hafal_sangat_lancar'
                },
                {
                    note: "Ada sedikit kesalahan makhraj di ayat 15-20, mohon diperbaiki di rumah.",
                    hLevel: 'hafal_lancar',
                    tLevel: 'hafal_tidak_lancar'
                },
                {
                    note: "Irama setoran terlalu cepat, harap lebih tartil dan tenang.",
                    hLevel: 'hafal_lancar',
                    tLevel: 'hafal_lancar'
                },
                {
                    note: "Banyak lupa di halaman terakhir, perlu murojaah (pengulangan) lebih intens.",
                    hLevel: 'hafal_tidak_lancar', // Mapped from 'banyak_lupa'
                    tLevel: 'hafal_lancar'
                },
                {
                    note: "Bacaan sudah cukup baik, tapi perhatikan panjang pendek mad.",
                    hLevel: 'hafal_tidak_lancar',
                    tLevel: 'hafal_lancar'
                }
            ]

            for (let i = 0; i < 5; i++) {
                const { data: sess, error: sessError } = await supabase.from("sessions").insert({
                    class_id: cls.id,
                    guru_id: guru.id,
                    session_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                    notes: `Sesi Halaqah ke-${5 - i}`
                }).select().single()

                if (sessError) console.error("❌ Session Error:", sessError.message)

                if (sess) {
                    for (const m of murids) {
                        const dataPoint = demoData[i] || demoData[0]

                        const { error: evalError } = await supabase.from("evaluations").insert({
                            session_id: sess.id,
                            user_id: m.id,
                            evaluator_id: guru.id,
                            template_id: tmpl.id,
                            tajweed_level: dataPoint.tLevel,
                            hafalan_level: dataPoint.hLevel,
                            tartil_level: 'hafal_lancar',
                            additional_notes: dataPoint.note
                        })
                        if (evalError) console.error("❌ Eval Error:", evalError.message)
                    }
                }
            }
        }
    }

    console.log("✅ Unique Data Seed Complete.")
}

refineDemoData()
