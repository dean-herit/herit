import postgres from "postgres";
import { env } from "../../lib/env";

const sql = postgres(env.POSTGRES_URL, { max: 1 });

export const seed = async (data: any) => {
  // Seed test user
  if (data.user) {
    await sql`
      INSERT INTO app_users (email, password_hash, onboarding_completed)
      VALUES (${data.user.email}, ${"test_hash"}, ${data.user.onboarding_completed})
      ON CONFLICT (email) DO UPDATE SET
        onboarding_completed = ${data.user.onboarding_completed}
    `;
  }

  // Seed test assets
  if (data.assets) {
    for (const asset of data.assets) {
      await sql`
        INSERT INTO assets (user_id, name, type, value, metadata)
        SELECT id, ${asset.name}, ${asset.type}, ${asset.value}, ${JSON.stringify(asset.metadata)}
        FROM app_users WHERE email = ${data.user.email}
        ON CONFLICT (user_id, name) DO UPDATE SET
          value = ${asset.value},
          metadata = ${JSON.stringify(asset.metadata)}
      `;
    }
  }

  // Seed test beneficiaries
  if (data.beneficiaries) {
    for (const beneficiary of data.beneficiaries) {
      await sql`
        INSERT INTO beneficiaries (user_id, name, relationship, allocation_percentage)
        SELECT id, ${beneficiary.name}, ${beneficiary.relationship}, ${beneficiary.allocation}
        FROM app_users WHERE email = ${data.user.email}
        ON CONFLICT (user_id, name) DO UPDATE SET
          allocation_percentage = ${beneficiary.allocation}
      `;
    }
  }

  return null;
};

export const clean = async () => {
  // Clean test data (preserve audit logs for compliance)
  await sql`DELETE FROM beneficiaries WHERE user_id IN (
    SELECT id FROM app_users WHERE email LIKE '%@test.com'
  )`;
  await sql`DELETE FROM assets WHERE user_id IN (
    SELECT id FROM app_users WHERE email LIKE '%@test.com'
  )`;
  await sql`DELETE FROM app_users WHERE email LIKE '%@test.com'`;
  return null;
};

export const verifyAudit = async (action: string) => {
  const audit = await sql`
    SELECT * FROM audit_events 
    WHERE action = ${action} 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  return audit[0] || null;
};

export const getUserAssets = async (email: string) => {
  const assets = await sql`
    SELECT a.* FROM assets a
    JOIN app_users u ON a.user_id = u.id
    WHERE u.email = ${email}
    ORDER BY a.created_at DESC
  `;
  return assets;
};

export const getUserBeneficiaries = async (email: string) => {
  const beneficiaries = await sql`
    SELECT b.* FROM beneficiaries b
    JOIN app_users u ON b.user_id = u.id
    WHERE u.email = ${email}
    ORDER BY b.created_at DESC
  `;
  return beneficiaries;
};
