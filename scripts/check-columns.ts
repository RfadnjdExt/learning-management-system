
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkColumns() {
    console.log("🔍 Checking Users Columns...")

    const { data, error } = await supabase.from("users").select("*").limit(1)

    if (error) {
        console.log("Error:", error.message)
    } else if (data && data.length > 0) {
        console.log("Keys found:", Object.keys(data[0]))
        console.log("Data sample:", data[0])
    } else {
        console.log("No data found to check keys.")
    }
}

checkColumns()
