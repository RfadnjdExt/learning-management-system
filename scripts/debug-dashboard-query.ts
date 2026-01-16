
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

async function debugQuery() {
    console.log("🕵️ Debugging Dashboard Query (Data Inspection)...")

    const { data: { session } } = await supabase.auth.signInWithPassword({
        email: "guru@tahfidz.test",
        password: "Guru123456!"
    })

    const guruId = session?.user.id

    const { data, error } = await supabase
        .from("evaluations")
        .select("*, user:users!user_id(full_name), session:sessions(session_date)")
        .eq("evaluator_id", guruId)
        .limit(1)

    if (error) {
        console.error("❌ Query Error:", error.message)
    } else if (data.length > 0) {
        console.log("✅ Object Structure:", JSON.stringify(data[0], null, 2))

        if (!data[0].user) {
            console.log("⚠️ Student data is missing. Checking RLS for 'users' table...")
            // Try to fetch the student directly
            const studentId = data[0].user_id
            const { data: student, error: studentError } = await supabase.from("users").select("*").eq("id", studentId).single()

            if (studentError) console.log("❌ Cannot fetch student directly:", studentError.message)
            else console.log("✅ Can fetch student directly:", student.full_name)
        }
    }
}

debugQuery()
