# 🔒 Audit System Operations Manual
## Enterprise-Grade Data Protection & Recovery System

**Version:** 1.0  
**Last Updated:** August 23, 2025  
**Classification:** CRITICAL SYSTEM OPERATIONS  
**Compliance:** GDPR, SOX, HIPAA Ready

---

## 🚨 CRITICAL SAFETY PROTOCOLS

### **MANDATORY RULES - NO EXCEPTIONS**

#### **Rule #1: NEVER Run Database Migrations Without Safety Protocol**
```typescript
// ❌ FORBIDDEN - Direct database changes
await db.execute(sql`ALTER TABLE...`);

// ✅ REQUIRED - Always use safety wrapper
import { safeMigration } from '@/scripts/migration-safety-protocol';
await safeMigration('migration-name', async () => {
  await db.execute(sql`ALTER TABLE...`);
});
```

#### **Rule #2: NEVER Delete Audit Logs**
- Audit logs are **APPEND-ONLY**
- Deletion violates compliance requirements
- Use retention policies instead of manual deletion

#### **Rule #3: ALWAYS Verify Backup Before Major Operations**
```bash
# Before any risky operation, verify backup exists
ls -la database-backups/
# Look for recent backup with reasonable size
```

---

## 📋 STANDARD OPERATING PROCEDURES

### **SOP-001: Pre-Migration Checklist**

**BEFORE any database schema change:**

1. **Verify Current State**
   ```bash
   npm run typecheck  # Ensure code compiles
   git status        # Ensure clean working directory
   ```

2. **Create Safety Backup**
   ```typescript
   import { safeMigration } from '@/scripts/migration-safety-protocol';
   
   await safeMigration('your-migration-name', async () => {
     // Your migration code here
   });
   ```

3. **Post-Migration Verification**
   - Check application functionality
   - Verify no data loss occurred
   - Test critical user flows

**RECOVERY PROCEDURES if migration fails:**
```bash
# Option 1: Use auto-generated rollback script
./database-backups/rollback-[timestamp].sh

# Option 2: Manual restore from backup
psql "$POSTGRES_URL" < database-backups/backup-[timestamp].sql
```

---

### **SOP-002: Audit Log Investigation**

**When investigating data issues:**

1. **Find Record Creation**
   ```sql
   SELECT user_id, event_time, new_data 
   FROM audit_events 
   WHERE resource_type = 'assets' 
   AND resource_id = '[record-id]'
   AND event_action = 'create'
   ORDER BY event_time ASC;
   ```

2. **Track All Changes**
   ```sql
   SELECT event_time, event_action, old_data, new_data, user_id
   FROM audit_events 
   WHERE resource_type = '[table-name]' 
   AND resource_id = '[record-id]'
   ORDER BY event_time ASC;
   ```

3. **Security Audit**
   ```sql
   SELECT ip_address, event_time, event_data
   FROM audit_events 
   WHERE event_type = 'security' 
   AND event_time > NOW() - INTERVAL '24 hours'
   ORDER BY event_time DESC;
   ```

---

### **SOP-003: Data Recovery Procedures**

#### **Scenario A: Accidental Data Deletion**

1. **Find Last Known Good State**
   ```sql
   SELECT old_data FROM audit_events 
   WHERE resource_type = '[table]' 
   AND resource_id = '[id]'
   AND event_action = 'delete'
   ORDER BY event_time DESC LIMIT 1;
   ```

2. **Restore Record**
   ```sql
   -- Extract data from old_data JSON and recreate record
   INSERT INTO [table] SELECT * FROM json_populate_record(
     null::[table], '[old_data_json]'::json
   );
   ```

#### **Scenario B: Orphaned Data (like the asset issue)**

1. **Find Original Owner**
   ```sql
   SELECT user_id FROM audit_events 
   WHERE resource_type = '[table]' 
   AND resource_id = '[id]'
   AND event_action = 'create'
   ORDER BY event_time ASC LIMIT 1;
   ```

2. **Restore Ownership**
   ```sql
   UPDATE [table] 
   SET user_id = (SELECT user_id FROM audit_events 
                  WHERE resource_type = '[table]' 
                  AND resource_id = [table].id::text
                  AND event_action = 'create'
                  ORDER BY event_time ASC LIMIT 1)
   WHERE user_id IS NULL;
   ```

---

### **SOP-004: Compliance Reporting**

#### **GDPR Article 30 - Record of Processing**
```sql
-- Personal data processing activities
SELECT DISTINCT 
  resource_type,
  event_action,
  COUNT(*) as operations,
  MIN(event_time) as first_processing,
  MAX(event_time) as last_processing
FROM audit_events 
WHERE resource_type IN ('app_users', 'beneficiaries')
GROUP BY resource_type, event_action;
```

#### **SOX Compliance - Financial Data Changes**
```sql
-- All changes to financial records
SELECT user_id, event_time, event_action, old_data, new_data
FROM audit_events 
WHERE resource_type = 'assets'
AND event_time >= '[audit_period_start]'
AND event_time <= '[audit_period_end]'
ORDER BY event_time ASC;
```

---

## 🔧 SYSTEM MAINTENANCE

### **Daily Operations**

1. **Audit Log Health Check**
   ```sql
   -- Verify audit system is working (should have recent entries)
   SELECT COUNT(*) as audit_entries_today 
   FROM audit_events 
   WHERE event_time >= CURRENT_DATE;
   
   -- Should be > 0 if system is active
   ```

2. **Backup Verification**
   ```bash
   # Check latest backup exists and has reasonable size
   ls -lah database-backups/ | head -5
   
   # Should show recent backups with non-zero sizes
   ```

### **Weekly Operations**

