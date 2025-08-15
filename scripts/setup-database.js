const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const connectionTest = await sql`SELECT current_database(), current_user, version()`;
    console.log('✅ Connected to database:', connectionTest.rows[0].current_database);
    console.log('👤 User:', connectionTest.rows[0].current_user);
    
    // Check existing tables
    console.log('\n🔍 Checking existing tables...');
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // Create users table if it doesn't exist
    console.log('\n🛠️  Creating/updating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone_number VARCHAR(50),
        date_of_birth VARCHAR(50),
        address_line_1 VARCHAR(255),
        address_line_2 VARCHAR(255),
        city VARCHAR(100),
        county VARCHAR(100),
        eircode VARCHAR(20),
        onboarding_status VARCHAR(50) DEFAULT 'not_started',
        onboarding_current_step VARCHAR(50) DEFAULT 'personal_info',
        onboarding_completed_at TIMESTAMP,
        personal_info_completed BOOLEAN DEFAULT false,
        personal_info_completed_at TIMESTAMP,
        signature_completed BOOLEAN DEFAULT false,
        signature_completed_at TIMESTAMP,
        legal_consent_completed BOOLEAN DEFAULT false,
        legal_consent_completed_at TIMESTAMP,
        legal_consents JSONB,
        verification_completed BOOLEAN DEFAULT false,
        verification_completed_at TIMESTAMP,
        verification_session_id VARCHAR(255),
        verification_status VARCHAR(50),
        auth_provider VARCHAR(50),
        auth_provider_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create refresh_tokens table
    console.log('🛠️  Creating refresh_tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        token_hash TEXT NOT NULL,
        family UUID NOT NULL,
        revoked BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create signatures table
    console.log('🛠️  Creating signatures table...');
    await sql`
      CREATE TABLE IF NOT EXISTS signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        signature_type VARCHAR(50) NOT NULL,
        data TEXT NOT NULL,
        hash VARCHAR(255) NOT NULL,
        signature_metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP
      )
    `;
    
    // Create other tables as needed
    console.log('🛠️  Creating remaining tables...');
    
    // Assets table
    await sql`
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        asset_type VARCHAR(100) NOT NULL,
        value REAL NOT NULL DEFAULT 0,
        description TEXT,
        account_number VARCHAR(255),
        bank_name VARCHAR(255),
        property_address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Beneficiaries table
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        relationship_type VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address_line_1 VARCHAR(255),
        address_line_2 VARCHAR(255),
        city VARCHAR(100),
        county VARCHAR(100),
        eircode VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Ireland',
        percentage REAL,
        specific_assets JSONB,
        conditions TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log('\n✅ Database setup completed successfully!');
    
    // Show final table list
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Final tables:', finalTables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();