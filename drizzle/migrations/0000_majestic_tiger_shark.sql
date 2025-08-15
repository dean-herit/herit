CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"asset_type" varchar(100) NOT NULL,
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
	"ip_address" varchar(45),
	"user_agent" text,
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
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family" uuid NOT NULL,
	"revoked" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signature_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signature_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_id" varchar(255),
	"context" jsonb,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"signature_type" varchar(50) NOT NULL,
	"data" text NOT NULL,
	"hash" varchar(255) NOT NULL,
	"signature_metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_used" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone_number" varchar(50),
	"date_of_birth" varchar(50),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"county" varchar(100),
	"eircode" varchar(20),
	"onboarding_status" varchar(50) DEFAULT 'not_started',
	"onboarding_current_step" varchar(50) DEFAULT 'personal_info',
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
	"verification_status" varchar(50),
	"auth_provider" varchar(50),
	"auth_provider_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
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
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_usage" ADD CONSTRAINT "signature_usage_signature_id_signatures_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."signatures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_usage" ADD CONSTRAINT "signature_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wills" ADD CONSTRAINT "wills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;