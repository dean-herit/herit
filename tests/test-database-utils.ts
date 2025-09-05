/**
 * Centralized Test Database Utilities
 * Provides consistent database access patterns for all backend tests
 * Uses real PostgreSQL database connection in dev environment
 */

import { db } from '@/db/db';
import { users, assets, beneficiaries, assetDocuments, wills, inheritanceRules, signatures } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { beforeAll } from 'vitest';
import { randomUUID } from 'crypto';

export class TestDatabaseUtils {
  /**
   * Get database connection (real PostgreSQL in dev)
   */
  static getDb() {
    return db;
  }

  /**
   * Test User Management
   */
  static async createTestUser(userData: {
    email: string;
    first_name: string;
    last_name: string;
    onboarding_completed?: boolean;
    personal_info_completed?: boolean;
    signature_completed?: boolean;
    legal_consent_completed?: boolean;
    verification_completed?: boolean;
    verification_status?: string;
  }) {
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      // Note: onboarding_completed is a generated column, cannot be inserted directly
      personal_info_completed: userData.personal_info_completed ?? true,
      signature_completed: userData.signature_completed ?? true,
      legal_consent_completed: userData.legal_consent_completed ?? true,
      verification_completed: userData.verification_completed ?? true,
      verification_status: userData.verification_status ?? 'verified',
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return user;
  }

  static async findTestUser(email: string) {
    return await db.query.users.findFirst({
      where: eq(users.email, email)
    });
  }

