-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "google_enabled" BOOLEAN NOT NULL DEFAULT false,
                      ADD COLUMN "outlook_enabled" BOOLEAN NOT NULL DEFAULT false; 