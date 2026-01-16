import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("--- Supabase Connectivity Debugger ---")
console.log(`URL: ${supabaseUrl}`)
console.log(`Key Provided: ${!!supabaseKey}`)

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Environment Variables!")
    process.exit(1)
}

async function testConnection() {
    console.log("\n1. Testing basic fetch to REST endpoint...")
    const start = Date.now()
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey}`
            }
        })
        const duration = Date.now() - start
        console.log(`   Status: ${response.status} ${response.statusText}`)
        console.log(`   Time: ${duration}ms`)

        if (response.ok) {
            console.log("   ✅ REST Endpoint Reachable")
        } else {
            console.error("   ❌ REST Endpoint returned error")
            const text = await response.text()
            console.log("   Response:", text)
        }

    } catch (err: any) {
        const duration = Date.now() - start
        console.error(`   ❌ Fetch Failed after ${duration}ms`)
        console.error(`   Error: ${err.message}`)
        if (err.cause) console.error("   Cause:", err.cause)
    }

    console.log("\n2. Testing Supabase JS Client...")
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const startClient = Date.now()
    const { data, error } = await supabase.from('institutions').select('count', { count: 'exact', head: true })
    const durationClient = Date.now() - startClient

    if (error) {
        console.error(`   ❌ Client Error (${durationClient}ms):`, error.message)
    } else {
        console.log(`   ✅ Client Success (${durationClient}ms). Count available.`)
    }
}

testConnection()
