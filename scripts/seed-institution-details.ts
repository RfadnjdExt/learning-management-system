
import { createClient } from "@supabase/supabase-js"
import { fakerID_ID as faker } from "@faker-js/faker"
import * as dotenv from "dotenv"
import path from "path"

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Env vars missing.")
    process.exit(1)
}

// Service Role client to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function seedInstitutionDetails() {
    console.log("🏢 Seeding Institution Details...")

    // 1. Get the institution (assuming the first one found is the target)
    const { data: instData, error: findError } = await supabase
        .from("institutions")
        .select("id")
        .limit(1)
        .single()

    if (findError || !instData) {
        console.error("❌ Institution not found:", findError?.message)
        return
    }

    const institutionId = instData.id
    console.log(`   Target Institution: ${institutionId}`)

    // 2. Generate Dummy Data
    const dummyData = {
        phone: faker.phone.number(), // e.g. 0812...
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
        email: "admin@tahfidz.test", // Match the admin email for consistency
        description: "Lembaga Tahfidz Al-Qur'an dengan metode modern yang berfokus pada kualitas hafalan dan akhlaq santri."
    }

    console.log("   Data to update:", dummyData)

    // 3. Update
    const { error: updateError } = await supabase
        .from("institutions")
        .update(dummyData)
        .eq("id", institutionId)

    if (updateError) {
        console.error("❌ Update Failed:", updateError.message)
    } else {
        console.log("✅ Update Success! Refresh the Settings page.")
    }
}

seedInstitutionDetails()
