const { drizzle } = require("drizzle-orm/neon-http");
const { neon } = require("@neondatabase/serverless");
const { users } = require("./db/schema.ts");
const { eq } = require("drizzle-orm");

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function fixVerification() {
  try {
    console.log(
      "Updating verification status for claude.assistant@example.com...",
    );

    const result = await db
      .update(users)
      .set({
        verification_completed: true,
        onboarding_completed: true,
        onboardingStatus: "completed",
      })
      .where(eq(users.email, "claude.assistant@example.com"))
      .returning();

    console.log("✅ User verification status updated successfully");
    console.log("Updated user data:", {
      id: result[0].id,
      email: result[0].email,
      verification_completed: result[0].verification_completed,
      onboarding_completed: result[0].onboarding_completed,
      onboardingStatus: result[0].onboardingStatus,
    });
  } catch (error) {
    console.error("❌ Database update failed:", error.message);
  }
}

fixVerification();
