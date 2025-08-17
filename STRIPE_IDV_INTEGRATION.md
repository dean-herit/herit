# Stripe Identity Verification (IDV) Integration

## Overview

This document describes the complete Stripe Identity Verification integration implemented in step 4 of the onboarding process.

## Architecture

### 1. Backend Implementation

#### Stripe Utility Library (`lib/stripe.ts`)

- **StripeIdentityService**: Core service class for IDV operations
- **createVerificationSession()**: Creates new verification sessions with document requirements
- **getVerificationSession()**: Retrieves verification session status
- **processWebhookEvent()**: Handles webhook events for verification completion

#### API Endpoints

**Verification API (`/api/onboarding/verification`)**

- **GET**: Retrieves current verification status and Stripe session details
- **POST**: Creates new Stripe Identity verification session and redirects user

**Webhook Handler (`/api/stripe/webhook`)**

- Processes Stripe webhook events for verification completion
- Updates user verification status in database
- Handles events: `identity.verification_session.verified`, `requires_input`, `canceled`

### 2. Frontend Implementation

#### VerificationStep Component

- **Real-time status checking**: Loads verification status on mount
- **Stripe redirect handling**: Initiates verification session and redirects to Stripe
- **Status management**: Handles pending, in_progress, requires_input, completed states
- **Error handling**: Displays verification errors and retry options

### 3. Database Integration

- Stores verification session IDs in user table
- Tracks verification completion status and timestamps
- Updates onboarding progress automatically via webhooks

## Environment Variables

```bash
# Required Stripe Keys
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET="whsec_..." # Webhook endpoint secret

# Application URL
NEXTAUTH_URL="http://localhost:3000" # For verification redirects
```

## Verification Flow

1. **User initiates verification**: Clicks "Start Identity Verification"
2. **Session creation**: API creates Stripe verification session with document requirements
3. **Redirect to Stripe**: User is redirected to Stripe-hosted verification flow
4. **Document upload**: User uploads government ID and takes selfie
5. **Stripe processing**: Stripe processes and verifies the documents
6. **Webhook notification**: Stripe sends webhook event on completion
7. **Database update**: User verification status is updated automatically
8. **Return to app**: User returns to onboarding with completion status

## Verification Requirements

### Document Types Supported

- Driving License
- Passport
- Government ID Card

### Verification Features

- **Live document capture**: Prevents screenshots/photos of documents
- **ID number extraction**: Automatically extracts ID numbers
- **Selfie matching**: Compares selfie to document photo
- **Real-time processing**: Instant verification results

## Webhook Setup

To receive verification results, configure a webhook endpoint in your Stripe dashboard:

1. **URL**: `https://yourdomain.com/api/stripe/webhook`
2. **Events**:
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
3. **Secret**: Use the webhook secret in your environment variables

## Testing

### Test Mode

- Uses Stripe test keys (`sk_test_` and `pk_test_`)
- Test verification sessions can be completed without real documents
- Webhook events can be simulated using Stripe CLI

### Production Setup

1. Replace test keys with live keys (`sk_live_` and `pk_live_`)
2. Update webhook endpoint to production URL
3. Configure proper NEXTAUTH_URL for production domain

## Security Features

- **Webhook signature verification**: Validates all incoming webhook events
- **Session authentication**: All API calls require user authentication
- **Audit logging**: Verification events are logged for compliance
- **Data encryption**: All verification data is encrypted at rest

## Error Handling

### Common Scenarios

- **Network errors**: Handled with user-friendly error messages
- **Verification failures**: Clear instructions for retry process
- **Document issues**: Specific error messages from Stripe
- **Webhook failures**: Automatic retry mechanism built into Stripe

### User Experience

- **Loading states**: Clear indication of processing status
- **Progress tracking**: Real-time verification status updates
- **Retry options**: Easy retry for failed verifications
- **Support contact**: Clear path to customer support

## Compliance

### Legal Requirements

- **Identity verification**: Meets KYC (Know Your Customer) requirements
- **Document retention**: Stripe handles secure document storage
- **Privacy compliance**: GDPR and CCPA compliant verification process
- **Audit trail**: Complete verification history maintained

### Data Handling

- **Minimal data storage**: Only session IDs and status stored locally
- **Stripe security**: All sensitive data handled by Stripe's secure infrastructure
- **User consent**: Clear consent flow for identity verification
- **Data deletion**: User verification data can be deleted on request

## Integration Complete

✅ **Stripe utility library**: Full IDV service implementation  
✅ **API endpoints**: Verification session management and webhook handling  
✅ **Frontend component**: Complete user interface for verification flow  
✅ **Database integration**: Verification status tracking and updates  
✅ **Environment setup**: All required environment variables configured  
✅ **Error handling**: Comprehensive error handling and user feedback  
✅ **Security**: Webhook signature verification and authentication

The Stripe Identity Verification integration is now fully functional and ready for use in step 4 of the onboarding process.
