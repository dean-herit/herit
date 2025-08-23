-- Add missing columns to beneficiaries table
ALTER TABLE "beneficiaries" ADD COLUMN "pps_number" varchar(20);
ALTER TABLE "beneficiaries" ADD COLUMN "photo_url" text;

-- Add missing column to signature_usage table
ALTER TABLE "signature_usage" ADD COLUMN "usage_metadata" jsonb;