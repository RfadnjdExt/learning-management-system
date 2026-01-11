
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
    console.log("🧹 Starting Demo Refinement (Randomized)...")

    // 1. Fetch Demo Users
    const { data: demoUsers } = await supabase.from("users").select("*").in("email", DEMO_EMAILS)

    if (!demoUsers || demoUsers.length === 0) {
        console.error("❌ No demo users found! Run seed-big-data.ts first?")
        return
    }
    console.log(`✅ Found ${demoUsers.length} Demo Users.`)

    // 2. Update Demo Profiles 
    console.log("📝 Updating Demo Profiles...")
    for (const user of demoUsers) {
        const updates: any = {
            phone: faker.phone.number(),
            address: `${faker.location.street()}, ${faker.location.city()}`
        }

        // Force Ahmad Santri name if needed, but let's stick to random phone/addr
        const { error } = await supabase.from("users").update(updates).eq("id", user.id)
        if (!error) console.log(`   ✅ Updated ${user.email}`)
    }

    // 3. Wipe Non-Demo Data
    console.log("🔥 Burning non-demo data...")

    await supabase.from("evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("class_enrollments").delete().neq("user_id", "00000000-0000-0000-0000-000000000000")
    await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    // Wipe Non-Demo Users
    const demoIds = demoUsers.map(u => u.id)
    const { error: delUserError } = await supabase.from("users").delete().not("id", "in", `(${demoIds.join(',')})`)
    if (delUserError) console.error("Error deleting users:", delUserError.message)
    else console.log("   ✅ Non-demo users deleted.")

    // 4. Seed Targeted Demo Activity
    console.log("🌱 Seeding Random Demo Activity...")

    const guru = demoUsers.find(u => u.email === "guru@tahfidz.test")
    const murids = demoUsers.filter(u => u.email.startsWith("murid"))
    const admin = demoUsers.find(u => u.email === "admin@tahfidz.test")

    if (!guru || murids.length === 0) return

    // Get Sem/Template
    const { data: sem } = await supabase.from("semesters").select("id").eq("is_active", true).single()
    const { data: tmpl } = await supabase.from("evaluation_templates").select("id").limit(1).single()

    if (!sem || !tmpl) return

    // Create 3 Classes
    const classesToMake = ["Halaqah Pagi", "Halaqah Sore", "Kelas Tahsin Ekstra"]
    for (const cName of classesToMake) {
        const { data: cls } = await supabase.from("classes").insert({
            institution_id: guru.institution_id,
            semester_id: sem.id,
            guru_id: guru.id,
            name: cName,
            description: "Kelas khusus akun demo"
        }).select().single()

        if (cls) {
            // Enroll Murids
            for (const m of murids) {
                await supabase.from("class_enrollments").insert({
                    class_id: cls.id,
                    user_id: m.id
                })
            }

            // Create Sessions/Evals (History)
            for (let i = 0; i < 5; i++) {
                const { data: sess } = await supabase.from("sessions").insert({
                    class_id: cls.id,
                    guru_id: guru.id,
                    session_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                    notes: faker.lorem.sentence()
                }).select().single()

                if (sess) {
                    for (const m of murids) {
                        await supabase.from("evaluations").insert({
                            session_id: sess.id,
                            user_id: m.id,
                            evaluator_id: guru.id,
                            template_id: tmpl.id,
                            // Randomize!
                            tajweed_level: faker.helpers.arrayElement(['hafal_lancar', 'lancar_sebagian', 'perlu_perbaikan']),
                            hafalan_level: faker.helpers.arrayElement(['hafal_lancar', 'banyak_lupa', 'perlu_murojaah']),
                            tartil_level: faker.helpers.arrayElement(['baik', 'cukup', 'kurang']),
                            additional_notes: faker.helpers.arrayElement([
                                "Bacaan sudah bagus, pertahankan.",
                                "Makhraj huruf perlu diperbaiki lagi.",
                                "Hafalan agak tersendat di ayat-ayat akhir.",
                                "Perbanyak murojaah di rumah.",
                                "Sangat lancar hari ini, masyaAllah.",
                                "Fokus pada panjang pendek mad.",
                                "Jangan terburu-buru saat setoran."
                            ])
                        })
                    }
                }
            }
        }
    }

    console.log("✅ Random Demo Data Seeded!")
}

refineDemoData()