  static async cleanupTestUser(userId: string) {
    // Clean up in reverse dependency order
    // Note: assetDocuments cleanup skipped - they're linked by user_email, not user_id
    await db.delete(wills).where(eq(wills.user_id, userId));
    await db.delete(beneficiaries).where(eq(beneficiaries.user_id, userId));
    await db.delete(assets).where(eq(assets.user_id, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  /**
   * Test Asset Management
   */
  static async createTestAsset(userId: string, assetData?: Partial<any>) {
    const [asset] = await db.insert(assets).values({
      id: randomUUID(),
      user_id: userId,
      name: assetData?.name ?? 'Test Asset',
      description: assetData?.description ?? 'Test asset description',
      asset_type: assetData?.asset_type ?? 'property',
      value: assetData?.value ?? 100000,
      status: assetData?.status ?? 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...assetData,
    }).returning();
    
    return asset;
  }

  /**
   * Test Beneficiary Management
   */
  static async createTestBeneficiary(userId: string, beneficiaryData?: Partial<any>) {
    const [beneficiary] = await db.insert(beneficiaries).values({
      id: randomUUID(),
      user_id: userId,
      name: beneficiaryData?.name ?? 'Test Beneficiary',
      relationship_type: beneficiaryData?.relationship_type ?? 'Child',
      email: beneficiaryData?.email ?? 'testbeneficiary@example.com',
      phone: beneficiaryData?.phone ?? '+1234567890',
      created_at: new Date(),
      updated_at: new Date(),
      ...beneficiaryData,
    }).returning();
    
    return beneficiary;
  }

  /**
   * Test Will Management
   */
  static async createTestWill(userId: string, willData?: Partial<any>) {
    const [will] = await db.insert(wills).values({
      id: randomUUID(),
      user_id: userId,
      title: willData?.title ?? 'Test Will',
      will_type: willData?.will_type ?? 'simple',
      status: willData?.status ?? 'draft',
      content: willData?.content ?? 'Test will content',
      created_at: new Date(),
      updated_at: new Date(),
      ...willData,
    }).returning();
    
    return will;
  }

  /**
   * Test Rule Management
   */
  static async createTestRule(userId: string, ruleData?: Partial<any>) {
    const [rule] = await db.insert(inheritanceRules).values({
      id: randomUUID(),
      user_id: userId,
      name: ruleData?.name ?? 'Test Rule',
      description: ruleData?.description ?? 'Test rule for age verification',
      rule_definition: ruleData?.rule_definition ?? {
        conditions: [
          {
            fact: 'beneficiary-age',
            operator: 'greaterThan',
            value: 18
          }
        ],
        event: {
          type: 'age-verified',
          params: { message: 'Beneficiary is of legal age' }
        }
      },
      priority: ruleData?.priority ?? 1,
      is_active: ruleData?.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
      ...ruleData,
    }).returning();
    
    return rule;
  }

  /**
   * Test Environment Validation
   */
  static validateTestEnvironment() {
    // Allow test environment or dev environment for shared dev database
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv !== 'test' && nodeEnv !== 'development' && nodeEnv !== undefined) {
      throw new Error(`TestDatabaseUtils should only be used in test/development environment, got: ${nodeEnv}`);
    }
    
    // Ensure we're not accidentally hitting production database
    const dbUrl = process.env.POSTGRES_URL || '';
    if (dbUrl.includes('prod') || dbUrl.includes('production')) {
      throw new Error('TestDatabaseUtils detected production database URL - refusing to proceed');
    }
  }

  /**
   * Test Data Factory Methods
   */
  static createMockUserData(overrides: any = {}) {
    return {
      email: `test-${Date.now()}@example.com`,
      first_name: 'Test',
      last_name: 'User',
      onboarding_completed: true,
      personal_info_completed: true,
      signature_completed: true,
      legal_consent_completed: true,
      verification_completed: true,
      verification_status: 'verified',
      ...overrides,
    };
  }

  static createMockAssetData(overrides: any = {}) {
    return {
      name: 'Test Asset',
      description: 'Test asset description',
      asset_type: 'property',
      value: 100000,
      status: 'active',
      ...overrides,
    };
  }

  static createMockBeneficiaryData(overrides: any = {}) {
    return {
      name: 'Test Beneficiary',
      relationship_type: 'Child',
      email: 'testbeneficiary@example.com',
      phone: '+1234567890',
      ...overrides,
    };
  }

  /**
   * Batch Asset Creation for Testing
   */
  static async createMockAssets(assetsData: Array<any>, userId?: string) {
    const results = [];
    for (const assetData of assetsData) {
      // Ensure user_id is set
      const finalUserId = userId || assetData.user_id;
      if (!finalUserId) {
        throw new Error('user_id is required for creating test assets');
      }
      
      const asset = await this.createTestAsset(finalUserId, assetData);
      results.push(asset);
    }
    return results;
  }

  /**
   * Create test signature for testing signature-dependent endpoints
   */
  static async createTestSignature(userId: string, signatureData: any = {}) {
    const [signature] = await db.insert(signatures).values({
      id: randomUUID(),
      user_id: userId,
      name: signatureData.name || 'Test Signature',
      signature_type: signatureData.signature_type || 'digital',
      data: signatureData.data || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIi8+', // minimal SVG
      hash: signatureData.hash || 'test-hash-' + Date.now(),
      created_at: new Date(),
      updated_at: new Date(),
      ...signatureData,
    }).returning();
    
    return signature;
  }

  /**
   * Test Cleanup Utilities
   */
  static async cleanupAllTestData() {
    // Only allow in test environment
    this.validateTestEnvironment();
    
    // Clean up test data (identified by test- prefixes)  
    await db.delete(beneficiaries).where(eq(beneficiaries.name, 'test-%'));
    await db.delete(assets).where(eq(assets.name, 'test-%'));
    await db.delete(users).where(eq(users.email, 'test-%'));
  }

  /**
   * Database Health Check
   */
  static async checkDatabaseConnection() {
    try {
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}

/**
 * Test Setup Hook - automatically validates environment
 */
export function setupTestDatabase() {
  // Validate environment before any database operations
  TestDatabaseUtils.validateTestEnvironment();
  
  // TODO: Re-enable database connection check once networking issues are resolved
  // For now, tests will attempt database operations and fail gracefully if connection issues occur
  
  // beforeAll(async () => {
  //   const isConnected = await TestDatabaseUtils.checkDatabaseConnection();
  //   if (!isConnected) {
  //     throw new Error('Database connection failed - cannot run tests');
  //   }
  // });
}