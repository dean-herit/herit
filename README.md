# HERIT - Digital Estate Planning Platform

A comprehensive digital estate planning application built with Next.js 15, enabling users to create, manage, and secure their digital wills and estate documents with advanced authentication, document management, and beneficiary tracking.

## 🎯 Project Overview

HERIT is a full-stack estate planning platform that provides:

- **User Authentication & Onboarding**: Secure multi-step registration with OAuth support
- **Digital Signatures**: Custom signature creation and management system
- **Asset Management**: Comprehensive tracking of financial and physical assets
- **Beneficiary Management**: Detailed beneficiary information and inheritance distribution
- **Will Creation**: Guided will creation with legal compliance features
- **Document Security**: Encrypted storage and audit trails for all legal documents

## 🏗️ Architecture

### Frontend

- **Framework**: Next.js 15 with App Router
- **UI Library**: HeroUI v2 with Tailwind CSS
- **State Management**: TanStack Query for server state
- **Authentication**: Custom JWT-based auth with refresh tokens
- **Styling**: Tailwind CSS with custom design system

### Backend

- **API Routes**: Next.js API routes with rate limiting
- **Database**: PostgreSQL with Drizzle ORM (single source of truth)
- **Schema Management**: Computed columns, environment-specific migrations
- **Authentication**: JWT tokens with secure refresh rotation
- **File Storage**: Vercel Blob for document storage
- **Security**: Rate limiting, CSRF protection, comprehensive audit system

### Infrastructure

- **Hosting**: Vercel with serverless functions
- **Database**: PostgreSQL (production), local Postgres (development)
- **Monitoring**: Structured logging with health checks
- **CI/CD**: Pre-commit hooks with Husky and lint-staged

## 🗄️ Database Schema

### Core Tables

- **`app_users`**: User profiles with computed onboarding status and authentication
- **`app_refresh_tokens`**: JWT refresh token management with rotation
- **`assets`**: Financial and physical asset tracking
- **`beneficiaries`**: Heir information and inheritance details
- **`wills`**: Will documents with versioning and legal status
- **`signatures`**: Digital signature storage and metadata
- **`signature_usage`**: Audit trail for signature applications
- **`audit_events`**: Comprehensive system audit logging

### Key Features

- UUID primary keys for security
- **Computed onboarding_completed column** - automatically calculated from step flags
- Soft delete capabilities with audit trails
- Comprehensive indexing for performance
- JSONB columns for flexible metadata storage
- **Type-safe schema** - all application types derived from database schema

## 🔧 Technology Stack

### Core Dependencies

```json
{
  "next": "^15.4.6",
  "react": "18.3.1",
  "typescript": "5.6.3",
  "@heroui/react": "^2.8.2",
  "drizzle-orm": "^0.44.4",
  "postgres": "^3.4.7",
  "@tanstack/react-query": "^5.85.3",
  "@vercel/blob": "^1.1.1"
}
```

### Development Tools

- **TypeScript**: Strict type checking with modern module resolution
- **ESLint**: Comprehensive linting with React and Next.js rules
- **Prettier**: Code formatting with pre-commit hooks
- **Husky**: Git hooks for code quality enforcement
- **Bundle Analyzer**: Performance monitoring and optimization

### Security & Monitoring

- **Rate Limiting**: Custom in-memory rate limiting (Redis-ready)
- **Environment Validation**: Runtime env validation with Zod
- **Structured Logging**: JSON logging for production monitoring
- **Health Checks**: Comprehensive system health monitoring

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm/yarn/pnpm package manager

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Database (Required)
POSTGRES_URL="postgresql://username:password@localhost:5432/herit"

# Authentication Secrets (Required - min 32 characters)
SESSION_SECRET="your-super-secure-session-secret-32-chars-minimum"
REFRESH_SECRET="your-super-secure-refresh-secret-32-chars-minimum"

# OAuth - Google (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# OAuth - GitHub (Optional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# File Storage (Optional - for document uploads)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Environment
NODE_ENV="development"
```

### Installation & Setup

1. **Clone and install dependencies**:

```bash
git clone <repository-url>
cd herit
npm install
```

2. **Database setup**:

```bash
# Generate database schema
npm run db:generate

# Apply migrations (safe, recommended)
npm run db:migrate

# Environment-specific migrations
npm run db:migrate:dev      # Development
npm run db:migrate:staging  # Staging
npm run db:migrate:prod     # Production

