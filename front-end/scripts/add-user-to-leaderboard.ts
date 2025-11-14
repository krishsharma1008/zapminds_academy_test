/**
 * Add specific user to leaderboard
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NUXT_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUserToLeaderboard() {
  console.log("🔍 Looking for user: Krish Sharma...");

  // Find the user
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, xp_total")
    .ilike("display_name", "%krish%sharma%")
    .single();

  if (!profile) {
    console.log("❌ User not found. Creating profile...");
    
    // Check if auth user exists
    const { data: authData } = await supabase.auth.admin.listUsers();
    const krishUser = authData.users.find(u => 
      u.email?.toLowerCase().includes("krish") || 
      u.user_metadata?.display_name?.toLowerCase().includes("krish")
    );

    if (!krishUser) {
      console.log("❌ No auth user found for Krish Sharma");
      return;
    }

    console.log("✅ Found auth user:", krishUser.email);
    
    // Create or update profile
    await supabase.from("profiles").upsert({
      user_id: krishUser.id,
      display_name: "Krish Sharma",
      xp_total: 0,
    });

    console.log("✅ Created profile for Krish Sharma");
  } else {
    console.log("✅ Found user:", profile.display_name, "with XP:", profile.xp_total);
  }

  // Get or create season
  let { data: season } = await supabase
    .from("leaderboard_seasons")
    .select("*")
    .is("ends_at", null)
    .single();

  if (!season) {
    console.log("❌ No active season found");
    return;
  }

  console.log("✅ Using season:", season.name);

  // Update leaderboard
  console.log("🏆 Updating leaderboard...");
  
  // Get all profiles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("user_id, xp_total")
    .order("xp_total", { ascending: false });

  if (!allProfiles) {
    console.log("❌ Failed to fetch profiles");
    return;
  }

  // Clear existing entries
  await supabase
    .from("season_leaderboard_entries")
    .delete()
    .eq("season_id", season.id);

  // Insert all entries with proper ranking
  const entries = allProfiles.map((p, index) => ({
    season_id: season.id,
    user_id: p.user_id,
    rank: index + 1,
    xp_total: p.xp_total || 0,
  }));

  await supabase
    .from("season_leaderboard_entries")
    .insert(entries);

  console.log(`✅ Updated leaderboard with ${entries.length} entries`);
  console.log("\n🎉 Done! Krish Sharma should now appear on the leaderboard.");
}

addUserToLeaderboard().catch(console.error);