1. **Audit Log Analysis**
   ```sql
   -- Top activities this week
   SELECT resource_type, event_action, COUNT(*) 
   FROM audit_events 
   WHERE event_time >= NOW() - INTERVAL '7 days'
   GROUP BY resource_type, event_action 
   ORDER BY count DESC;
   ```

2. **Security Review**
   ```sql
   -- Failed operations this week
   SELECT COUNT(*) as failed_operations
   FROM audit_events 
   WHERE event_type = 'api_error'
   AND event_time >= NOW() - INTERVAL '7 days';
   ```

### **Monthly Operations**

1. **Backup Cleanup** (Automated, but verify)
   ```bash
   # Should automatically retain last 10 backups
   ls database-backups/*.sql | wc -l  # Should be ≤ 10
   ```

2. **Performance Review**
   ```sql
   -- Audit log growth rate
   SELECT 
     DATE(event_time) as date,
     COUNT(*) as daily_entries 
   FROM audit_events 
   WHERE event_time >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(event_time) 
   ORDER BY date DESC;
   ```

---

## 🚨 EMERGENCY PROCEDURES

### **DEFCON 1: Complete Data Loss**

**Immediate Actions:**

1. **STOP all operations**
   ```bash
   # Stop application to prevent further data loss
   pkill -f "npm run dev"
   ```

2. **Assess damage**
   ```bash
   npx tsx scripts/emergency-schema-recovery.ts
   ```

3. **Restore from latest backup**
   ```bash
   # Find latest backup
   ls -1t database-backups/*.sql | head -1
   
   # Restore (DESTRUCTIVE - will replace all data)
   psql "$POSTGRES_URL" < [latest-backup-file]
   ```

4. **Verify restoration**
   ```bash
   # Check critical tables exist and have data
   npm run db:studio  # Visual verification
   ```

### **DEFCON 2: Partial Data Loss**

1. **Identify scope**
   ```sql
   -- Check what data exists vs expected
   SELECT table_name, 
          (xpath('//text()', query_to_xml(format('SELECT COUNT(*) FROM %I', table_name), false, true, '')))[1]::text::int as row_count
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE';
   ```

2. **Use audit trail for recovery**
   ```sql
   -- Find affected records and their last known state
   -- Use SOP-003 procedures above
   ```

### **DEFCON 3: Audit System Failure**

1. **Diagnose audit system**
   ```sql
   -- Check if audit system is working
   INSERT INTO audit_events (user_id, event_type, event_action, resource_type) 
   VALUES (null, 'system', 'test', 'system');
   
   -- If this fails, audit system is broken
   ```

2. **Repair audit system**
   ```bash
   npx tsx scripts/fix-audit-system.ts
   ```

---

## 📊 MONITORING & ALERTS

### **Critical Metrics to Monitor**

1. **Audit Coverage**
   ```sql
   -- Should have entries for all major operations
   SELECT COUNT(*) FROM audit_events WHERE event_time >= CURRENT_DATE;
   ```

2. **Backup Freshness**
   ```bash
   # Latest backup should be < 24 hours old for active systems
   find database-backups/ -name "*.sql" -mtime -1 | wc -l
   ```

3. **Error Rates**
   ```sql
   SELECT COUNT(*) FROM audit_events 
   WHERE event_type = 'api_error' 
   AND event_time >= NOW() - INTERVAL '1 hour';
   ```

### **Alert Thresholds**

- **🚨 CRITICAL**: No audit entries in 1+ hours (system offline)
- **⚠️ WARNING**: Error rate > 10/hour (potential issues)  
- **ℹ️ INFO**: Backup older than 24 hours (schedule issue)

---

## 📚 TRAINING & CERTIFICATION

### **Required Knowledge for Operations Staff**

1. **SQL Proficiency** - Must understand audit log queries
2. **Backup/Restore** - Must be able to execute recovery procedures
3. **Compliance Requirements** - Must understand GDPR, SOX implications
4. **Emergency Procedures** - Must know DEFCON protocols

### **Certification Checklist**

- [ ] Successfully performed test backup and restore
- [ ] Demonstrated audit log investigation skills
- [ ] Completed emergency procedure simulation  
- [ ] Passed compliance reporting assessment

---

## 🔗 INTEGRATION GUIDELINES

### **For Developers**

```typescript
// Always include audit logging in new features
import { audit } from '@/lib/audit-middleware';

await audit.logUserAction(
  userId, 'feature_used', 'feature_name', resourceId, metadata
);
```

### **For API Development**

```typescript
// Use middleware for automatic audit logging
import { auditMiddleware } from '@/lib/audit-middleware';

export async function POST(request: NextRequest) {
  return auditMiddleware(request, async (req) => {
    // Your API logic here
    // Audit logging happens automatically
  });
}
```

---

## 📞 ESCALATION PROCEDURES

### **Support Levels**

**Level 1**: Operations Team
- Daily monitoring and maintenance
- Basic troubleshooting and recovery
- Scheduled backups and cleanups

**Level 2**: Development Team  
- Complex audit investigations
- Schema changes and migrations
- System modifications

**Level 3**: Architecture Team
- Emergency system recovery
- Compliance violations
- Major incident response

### **Emergency Contacts**

| Issue Type | Contact | Response Time |
|-----------|---------|---------------|
| Data Loss | Level 3 | 15 minutes |
| Compliance | Legal + Level 3 | 30 minutes |  
| Audit Failure | Level 2 | 1 hour |
| Performance | Level 1 | 4 hours |

---

**📋 DOCUMENT CONTROL**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-08-23 | Claude Code | Initial implementation |

**Next Review Date:** 2025-11-23  
**Document Owner:** CTO  
**Classification:** INTERNAL USE ONLY