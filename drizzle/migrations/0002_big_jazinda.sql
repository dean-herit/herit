CREATE TABLE "app_refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family" uuid NOT NULL,
	"revoked" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
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
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "refresh_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "assets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "signature_usage" DROP CONSTRAINT "signature_usage_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "signatures" DROP CONSTRAINT "signatures_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "wills" DROP CONSTRAINT "wills_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "app_refresh_tokens" ADD CONSTRAINT "app_refresh_tokens_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_usage" ADD CONSTRAINT "signature_usage_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wills" ADD CONSTRAINT "wills_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;