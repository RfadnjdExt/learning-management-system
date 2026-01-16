
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

// ... imports ...

async function testEnrollmentAccess() {
    console.log("🕵️ Testing Enrollment Access for Abdullah...")

    // 1. Login as Abdullah
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: "abdullah@tahfidz.test",
        password: "Guru123456!"
    })

    if (loginError) {
        console.error("❌ Login Failed:", loginError.message)
        return
    }

    const guruId = session?.user.id
    console.log(`✅ Logged in as: ${guruId}`)

    // 2. Fetch Classes
    const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("guru_id", guruId)

    if (!classes || classes.length === 0) {
        console.log("❌ No classes found for this guru.")
        return
    }

    console.log(`✅ Found ${classes.length} classes:`)

    for (const cls of classes) {
        console.log(`   Class: ${cls.name} (${cls.id})`)

        // 3. Fetch Enrollments
        const { data: enrollments, error: enrollError } = await supabase
            .from("class_enrollments")
            .select("*, user:users(full_name)")
            .eq("class_id", cls.id)

        if (enrollError) {
            console.error(`      ❌ Error fetching enrollments: ${enrollError.message}`)
        } else {
            console.log(`      Found ${enrollments.length} enrollments.`)
            enrollments.forEach(e => console.log(`        - Student: ${e.user?.full_name || 'Unknown'} (${e.user_id})`))
        }
    }
}

testEnrollmentAccess()
