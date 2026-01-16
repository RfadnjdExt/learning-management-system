import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

console.log("Testing Supabase Login...");

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing environment variables!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

const credentials = [
    { email: "admin@tahfidz.test", password: "Admin123456!", role: "admin" },
    { email: "guru@tahfidz.test", password: "Guru123456!", role: "guru" },
];

async function testLogin() {
    if (!adminSupabase) {
        console.error("❌ Service Role Key missing. Cannot fix accounts.");
        return;
    }

    // 0. Ensure Institution Exists
    let institutionId: string | null = null;
    console.log(`\nChecking for Institution...`);
    const { data: instData } = await adminSupabase
        .from('institutions')
        .select('id')
        .limit(1)
        .single();

    if (instData) {
        institutionId = instData.id;
        console.log(`   ✅ Found Institution ID: ${institutionId}`);
    } else {
        console.warn(`   ⚠️ No institution found in DB. You MUST run scripts/02_seed_test_data.sql first!`);
        // Warning only, continue to try login
    }

    for (const cred of credentials) {
        console.log(`\n-----------------------------------`);
        console.log(`Processing ${cred.email}...`);

        // 1. Check DB Record (The Source of Truth for IDs)
        let targetId: string | null = null;
        const { data: dbUser } = await adminSupabase
            .from('users')
            .select('id')
            .eq('email', cred.email)
            .single();

        if (dbUser) {
            targetId = dbUser.id;
            console.log(`   ✅ Found existing DB Record. Required ID: ${targetId}`);
        } else {
            console.log(`   🔸 No DB Record found.`);
        }

        // 2. Check Auth User
        const { data: authData } = await adminSupabase.auth.admin.listUsers();
        // Filter locally because listUsers doesn't support filter by email easily in all versions without params
        const authUser = authData.users.find(u => u.email === cred.email);

        if (authUser) {
            console.log(`   ✅ Found Auth User: ${authUser.id}`);

            // CHECK MISMATCH
            if (targetId && authUser.id !== targetId) {
                console.log(`   ⚠️ ID MISMATCH DETECTED!`);
                console.log(`      Auth ID: ${authUser.id}`);
                console.log(`      DB ID:   ${targetId}`);
                console.log(`   🛠  Fixing: Deleting Auth user and recreating with DB ID...`);

                await adminSupabase.auth.admin.deleteUser(authUser.id);

                const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
                    email: cred.email,
                    password: cred.password,
                    email_confirm: true,
                    user_metadata: { sub: targetId },
                    id: targetId // FORCE ID
                } as any);

                if (createError) {
                    console.error(`   ❌ Failed to recreate Auth user: ${createError.message}`);
                    continue;
                }
                console.log(`   ✅ Recreated Auth User with ID: ${createData.user.id}`);
            } else {
                console.log(`   ✅ IDs match (or no DB expectation). Updating password to ensure access...`);
                await adminSupabase.auth.admin.updateUserById(authUser.id, { password: cred.password });
            }
        } else {
            console.log(`   🔸 Auth User missing. Creating...`);
            const createParams: any = {
                email: cred.email,
                password: cred.password,
                email_confirm: true
            };
            if (targetId) {
                console.log(`      Using DB ID: ${targetId}`);
                createParams.id = targetId;
            }

            const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser(createParams);

            if (createError) {
                console.error(`   ❌ Failed to create user: ${createError.message}`);
                continue;
            }
            console.log(`   ✅ Created Auth User: ${createData.user.id}`);
        }
    }
}

testLogin();
