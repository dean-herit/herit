/**
 * OAuth Pre-population Integration Tests
 * Comprehensive test suite for validating OAuth form pre-population functionality
 * with audit logging, performance metrics, and compliance validation
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { users, auditEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  setAuthCookies: jest.fn(),
  getSession: jest.fn(),
}));

jest.mock('@/lib/audit-middleware', () => ({
  audit: {
    logUserAction: jest.fn(),
    logDataChange: jest.fn(),
    logSecurityEvent: jest.fn(),
  },
}));

// Test data
const mockGoogleUser = {
  id: 'google_123456',
  email: 'test@example.com',
  name: 'John Doe',
  given_name: 'John',
  family_name: 'Doe',
  picture: 'https://example.com/photo.jpg',
  verified_email: true,
};

const mockOAuthState = 'secure_state_token_123';
const mockAuthCode = 'oauth_auth_code_456';

describe('OAuth Pre-population Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;
  let mockUser: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request
    mockRequest = {
      url: `http://localhost:3000/api/auth/google/callback?code=${mockAuthCode}&state=${mockOAuthState}`,
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Test Browser',
      }),
      cookies: {
        get: jest.fn((name: string) => {
          if (name === 'oauth_state') return { value: mockOAuthState };
          return undefined;
        }),
      },
    };

    // Mock fetch for OAuth API calls
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          scope: 'profile email',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGoogleUser),
      });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('New User OAuth Pre-population Flow', () => {
    test('should create new user with OAuth data and log pre-population success', async () => {
      // Mock database responses
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]), // No existing user
      } as any);

      jest.spyOn(db, 'insert').mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{
          id: 'new_user_123',
          email: mockGoogleUser.email,
          first_name: mockGoogleUser.given_name,
          last_name: mockGoogleUser.family_name,
          auth_provider: 'google',
        }]),
      } as any);

      const { GET } = await import('@/app/api/auth/google/callback/route');
      const response = await GET(mockRequest as NextRequest);

      // Verify new user creation with OAuth data
      expect(db.insert).toHaveBeenCalledWith(users);
      expect(db.insert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockGoogleUser.email,
          first_name: mockGoogleUser.given_name,
          last_name: mockGoogleUser.family_name,
          profile_photo_url: mockGoogleUser.picture,
          auth_provider: 'google',
          auth_provider_id: mockGoogleUser.id,
        })
      );

      // Verify GDPR compliance logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logUserAction).toHaveBeenCalledWith(
        expect.any(String),
        'gdpr_compliance_oauth_processing',
        'data_protection',
        expect.any(String),
        expect.objectContaining({
          consent_type: 'oauth_profile_prepopulation',
          provider: 'google',
          data_categories: ['name', 'email', 'profile_photo'],
          legal_basis: 'consent',
        }),
        expect.any(String)
      );

      // Verify OAuth callback completion logging
      expect(audit.logUserAction).toHaveBeenCalledWith(
        expect.any(String),
        'google_oauth_callback_complete',
        'authentication',
        expect.any(String),
        expect.objectContaining({
          provider: 'google',
          user_type: 'new',
          prepopulation_ready: true,
        }),
        expect.any(String)
      );

      // Verify redirect to onboarding
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('/onboarding');
    });
  });

  describe('Existing User OAuth Update Flow', () => {
    beforeEach(() => {
      mockUser = {
        id: 'existing_user_456',
        email: mockGoogleUser.email,
        first_name: null,
        last_name: null,
        auth_provider: null,
        profile_photo_url: null,
        personal_info_completed: false,
        signature_completed: false,
        legal_consent_completed: false,
        verification_completed: false,
        onboarding_completed_at: null,
      };
    });

    test('should update existing user with OAuth data and log data changes', async () => {
      // Mock existing user found
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockUser]),
      } as any);

      jest.spyOn(db, 'update').mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(undefined),
      } as any);

      const { GET } = await import('@/app/api/auth/google/callback/route');
      await GET(mockRequest as NextRequest);

      // Verify user update with OAuth data
      expect(db.update).toHaveBeenCalledWith(users);
      expect(db.update().set).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: mockGoogleUser.given_name,
          last_name: mockGoogleUser.family_name,
          profile_photo_url: mockGoogleUser.picture,
          auth_provider: 'google',
          auth_provider_id: mockGoogleUser.id,
        })
      );

      // Verify data change logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logDataChange).toHaveBeenCalledWith(
        mockUser.id,
        'update',
        'user_profile',
        mockUser.id,
        expect.objectContaining({
          first_name: null,
          last_name: null,
          auth_provider: null,
        }),
        expect.objectContaining({
          first_name: mockGoogleUser.given_name,
          last_name: mockGoogleUser.family_name,
          auth_provider: 'google',
        }),
        expect.any(String)
      );
    });
  });

  describe('Personal Info API Enhanced Validation', () => {
    test('should validate personal info with Irish compliance and log validation results', async () => {
      const mockSession = {
        isAuthenticated: true,
        user: { id: 'user_123', email: 'test@example.com' },
      };

      const { getSession } = await import('@/lib/auth');
      (getSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock user data retrieval
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
          auth_provider: 'google',
          updated_at: new Date(),
          profile_photo_url: 'https://example.com/photo.jpg',
        }]),
      } as any);

      const mockRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        }),
        json: () => Promise.resolve({
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+353 1 234 5678',
          dateOfBirth: '1990-01-01',
          addressLine1: '123 Main Street',
          city: 'Dublin',
          county: 'Dublin',
          eircode: 'D02 XY56',
        }),
      } as NextRequest;

      const { GET } = await import('@/app/api/onboarding/personal-info/route');
      const response = await GET(mockRequest);

      const data = await response.json();

      // Verify enhanced response with OAuth source tracking
      expect(data).toMatchObject({
        success: true,
        personalInfo: expect.any(Object),
        completionStatus: expect.any(Object),
        dataSource: {
          from_oauth: true,
          provider: 'google',
          last_updated: expect.any(String),
          has_profile_photo: true,
        },
      });

      // Verify audit logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logUserAction).toHaveBeenCalledWith(
        mockSession.user.id,
        'personal_info_retrieved',
        'onboarding_data',
        mockSession.user.id,
        expect.objectContaining({
          has_oauth_data: true,
          provider: 'google',
          pre_population_ready: true,
        }),
        expect.any(String)
      );
    });

    test('should handle validation failures with detailed error logging', async () => {
      const mockSession = {
        isAuthenticated: true,
        user: { id: 'user_123', email: 'test@example.com' },
      };

      const { getSession } = await import('@/lib/auth');
      (getSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock user data retrieval
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{
          first_name: 'John',
          last_name: 'Doe',
          email: 'test@example.com',
          auth_provider: 'google',
        }]),
      } as any);

      const mockRequest = {
        headers: new Headers({
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        }),
        json: () => Promise.resolve({
          firstName: '', // Invalid - empty
          lastName: 'Doe',
          phoneNumber: 'invalid-phone',
          dateOfBirth: '1990-01-01',
          addressLine1: '123 Main Street',
          city: 'Dublin',
          county: 'Dublin',
          eircode: 'INVALID', // Invalid Eircode format
        }),
      } as NextRequest;

      const { POST } = await import('@/app/api/onboarding/personal-info/route');
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('name'),
            message: expect.any(String),
          }),
        ])
      );

      // Verify validation failure logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logUserAction).toHaveBeenCalledWith(
        mockSession.user.id,
        'personal_info_validation_failed',
        'onboarding_data',
        mockSession.user.id,
        expect.objectContaining({
          validation_errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              received_value: '[REDACTED]',
            }),
          ]),
        }),
        expect.any(String)
      );
    });
  });

  describe('Security & Error Handling', () => {
    test('should detect and log OAuth state validation failures', async () => {
      const maliciousRequest = {
        ...mockRequest,
        url: `http://localhost:3000/api/auth/google/callback?code=${mockAuthCode}&state=forged_state`,
        cookies: {
          get: jest.fn((name: string) => {
            if (name === 'oauth_state') return { value: 'different_state' };
            return undefined;
          }),
        },
      };

      const { GET } = await import('@/app/api/auth/google/callback/route');
      const response = await GET(maliciousRequest as NextRequest);

      // Verify security event logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logSecurityEvent).toHaveBeenCalledWith(
        null,
        'oauth_state_validation_failed',
        expect.objectContaining({
          provided_state: 'forged_state',
          state_mismatch: true,
          potential_csrf_attempt: true,
        }),
        expect.any(String),
        expect.any(String)
      );

      // Verify error redirect
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('error=invalid_state');
    });

    test('should handle OAuth token exchange failures with proper logging', async () => {
      // Mock failed token exchange
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Token exchange failed'),
      });

      const { GET } = await import('@/app/api/auth/google/callback/route');
      const response = await GET(mockRequest as NextRequest);

      // Verify error logging
      const { audit } = await import('@/lib/audit-middleware');
      expect(audit.logSecurityEvent).toHaveBeenCalledWith(
        null,
        'oauth_token_exchange_failed',
        expect.objectContaining({
          provider: 'google',
          status_code: 400,
        }),
        expect.any(String),
        expect.any(String)
      );

      // Verify error redirect
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toContain('error=token_exchange');
    });
  });

  describe('Performance & Metrics Validation', () => {
    test('should track performance metrics during OAuth flow', async () => {
      const startTime = Date.now();
      
      // Mock database operations
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      } as any);

      jest.spyOn(db, 'insert').mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{
          id: 'new_user_123',
          email: mockGoogleUser.email,
        }]),
      } as any);

      const { GET } = await import('@/app/api/auth/google/callback/route');
      await GET(mockRequest as NextRequest);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Verify performance logging includes timing
      const { audit } = await import('@/lib/audit-middleware');
      const callsWithTiming = (audit.logUserAction as jest.Mock).mock.calls.filter(
        call => call[4] && typeof call[4].processing_duration_ms === 'number'
      );

      expect(callsWithTiming.length).toBeGreaterThan(0);
      expect(callsWithTiming[0][4].processing_duration_ms).toBeGreaterThanOrEqual(0);
      expect(callsWithTiming[0][4].processing_duration_ms).toBeLessThan(10000); // Reasonable upper bound
    });
  });

  describe('Compliance & Data Protection', () => {
    test('should ensure GDPR compliance logging for new users', async () => {
      // Mock new user creation
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      } as any);

      jest.spyOn(db, 'insert').mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{
          id: 'new_user_123',
          email: mockGoogleUser.email,
        }]),
      } as any);

      const { GET } = await import('@/app/api/auth/google/callback/route');
      await GET(mockRequest as NextRequest);

      // Verify GDPR compliance logging
      const { audit } = await import('@/lib/audit-middleware');
      const gdprCall = (audit.logUserAction as jest.Mock).mock.calls.find(
        call => call[1] === 'gdpr_compliance_oauth_processing'
      );

      expect(gdprCall).toBeDefined();
      expect(gdprCall[4]).toMatchObject({
        consent_type: 'oauth_profile_prepopulation',
        provider: 'google',
        data_categories: ['name', 'email', 'profile_photo'],
        legal_basis: 'consent',
        retention_period: 'account_lifetime_plus_7_years',
        processing_purpose: 'estate_planning_onboarding',
        user_consent_timestamp: expect.any(String),
        audit_trail_enabled: true,
      });
    });

    test('should never log sensitive OAuth data in audit trails', async () => {
      // Mock user creation
      jest.spyOn(db, 'select').mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      } as any);

      jest.spyOn(db, 'insert').mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{
          id: 'new_user_123',
          email: mockGoogleUser.email,
        }]),
      } as any);

      const { GET } = await import('@/app/api/auth/google/callback/route');
      await GET(mockRequest as NextRequest);

      // Verify no sensitive data in audit logs
      const { audit } = await import('@/lib/audit-middleware');
      const allCalls = [
        ...(audit.logUserAction as jest.Mock).mock.calls,
        ...(audit.logDataChange as jest.Mock).mock.calls,
        ...(audit.logSecurityEvent as jest.Mock).mock.calls,
      ];

      // Check that no actual email addresses, names, or tokens appear in logs
      for (const call of allCalls) {
        const eventData = JSON.stringify(call);
        expect(eventData).not.toContain(mockGoogleUser.email);
        expect(eventData).not.toContain('mock_access_token');
        expect(eventData).not.toContain(mockGoogleUser.given_name);
        expect(eventData).not.toContain(mockGoogleUser.family_name);
      }
    });
  });
});

/**
 * Performance Benchmark Tests
 * Validate that OAuth pre-population meets performance SLAs
 */