# Validate schema health
npm run db:validate

# Optional: Open database studio
npm run db:studio
```

3. **Start development server**:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

```bash
# Development
npm run dev              # Start development server (custom script)
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint with auto-fix
npm run typecheck       # TypeScript compilation check
npm run test:build      # Full build verification

# Database (Schema Refactor Ready)
npm run db:generate     # Generate new migrations
npm run db:migrate      # Apply pending migrations (safe)
npm run db:migrate:dev  # Apply to development database
npm run db:migrate:staging # Apply to staging database
npm run db:migrate:prod # Apply to production database
npm run db:push         # DEPRECATED: Use db:migrate instead
npm run db:validate     # Validate schema health
npm run db:reset        # Reset database (development only)
npm run db:studio       # Open Drizzle Studio

# Analysis & Testing
npm run analyze         # Bundle size analysis
npm run test:build      # Build verification with type checking
```

## 🏗️ Application Structure

```
app/
├── (auth)/             # Authentication routes
│   ├── login/          # Login page
│   └── onboarding/     # Multi-step user onboarding
├── (dashboard)/        # Protected dashboard routes
│   ├── assets/         # Asset management
│   ├── beneficiaries/  # Beneficiary management
│   ├── dashboard/      # Main dashboard
│   └── will/           # Will creation and management
├── api/                # API routes
│   ├── auth/           # Authentication endpoints
│   ├── onboarding/     # Onboarding process APIs
│   └── health/         # System health check
└── layout.tsx          # Root layout

components/
├── auth/               # Authentication components
├── dashboard/          # Dashboard-specific components
├── ui/                 # Reusable UI components
└── navbar.tsx          # Main navigation

lib/
├── auth.ts             # Authentication utilities
├── env.ts              # Environment validation
├── logger.ts           # Structured logging
├── rate-limit.ts       # Rate limiting system
└── utils.ts            # General utilities

db/
├── db.ts               # Database connection
└── schema.ts           # Complete database schema
```

## 🔐 Authentication & Security

### Authentication Flow

1. **Registration**: Email/password with secure hashing (Argon2)
2. **Login**: JWT access tokens (24hr) + refresh tokens (30 days)
3. **OAuth**: Google OAuth integration (GitHub ready)
4. **Session Management**: Automatic token rotation and revocation
5. **Document Storage**: Secure Vercel Blob integration with user-specific paths

### Security Features

- **Rate Limiting**: 5 login attempts/minute, 3 registrations/hour
- **Environment Validation**: Runtime validation of all secrets
- **CSRF Protection**: Secure cookie handling
- **Audit Logging**: Comprehensive event tracking
- **Data Encryption**: Secure password hashing and token management

### Onboarding Process

1. **Personal Information**: Name, contact details, address
2. **Digital Signature**: Custom signature creation and storage
3. **Legal Consent**: Terms acceptance and privacy agreements
4. **Identity Verification**: Document verification (integration ready)

## 🔄 Development Workflow

### Code Quality

- **Pre-commit Hooks**: Automatic linting, formatting, and type checking
- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: Custom configuration with React and Next.js best practices
- **Prettier**: Consistent code formatting across the codebase

### Testing Strategy

- **Type Safety**: Comprehensive TypeScript coverage
- **Build Verification**: Pre-deployment build testing
- **Health Monitoring**: Runtime health checks and monitoring

### Git Workflow

```bash
# Make changes to code
git add .
# Pre-commit hooks run automatically:
# - ESLint with auto-fix
# - Prettier formatting
# - TypeScript compilation check
git commit -m "feat: your feature description"
```

## 📊 Monitoring & Observability

### Health Checks

- **Endpoint**: `GET /api/health`
- **Database**: Connection and latency monitoring
- **Authentication**: Secret validation and OAuth status
- **System**: Uptime and service health

### Logging

- **Development**: Pretty-printed console logs
- **Production**: Structured JSON logging
- **Features**: Request/response logging, error tracking, audit trails

### Performance

- **Bundle Analysis**: `npm run analyze` for bundle size monitoring
- **Database**: Connection pooling and query optimization
- **Caching**: Strategic Next.js caching and optimization

## 🚀 Deployment

### Vercel Deployment

1. **Environment Variables**: Configure all required env vars in Vercel dashboard
2. **Database**: Ensure PostgreSQL is accessible from Vercel
3. **Build**: Automatic deployment on git push

### Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Health check endpoint responding
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] SSL certificates valid
- [ ] OAuth providers configured (if using)

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes with comprehensive testing
4. Ensure all checks pass: `npm run test:build`
5. Submit a pull request

### Code Standards

- **TypeScript**: All new code must be properly typed
- **Testing**: Critical paths should have appropriate testing
- **Documentation**: Update README for significant changes
- **Security**: Follow security best practices for sensitive operations

### Pull Request Process

1. **Code Review**: All PRs require review
2. **Quality Checks**: Automated checks must pass
3. **Documentation**: Update relevant documentation
4. **Migration**: Include database migrations if schema changes

## 🧩 Development Standards

### **Database Schema Management**

The project uses a **single source of truth** approach with Drizzle ORM:

- **Schema Definition**: All types derived from `db/schema.ts`
- **Type Safety**: Auto-generated types prevent schema mismatches
- **Migration Safety**: Pre-migration backups and validation
- **Environment Separation**: Dev/staging/prod migration workflows

### **Component Development**

#### **Standard Component Structure**

```tsx
import { ComponentProps } from "react";

