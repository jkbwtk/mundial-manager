CREATE TYPE "matchStatus" AS ENUM('SCHEDULED', 'ONGOING', 'PAUSED', 'FINISHED', 'CANCELED');--> statement-breakpoint
CREATE TABLE "balls" (
	"leagueUuid" uuid NOT NULL,
	"name" text NOT NULL,
	"alias" text NOT NULL,
	"description" text,
	"searchVectors" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', "balls"."name"), 'A') ||           setweight(to_tsvector('english', "balls"."alias"), 'B') ||           setweight(to_tsvector('english', coalesce("balls"."description", '')), 'C')) STORED NOT NULL,
	"color" text,
	"diameter" real,
	"weight" real,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goalTypes" (
	"leagueUuid" uuid NOT NULL,
	"parentUuid" uuid,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"stylePoints" integer DEFAULT 0 NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"name" text NOT NULL,
	"alias" text NOT NULL,
	"description" text,
	"rules" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchTimelines" (
	"leagueUuid" uuid NOT NULL,
	"matchUuid" uuid NOT NULL,
	"events" jsonb DEFAULT '[]' NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"leagueUuid" uuid NOT NULL,
	"tableUuid" uuid,
	"ballUuid" uuid,
	"startDate" timestamp(6) with time zone,
	"duration" double precision,
	"pauseDuration" double precision DEFAULT 0 NOT NULL,
	"side1Score" integer NOT NULL,
	"side2Score" integer NOT NULL,
	"side1TeamConfigurationUuid" uuid NOT NULL,
	"side2TeamConfigurationUuid" uuid NOT NULL,
	"playersSide1" uuid[] NOT NULL,
	"playersSide2" uuid[] NOT NULL,
	"side1PlayerPositions" jsonb DEFAULT '{}' NOT NULL,
	"side2PlayerPositions" jsonb DEFAULT '{}' NOT NULL,
	"spectators" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"status" "matchStatus" NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"syncId" text,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"leagueUuid" uuid NOT NULL,
	"name" text NOT NULL,
	"alias" text NOT NULL,
	"color" text NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"searchVectors" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', "players"."name"), 'A') ||           setweight(to_tsvector('english', "players"."alias"), 'B')) STORED NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"leagueUuid" uuid NOT NULL,
	"name" text NOT NULL,
	"startDate" timestamp(6) with time zone NOT NULL,
	"endDate" timestamp(6) with time zone NOT NULL,
	"config" jsonb NOT NULL,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statsFrames" (
	"leagueUuid" uuid,
	"matchUuid" uuid NOT NULL,
	"seq" integer,
	"day" text,
	"matchStartDate" timestamp(6) with time zone,
	"module" text,
	"bucket" text,
	"bucketKey" text,
	"subject" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "statsFrames_pkey" PRIMARY KEY("leagueUuid","module","bucket","bucketKey","subject","seq")
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"leagueUuid" uuid NOT NULL,
	"name" text NOT NULL,
	"alias" text NOT NULL,
	"description" text,
	"searchVectors" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', "tables"."name"), 'A') ||           setweight(to_tsvector('english', "tables"."alias"), 'B') ||           setweight(to_tsvector('english', coalesce("tables"."description", '')), 'C')) STORED NOT NULL,
	"side1Color" text NOT NULL,
	"side2Color" text NOT NULL,
	"location" text,
	"labels" jsonb DEFAULT '{}' NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teamConfigurations" (
	"leagueUuid" uuid NOT NULL,
	"playerUuids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"$createdAt" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"$updatedAt" timestamp(6) with time zone NOT NULL,
	"$deletedAt" timestamp(6) with time zone,
	"$updateCounter" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "balls_leagueUuid_index" ON "balls" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "balls_leagueUuid_name_index" ON "balls" ("leagueUuid","name");--> statement-breakpoint
CREATE INDEX "balls_searchVectors_index" ON "balls" USING gin ("searchVectors");--> statement-breakpoint
CREATE INDEX "balls_$createdAt_index" ON "balls" ("$createdAt");--> statement-breakpoint
CREATE INDEX "balls_$deletedAt_index" ON "balls" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "goalTypes_leagueUuid_index" ON "goalTypes" ("leagueUuid");--> statement-breakpoint
CREATE INDEX "goalTypes_parentUuid_index" ON "goalTypes" ("parentUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "goalTypes_leagueUuid_key_index" ON "goalTypes" ("leagueUuid","key") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "goalTypes_$createdAt_index" ON "goalTypes" ("$createdAt");--> statement-breakpoint
CREATE INDEX "goalTypes_$deletedAt_index" ON "goalTypes" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "leagues_name_index" ON "leagues" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "leagues_alias_index" ON "leagues" ("alias");--> statement-breakpoint
CREATE INDEX "leagues_$createdAt_index" ON "leagues" ("$createdAt");--> statement-breakpoint
CREATE INDEX "leagues_$deletedAt_index" ON "leagues" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "matchTimelines_leagueUuid_index" ON "matchTimelines" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "matchTimelines_matchUuid_index" ON "matchTimelines" ("matchUuid");--> statement-breakpoint
CREATE INDEX "matchTimelines_$createdAt_index" ON "matchTimelines" ("$createdAt");--> statement-breakpoint
CREATE INDEX "matchTimelines_$deletedAt_index" ON "matchTimelines" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "matches_leagueUuid_index" ON "matches" ("leagueUuid");--> statement-breakpoint
CREATE INDEX "matches_tableUuid_index" ON "matches" ("tableUuid");--> statement-breakpoint
CREATE INDEX "matches_ballUuid_index" ON "matches" ("ballUuid");--> statement-breakpoint
CREATE INDEX "matches_startDate_index" ON "matches" ("startDate");--> statement-breakpoint
CREATE INDEX "matches_status_index" ON "matches" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_leagueUuid_syncId_index" ON "matches" ("leagueUuid","syncId") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "matches_$createdAt_index" ON "matches" ("$createdAt");--> statement-breakpoint
CREATE INDEX "matches_$deletedAt_index" ON "matches" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "players_leagueUuid_index" ON "players" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "players_leagueUuid_name_index" ON "players" ("leagueUuid","name");--> statement-breakpoint
CREATE UNIQUE INDEX "players_leagueUuid_alias_index" ON "players" ("leagueUuid","alias");--> statement-breakpoint
CREATE INDEX "players_searchVectors_index" ON "players" USING gin ("searchVectors");--> statement-breakpoint
CREATE INDEX "players_$createdAt_index" ON "players" ("$createdAt");--> statement-breakpoint
CREATE INDEX "players_$deletedAt_index" ON "players" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "seasons_leagueUuid_index" ON "seasons" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_leagueUuid_name_index" ON "seasons" ("leagueUuid","name");--> statement-breakpoint
CREATE INDEX "seasons_$createdAt_index" ON "seasons" ("$createdAt");--> statement-breakpoint
CREATE INDEX "seasons_$deletedAt_index" ON "seasons" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "statsFrames_leagueUuid_seq_index" ON "statsFrames" ("leagueUuid","seq");--> statement-breakpoint
CREATE INDEX "statsFrames_matchUuid_index" ON "statsFrames" ("matchUuid") WHERE "module" = 'CONTEXT';--> statement-breakpoint
CREATE INDEX "tables_leagueUuid_index" ON "tables" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "tables_leagueUuid_name_index" ON "tables" ("leagueUuid","name");--> statement-breakpoint
CREATE INDEX "tables_searchVectors_index" ON "tables" USING gin ("searchVectors");--> statement-breakpoint
CREATE INDEX "tables_$createdAt_index" ON "tables" ("$createdAt");--> statement-breakpoint
CREATE INDEX "tables_$deletedAt_index" ON "tables" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
CREATE INDEX "teamConfigurations_leagueUuid_index" ON "teamConfigurations" ("leagueUuid");--> statement-breakpoint
CREATE UNIQUE INDEX "teamConfigurations_leagueUuid_playerUuids_index" ON "teamConfigurations" ("leagueUuid","playerUuids");--> statement-breakpoint
CREATE INDEX "teamConfigurations_playerUuids_index" ON "teamConfigurations" USING gin ("playerUuids");--> statement-breakpoint
CREATE INDEX "teamConfigurations_$createdAt_index" ON "teamConfigurations" ("$createdAt");--> statement-breakpoint
CREATE INDEX "teamConfigurations_$deletedAt_index" ON "teamConfigurations" ("$deletedAt") WHERE ("$deletedAt" is null);--> statement-breakpoint
ALTER TABLE "balls" ADD CONSTRAINT "balls_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "goalTypes" ADD CONSTRAINT "goalTypes_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "goalTypes" ADD CONSTRAINT "goalTypes_parentUuid_goalTypes_uuid_fkey" FOREIGN KEY ("parentUuid") REFERENCES "goalTypes"("uuid") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "matchTimelines" ADD CONSTRAINT "matchTimelines_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "matchTimelines" ADD CONSTRAINT "matchTimelines_matchUuid_matches_uuid_fkey" FOREIGN KEY ("matchUuid") REFERENCES "matches"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tableUuid_tables_uuid_fkey" FOREIGN KEY ("tableUuid") REFERENCES "tables"("uuid") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_ballUuid_balls_uuid_fkey" FOREIGN KEY ("ballUuid") REFERENCES "balls"("uuid") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_side1TeamConfigurationUuid_teamConfigurations_uuid_fkey" FOREIGN KEY ("side1TeamConfigurationUuid") REFERENCES "teamConfigurations"("uuid") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_side2TeamConfigurationUuid_teamConfigurations_uuid_fkey" FOREIGN KEY ("side2TeamConfigurationUuid") REFERENCES "teamConfigurations"("uuid") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "statsFrames" ADD CONSTRAINT "statsFrames_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "statsFrames" ADD CONSTRAINT "statsFrames_matchUuid_matches_uuid_fkey" FOREIGN KEY ("matchUuid") REFERENCES "matches"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "teamConfigurations" ADD CONSTRAINT "teamConfigurations_leagueUuid_leagues_uuid_fkey" FOREIGN KEY ("leagueUuid") REFERENCES "leagues"("uuid") ON DELETE CASCADE;