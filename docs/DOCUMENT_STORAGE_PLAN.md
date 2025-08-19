# Document Storage Implementation Plan for Irish Estate Planning

## Table of Contents
1. [Document Requirements by Asset Type](#document-requirements-by-asset-type)
2. [Technical Implementation Plan](#technical-implementation-plan)
3. [Database Schema](#database-schema)
4. [API Design](#api-design)
5. [UI/UX Flow](#uiux-flow)
6. [Security & Compliance](#security--compliance)

## Document Requirements by Asset Type

### 🏦 Financial Assets

#### Irish Bank Accounts
**Required Documents:**
- Bank statement (last 3-6 months)
- Account opening documentation
- Proof of account ownership

**Optional Documents:**
- Standing order/direct debit schedules
- Joint account agreements
- Nomination forms (if applicable)

#### Irish Credit Union Accounts
**Required Documents:**
- Share/savings certificate
- Recent statement
- Membership documentation

**Optional Documents:**
- Loan agreements (if any)
- Death benefit nomination forms
- AGM voting rights documentation

#### Investment Accounts & Shares
**Required Documents:**
- Share certificates or electronic holding statements
- Recent portfolio valuation
- Broker account statements

**Optional Documents:**
- Purchase contracts/dealing notes
- Dividend payment records
- Corporate action notices
- Nominee agreements

#### Irish Pensions (PRSA, Occupational, ARF, AVC)
**Required Documents:**
- Annual benefit statement
- Scheme membership certificate
- Provider correspondence

**Optional Documents:**
- Expression of wish forms
- Transfer value statements
- Retirement option letters
- Investment fund selections

#### Life Insurance & Assurance
**Required Documents:**
- Policy document
- Premium payment receipts
- Current surrender value statement

**Optional Documents:**
- Medical underwriting documents
- Beneficiary nomination forms
- Policy alteration confirmations
- Claims history

### 🏠 Property Assets

#### Residential Property
**Required Documents:**
- Title deeds/Land Registry folio
- Property registration (if registered)
- Local Property Tax (LPT) receipts

**Optional Documents:**
- Mortgage documentation
- Planning permissions
- Building Energy Rating (BER) certificate
- Home insurance policy
- Management company documentation (apartments)
- Rental agreements (if let)

#### Commercial Property
**Required Documents:**
- Title documentation
- Commercial rates receipts
- Lease agreements (if applicable)

**Optional Documents:**
- Rent roll documentation
- Service charge statements
- Fire safety certificates
- Planning compliance certificates
- Environmental assessments

#### Agricultural Land
**Required Documents:**
- Land Registry folios
- Basic Payment Scheme documentation
- Agricultural tax receipts

**Optional Documents:**
- Lease/conacre agreements
- Forestry grants/schemes
- Environmental scheme participation
- Entitlement documentation
- Herd number registrations

### 🏢 Business Assets

#### Irish Limited Company Shares
**Required Documents:**
- Share certificate
- Company registration (CRO) details
- Latest annual return (B1)

**Optional Documents:**
- Shareholders' agreement
- Directors' loan documentation
- Company constitution
- Recent financial statements
- Tax clearance certificate

#### Sole Trader Business
**Required Documents:**
- Business registration documents
- Revenue tax registration
- Recent accounts/tax returns

**Optional Documents:**
- Customer contracts
- Supplier agreements
- Intellectual property registrations
- Business insurance policies
- VAT registration

#### Partnership Interests
**Required Documents:**
- Partnership agreement
- Partnership tax registration
- Capital account statements

**Optional Documents:**
- Profit sharing agreements
- Buy-sell agreements
- Partnership insurance
- Goodwill valuations

### 🚗 Personal Assets

#### Motor Vehicles
**Required Documents:**
- Vehicle Registration Certificate (VRC)
- NCT certificate
- Insurance disc/policy

**Optional Documents:**
- Purchase invoice
- Service history
- Finance agreements
- Valuation reports

#### Boats/Vessels
**Required Documents:**
- Registration certificate
- Marine survey report
- Insurance documentation

**Optional Documents:**
- Mooring agreements
- Maintenance records
- Safety equipment certificates

#### Jewelry & Valuables
**Required Documents:**
- Purchase receipts
- Valuation certificates
- Insurance appraisals

**Optional Documents:**
- Certificates of authenticity
- Provenance documentation
- Restoration records

### 💻 Digital Assets

#### Cryptocurrency
**Required Documents:**
- Wallet addresses (public keys)
- Exchange account statements
- Transaction history

**Optional Documents:**
- Private key backup locations (encrypted)
- Recovery phrases (secured separately)
- Tax reporting documentation

#### Digital Accounts & Domains
**Required Documents:**
- Account ownership verification
- Domain registration details
- Renewal documentation

**Optional Documents:**
- Usage analytics
- Revenue reports
- Transfer authorizations

## Technical Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

#### Database Schema Extension
```sql
-- Main document storage table
CREATE TABLE asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email),
  
  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Storage information
  blob_url TEXT NOT NULL,
  blob_pathname TEXT NOT NULL,
  blob_download_url TEXT,
  
  -- Categorization
  document_category VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  expiry_date DATE,
  issue_date DATE,
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_asset_documents_asset_id (asset_id),
  INDEX idx_asset_documents_user_email (user_email),
  INDEX idx_asset_documents_category (document_category)
);

-- Document templates/requirements table
CREATE TABLE document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type VARCHAR(100) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  category VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  
  UNIQUE KEY unique_asset_doc_type (asset_type, document_type)
);
```

### Phase 2: Vercel Blob Integration (Week 2)

#### Environment Configuration
```env
# Already configured in project
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

#### Upload Service Implementation
```typescript
// lib/document-storage.ts
import { put, del, list } from '@vercel/blob';

export class DocumentStorageService {
  async uploadDocument(
    file: File,
    assetId: string,
    userId: string,
    metadata: DocumentMetadata
  ): Promise<DocumentRecord> {
    // Implementation
  }
  
  async deleteDocument(documentId: string): Promise<void> {
    // Implementation
  }
  
  async getDocumentUrl(documentId: string): Promise<string> {
    // Implementation with signed URL
  }
}
```

### Phase 3: UI Components (Week 2-3)

#### Document Upload Component
```typescript
// components/documents/DocumentUploadZone.tsx
- Drag & drop interface
- File type validation (PDF, JPG, PNG, DOCX, XLSX)
- Size limits (10MB default, configurable)
- Progress tracking
- Thumbnail generation
```

#### Document Management Interface
```typescript
// components/documents/DocumentManager.tsx
- Grid/list view toggle
- Category filtering
- Search functionality
- Batch operations
- Preview modal
```

### Phase 4: API Endpoints (Week 3)

#### Document Management APIs
```typescript
// POST /api/assets/[id]/documents
// GET /api/assets/[id]/documents
// DELETE /api/documents/[id]
// GET /api/documents/[id]/download
// GET /api/documents/requirements/[assetType]
```

### Phase 5: Integration (Week 3-4)

#### Asset Creation Flow Enhancement
1. Add "Documents" step after "Value" step
2. Show required/recommended documents based on asset type
3. Allow skip for optional documents
4. Progress indicator for document completeness

#### Asset Management Enhancement
1. Add "Documents" tab to asset detail page
2. Document count badges on asset cards
3. Quick upload from asset list view
4. Bulk document operations

## API Design

### Upload Document
```typescript
POST /api/assets/[id]/documents
Content-Type: multipart/form-data

Request:
- file: File
- category: string
- type: string
- description?: string
- expiryDate?: string
- issueDate?: string

Response:
{
  id: string,
  fileName: string,
  fileSize: number,
  uploadedAt: string,
  category: string,
  type: string,
  blobUrl: string
}
```

### List Documents
```typescript
GET /api/assets/[id]/documents?category=legal&type=deed

Response:
{
  documents: Document[],
  total: number,
  required: string[],
  optional: string[]
}
```

### Get Document Requirements
```typescript
GET /api/documents/requirements/[assetType]

Response:
{
  required: DocumentRequirement[],
  optional: DocumentRequirement[],
  categories: string[]
}
```

## UI/UX Flow

### Document Upload Flow
1. **Asset Creation/Edit**
   - User reaches "Documents" step
   - System shows required/optional documents for asset type
   - Drag & drop zone with file type indicators

2. **Upload Process**
   - File validation (type, size)
   - Progress indicator
   - Automatic categorization based on file name/type
   - Manual category override option

3. **Document Review**
   - Thumbnail preview
   - Edit metadata (description, dates)
   - Mark as primary/secondary
   - Delete option

### Document Viewing Flow
1. **Asset Detail Page**
   - Documents tab shows all uploaded files
   - Filter by category/type
   - Search within document names/descriptions
   - Quick actions (download, delete, edit)

2. **Document Preview**
   - Modal with document viewer
   - PDF.js for PDF files
   - Image viewer with zoom for images
   - Download original option
   - Navigation between documents

## Security & Compliance

### Access Control
```typescript
// Middleware for document access
export async function validateDocumentAccess(
  documentId: string,
  userEmail: string
): Promise<boolean> {
  // Check document ownership
  // Verify asset ownership
  // Audit access attempt
}
```

### Data Protection
1. **Encryption**
   - Files encrypted at rest (Vercel Blob default)
   - HTTPS for all transfers
   - Signed URLs with expiration

2. **GDPR Compliance**
   - Right to deletion
   - Data portability (export all documents)
   - Access logs
   - Consent tracking

3. **Audit Trail**
   - Log all document operations
   - Track access attempts
   - Retention policies

### File Security
1. **Validation**
   - File type checking (MIME and extension)
   - File size limits
   - Malware scanning (optional integration)
   - Content verification

2. **Storage**
   - Isolated per user
   - No direct public access
   - Temporary signed URLs
   - Regular backup

## Implementation Timeline

### Week 1: Foundation
- ✅ Database schema creation
- ✅ Document requirements data seed
- ✅ Basic Vercel Blob integration

### Week 2: Core Features
- 📝 Document upload component
- 📝 Basic API endpoints
- 📝 File validation service

### Week 3: Integration
- 📝 Asset creation flow integration
- 📝 Document management UI
- 📝 Preview functionality

### Week 4: Polish & Security
- 📝 Security middleware
- 📝 Performance optimization
- 📝 Testing & bug fixes

### Week 5: Advanced Features
- 📝 Bulk operations
- 📝 Document templates
- 📝 OCR integration (future)

## Performance Considerations

### Optimization Strategies
1. **Upload Optimization**
   - Chunked uploads for large files
   - Resume capability
   - Client-side compression for images

2. **Storage Optimization**
   - Automatic image optimization
   - PDF compression
   - Deduplication for identical files

3. **Retrieval Optimization**
   - CDN integration
   - Lazy loading
   - Thumbnail caching
   - Prefetch on hover

## Success Metrics

### Key Performance Indicators
1. **Upload Success Rate**: >95%
2. **Average Upload Time**: <5s for 5MB file
3. **Document Retrieval Time**: <2s
4. **User Document Completion**: >60% provide at least one document
5. **Storage Cost**: <€0.01 per document/month

### User Experience Metrics
1. **Upload Abandonment Rate**: <10%
2. **Document Preview Usage**: >40%
3. **Mobile Upload Success**: >90%
4. **Support Tickets Related to Documents**: <5%

## Risk Mitigation

### Technical Risks
1. **Storage Limits**
   - Monitor usage
   - Implement quotas
   - Archive old documents

2. **Performance Issues**
   - CDN for static content
   - Queue for processing
   - Rate limiting

3. **Security Breaches**
   - Regular security audits
   - Penetration testing
   - Incident response plan

### Business Risks
1. **Compliance Issues**
   - Legal review
   - Regular audits
   - Clear terms of service

2. **Cost Overruns**
   - Usage monitoring
   - Cost alerts
   - Optimization strategies