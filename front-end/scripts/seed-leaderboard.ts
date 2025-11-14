/**
 * Seed Leaderboard Script
 * 
 * Populates the leaderboard with test data for demonstration purposes.
 * 
 * Usage:
 *   NUXT_SUPABASE_URL=... NUXT_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/seed-leaderboard.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NUXT_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NUXT_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testStudents = [
  { email: "ananya@test.com", name: "Ananya Sharma", xp: 2410 },
  { email: "rohan@test.com", name: "Rohan Kapoor", xp: 2125 },
  { email: "neha@test.com", name: "Neha Patel", xp: 1960 },
  { email: "arjun@test.com", name: "Arjun Malhotra", xp: 1875 },
  { email: "sara@test.com", name: "Sara Varma", xp: 1790 },
  { email: "navin@test.com", name: "Navin R.", xp: 1720 },
];

async function seedLeaderboard() {
  console.log("🌱 Starting leaderboard seed...");

  // 1. Get or create current season
  let { data: season, error: seasonError } = await supabase
    .from("leaderboard_seasons")
    .select("*")
    .is("ends_at", null)
    .single();

  if (seasonError || !season) {
    console.log("📅 Creating new leaderboard season...");
    const { data: newSeason, error: createError } = await supabase
      .from("leaderboard_seasons")
      .insert({
        name: "Season 1 - 2025",
        starts_at: new Date().toISOString(),
        ends_at: null,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Failed to create season:", createError);
      process.exit(1);
    }

    season = newSeason;
    console.log("✅ Season created:", season.name);
  } else {
    console.log("✅ Using existing season:", season.name);
  }

  // 2. Create or update test students
  console.log("\n👥 Creating test students...");
  for (const student of testStudents) {
    // Check if user exists
    let { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("display_name", student.name)
      .single();

    let userId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
      console.log(`   ♻️  ${student.name} already exists`);

      // Update XP
      await supabase
        .from("profiles")
        .update({ xp_total: student.xp })
        .eq("user_id", userId);
    } else {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: student.email,
        password: "Test123!",
        email_confirm: true,
        user_metadata: {
          display_name: student.name,
        },
      });

      if (authError || !authData.user) {
        console.error(`   ❌ Failed to create ${student.name}:`, authError);
        continue;
      }

      userId = authData.user.id;

      // Create profile
      await supabase.from("profiles").insert({
        user_id: userId,
        display_name: student.name,
        xp_total: student.xp,
      });

      console.log(`   ✅ Created ${student.name}`);
    }
  }

  // 3. Update leaderboard rankings
  console.log("\n🏆 Updating leaderboard rankings...");
  
  // Get all profiles with XP
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, xp_total")
    .order("xp_total", { ascending: false });

  if (!profiles || profiles.length === 0) {
    console.log("⚠️  No profiles found to rank");
    return;
  }

  // Clear existing entries for this season
  await supabase
    .from("season_leaderboard_entries")
    .delete()
    .eq("season_id", season.id);

  // Insert new entries
  const entries = profiles.map((profile, index) => ({
    season_id: season.id,
    user_id: profile.user_id,
    rank: index + 1,
    xp_total: profile.xp_total || 0,
  }));

  const { error: insertError } = await supabase
    .from("season_leaderboard_entries")
    .insert(entries);

  if (insertError) {
    console.error("❌ Failed to update leaderboard:", insertError);
    process.exit(1);
  }

  console.log(`✅ Leaderboard updated with ${entries.length} entries`);

  console.log("\n🎉 Leaderboard seeding complete!");
  console.log("\nTest Student Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  testStudents.forEach((student) => {
    console.log(`  Email: ${student.email}`);
    console.log(`  Password: Test123!`);
    console.log(`  Name: ${student.name}`);
    console.log(`  XP: ${student.xp}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  });
}

seedLeaderboard().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

