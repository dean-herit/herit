CREATE TYPE "public"."asset_type" AS ENUM('property', 'financial', 'personal', 'business', 'digital');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('email', 'google', 'apple');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'personal_info', 'signature', 'legal_consent', 'verification', 'completed');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step" AS ENUM('personal_info', 'signature', 'legal_consent', 'verification', 'completed');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('not_started', 'pending', 'requires_input', 'processing', 'verified', 'failed');--> statement-breakpoint
CREATE TABLE "asset_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"blob_url" text NOT NULL,
	"blob_pathname" text NOT NULL,
	"blob_download_url" text,
	"document_category" varchar(100) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"is_required" boolean DEFAULT false,
	"description" text,
	"expiry_date" date,
	"issue_date" date,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"value" real DEFAULT 0 NOT NULL,
	"description" text,
	"account_number" varchar(255),
	"bank_name" varchar(255),
	"property_address" text,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"event_action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" varchar(255),
	"event_data" jsonb,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"event_time" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"relationship_type" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"pps_number" varchar(20),
	"photo_url" text,
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"county" varchar(100),
	"eircode" varchar(20),
	"country" varchar(100) DEFAULT 'Ireland',
	"percentage" real,
	"specific_assets" jsonb,
	"conditions" text,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" varchar(100) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT false,
	"category" varchar(100) NOT NULL,
	"help_text" text,
	"example_formats" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inheritance_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"rule_definition" jsonb NOT NULL,
	"priority" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family" uuid NOT NULL,
	"revoked" boolean DEFAULT false,
	"revoked_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rule_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"allocation_percentage" real,
	"allocation_amount" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signature_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_id" varchar(255),
	"usage_metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"signature_type" varchar(50) NOT NULL,
	"data" text NOT NULL,
	"hash" varchar(255) NOT NULL,
	"font_name" varchar(100),
	"font_class_name" varchar(100),
	"signature_metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_used" timestamp
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone_number" varchar(50),
	"date_of_birth" varchar(50),
	"profile_photo_url" varchar(500),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"county" varchar(100),
	"eircode" varchar(20),
	"onboarding_status" "onboarding_status" DEFAULT 'not_started',
	"onboarding_current_step" "onboarding_step" DEFAULT 'personal_info',
	"onboarding_completed_at" timestamp,
	"personal_info_completed" boolean DEFAULT false,
	"personal_info_completed_at" timestamp,
	"signature_completed" boolean DEFAULT false,
	"signature_completed_at" timestamp,
	"legal_consent_completed" boolean DEFAULT false,
	"legal_consent_completed_at" timestamp,
	"legal_consents" jsonb,
	"verification_completed" boolean DEFAULT false,
	"verification_completed_at" timestamp,
	"verification_session_id" varchar(255),
	"verification_status" "verification_status",
	"onboarding_completed" boolean GENERATED ALWAYS AS (COALESCE(personal_info_completed, false) AND 
            COALESCE(signature_completed, false) AND 
            COALESCE(legal_consent_completed, false) AND 
            COALESCE(verification_completed, false)) STORED,
	"auth_provider" "auth_provider",
	"auth_provider_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'Last Will and Testament' NOT NULL,
	"will_type" varchar(100) DEFAULT 'simple',
	"content" text,
	"preferences" jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"legal_review_status" varchar(50),
	"legal_reviewer" varchar(255),
	"document_hash" varchar(255),
	"document_url" varchar(500),
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"finalized_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_log" ADD CONSTRAINT "document_audit_log_document_id_asset_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."asset_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inheritance_rules" ADD CONSTRAINT "inheritance_rules_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_refresh_tokens" ADD CONSTRAINT "app_refresh_tokens_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_allocations" ADD CONSTRAINT "rule_allocations_rule_id_inheritance_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."inheritance_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_allocations" ADD CONSTRAINT "rule_allocations_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_allocations" ADD CONSTRAINT "rule_allocations_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_usage" ADD CONSTRAINT "signature_usage_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_usage" ADD CONSTRAINT "signature_usage_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_user_id_idx" ON "assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" USING btree ("asset_type");--> statement-breakpoint
CREATE INDEX "assets_value_idx" ON "assets" USING btree ("value");--> statement-breakpoint
CREATE INDEX "assets_created_at_idx" ON "assets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assets_user_type_idx" ON "assets" USING btree ("user_id","asset_type");--> statement-breakpoint
CREATE INDEX "inheritance_rules_user_id_idx" ON "inheritance_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "inheritance_rules_active_idx" ON "inheritance_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "inheritance_rules_priority_idx" ON "inheritance_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "app_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_idx" ON "app_refresh_tokens" USING btree ("family");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "app_refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_hash_idx" ON "app_refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "rule_allocations_rule_id_idx" ON "rule_allocations" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "rule_allocations_asset_id_idx" ON "rule_allocations" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "rule_allocations_beneficiary_id_idx" ON "rule_allocations" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "app_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_onboarding_status_idx" ON "app_users" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "users_verification_status_idx" ON "app_users" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "users_auth_provider_idx" ON "app_users" USING btree ("auth_provider");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "app_users" USING btree ("created_at");