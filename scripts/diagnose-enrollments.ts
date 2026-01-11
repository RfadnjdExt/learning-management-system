
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testEnrollmentAccess() {
    console.log("🕵️ Testing Enrollment Access...")

    // 1. Login
    const { data: { session } } = await supabase.auth.signInWithPassword({
        email: "guru@tahfidz.test",
        password: "Guru123456!"
    })

    const guruId = session?.user.id
    console.log(`   Guru ID: ${guruId}`)

    // 2. Fetch Classes with Enrollment Count
    const { data: classes, error } = await supabase
        .from("classes")
        .select("name, enrollments:class_enrollments(count)")
        .eq("guru_id", guruId)

    if (error) {
        console.log("❌ Query Error:", error.message)
    } else {
        console.log(`✅ Found ${classes.length} classes.`)
        classes.forEach(c => {
            // @ts-ignore
            console.log(`   - ${c.name}: ${c.enrollments?.[0]?.count || 0} students`)
        })
    }

    // 3. Try to read enrollments directly
    const { count } = await supabase.from("class_enrollments").select("*", { count: 'exact', head: true })
    console.log(`   Total Enrollments visible to Guru directly: ${count}`)
}

testEnrollmentAccess()