describe('OAuth Pre-population Performance Benchmarks', () => {
  test('should complete OAuth callback within 2 second SLA', async () => {
    const startTime = performance.now();

    // Mock fast database operations
    jest.spyOn(db, 'select').mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce([]),
    } as any);

    jest.spyOn(db, 'insert').mockReturnValueOnce({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValueOnce([{
        id: 'new_user_123',
        email: mockGoogleUser.email,
      }]),
    } as any);

    // Mock OAuth API responses
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token', token_type: 'Bearer' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGoogleUser),
      });

    const mockRequest = {
      url: `http://localhost:3000/api/auth/google/callback?code=test&state=test`,
      headers: new Headers(),
      cookies: { get: () => ({ value: 'test' }) },
    } as NextRequest;

    const { GET } = await import('@/app/api/auth/google/callback/route');
    await GET(mockRequest);

    const duration = performance.now() - startTime;
    
    // Verify SLA compliance (2 second target)
    expect(duration).toBeLessThan(2000);
  });
});

/**
 * Integration Test for Complete OAuth Pre-population Flow
 * End-to-end test simulating real user journey
 */
describe('Complete OAuth Pre-population Integration', () => {
  test('should handle complete flow from OAuth to form pre-population', async () => {
    // Phase 1: OAuth Callback
    jest.spyOn(db, 'select').mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce([]),
    } as any);

    jest.spyOn(db, 'insert').mockReturnValueOnce({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValueOnce([{
        id: 'new_user_123',
        email: mockGoogleUser.email,
        first_name: mockGoogleUser.given_name,
        last_name: mockGoogleUser.family_name,
        auth_provider: 'google',
      }]),
    } as any);

    const mockRequest = {
      url: `http://localhost:3000/api/auth/google/callback?code=test&state=test`,
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
      cookies: { get: () => ({ value: 'test' }) },
    } as NextRequest;

    const { GET: callbackGET } = await import('@/app/api/auth/google/callback/route');
    const callbackResponse = await callbackGET(mockRequest);

    // Verify OAuth callback success
    expect(callbackResponse.status).toBe(302);
    expect(callbackResponse.headers.get('location')).toContain('/onboarding');

    // Phase 2: Personal Info API Data Retrieval
    const { getSession } = await import('@/lib/auth');
    (getSession as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      user: { id: 'new_user_123', email: mockGoogleUser.email },
    });

    jest.spyOn(db, 'select').mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValueOnce([{
        first_name: mockGoogleUser.given_name,
        last_name: mockGoogleUser.family_name,
        email: mockGoogleUser.email,
        auth_provider: 'google',
        updated_at: new Date(),
        profile_photo_url: mockGoogleUser.picture,
      }]),
    } as any);

    const personalInfoRequest = {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1' }),
    } as NextRequest;

    const { GET: personalInfoGET } = await import('@/app/api/onboarding/personal-info/route');
    const personalInfoResponse = await personalInfoGET(personalInfoRequest);
    const personalInfoData = await personalInfoResponse.json();

    // Verify pre-population data is correctly returned
    expect(personalInfoData.success).toBe(true);
    expect(personalInfoData.personalInfo.first_name).toBe(mockGoogleUser.given_name);
    expect(personalInfoData.personalInfo.last_name).toBe(mockGoogleUser.family_name);
    expect(personalInfoData.personalInfo.email).toBe(mockGoogleUser.email);
    expect(personalInfoData.dataSource.from_oauth).toBe(true);
    expect(personalInfoData.dataSource.provider).toBe('google');

    // Verify comprehensive audit trail
    const { audit } = await import('@/lib/audit-middleware');
    const auditCalls = (audit.logUserAction as jest.Mock).mock.calls;
    
    expect(auditCalls).toEqual(
      expect.arrayContaining([
        // OAuth callback completion
        expect.arrayContaining([
          'new_user_123',
          'google_oauth_callback_complete',
          'authentication',
          'new_user_123',
          expect.objectContaining({
            provider: 'google',
            user_type: 'new',
            prepopulation_ready: true,
          }),
        ]),
        // Personal info retrieval
        expect.arrayContaining([
          'new_user_123',
          'personal_info_retrieved',
          'onboarding_data',
          'new_user_123',
          expect.objectContaining({
            has_oauth_data: true,
            provider: 'google',
            pre_population_ready: true,
          }),
        ]),
      ])
    );
  });
});