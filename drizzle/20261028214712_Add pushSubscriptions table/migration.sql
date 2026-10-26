CREATE TYPE "pushNotificationType" AS ENUM('MATCH_SCHEDULED', 'MATCH_STARTED', 'MATCH_FINISHED');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('ADMIN', 'MEMBER', 'VIEWER');--> statement-breakpoint
CREATE TABLE "pushSubscriptions" (
	"leagueUuid" uuid NOT NULL,
	"clientUuid" uuid NOT NULL,
	"role" "role" NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"notificationTypes" "pushNotificationType"[] DEFAULT ARRAY[]::"pushNotificationType"[] NOT NULL,
	"expiresAt" timestamp(6) with time zone NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pushSubscriptions_leagueUuid_index" ON "pushSubscriptions" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "pushSubscriptions_leagueUuid_clientUuid_index" ON "pushSubscriptions" ("leagueUuid","clientUuid") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "pushSubscriptions_leagueUuid_endpoint_index" ON "pushSubscriptions" ("leagueUuid","endpoint") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "pushSubscriptions_$createdAt_index" ON "pushSubscriptions" ("$createdAt");--> statement-breakpoint
CREATE INDEX "pushSubscriptions_$deletedAt_index" ON "pushSubscriptions" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
ALTER TABLE "pushSubscriptions" ADD CONSTRAINT "pushSubscriptions_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;