interface MyComponentProps extends ComponentProps<"div"> {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction, ...props }: MyComponentProps) {
  return (
    <div {...props} data-testid="my-component">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

#### **Type Safety Requirements**

- All components must use proper TypeScript interfaces
- Database types must be imported from `db/schema.ts`
- API response types should match database schema
- Use `satisfies` operator for type validation where appropriate

### **Quality Assurance Standards**

**Pre-commit Requirements:**

```bash
# Type checking (must pass)
npm run typecheck

# Linting with auto-fix
npm run lint

# Full build verification
npm run test:build
```

**Database Change Workflow:**

```bash
# 1. Modify schema in db/schema.ts
# 2. Generate migration
npm run db:generate

# 3. Apply with safety checks
npm run db:migrate:dev

# 4. Validate schema health
npm run db:validate
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth initiation
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Current session info
- `POST /api/auth/refresh` - Refresh access token

### Asset Management Endpoints

- `GET /api/assets` - List user assets with pagination/filtering
- `POST /api/assets` - Create new asset
- `PUT /api/assets/[id]` - Update asset
- `DELETE /api/assets/[id]` - Delete asset
- `POST /api/assets/[id]/documents` - Upload asset document

### Document Management Endpoints

- `GET /api/documents/[id]` - Get document metadata
- `DELETE /api/documents/[id]` - Delete document
- `GET /api/documents/requirements/[type]` - Get document requirements

### Will Management Endpoints

- `GET /api/will` - Get user's will information
- `POST /api/will` - Create/update will
- `DELETE /api/will/[id]` - Delete will

### Onboarding Endpoints

- `POST /api/onboarding/personal-info` - Save personal information
- `POST /api/onboarding/signature` - Store digital signature
- `POST /api/onboarding/legal-consent` - Record legal consents
- `POST /api/onboarding/verification` - Identity verification
- `POST /api/onboarding/complete` - Complete onboarding process

### System Endpoints

- `GET /api/health` - System health check

## 🐛 Troubleshooting

### Common Issues

**Environment Variables Not Loading**

```bash
# Check environment validation
npm run typecheck
# Ensure .env.local exists with required variables
```

**Database Connection Issues**

```bash
# Verify database is running and accessible
npm run db:studio
# Check POSTGRES_URL format
```

**Build Failures**

```bash
# Run full verification
npm run test:build
# Check TypeScript errors
npm run typecheck
```

## 📈 Performance Optimization

### Implemented Optimizations

- **Bundle Splitting**: Lazy loading of heavy components
- **Database**: Optimized connection pooling (20 connections prod)
- **Images**: Next.js Image optimization with WebP/AVIF
- **Caching**: Strategic caching of static assets and API responses

### Monitoring Tools

- **Bundle Analyzer**: Monitor JavaScript bundle sizes
- **Health Checks**: Real-time system health monitoring
- **Structured Logging**: Performance metrics and error tracking

## 📄 License

Licensed under the [MIT License](LICENSE).

## 🆘 Support

For development questions or issues:

1. Check the troubleshooting section above
2. Review the health check endpoint: `/api/health`
3. Check application logs for detailed error information
4. Submit an issue with reproduction steps and environment details
