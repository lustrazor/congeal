/*
  Warnings:

  - You are about to drop the column `allViewMode` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `debugMode` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `headerEnabled` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `isDark` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ungroupedViewMode` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Settings` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Congeal',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "is_dark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "header_enabled" BOOLEAN NOT NULL DEFAULT false,
    "all_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "ungrouped_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "version" TEXT NOT NULL DEFAULT '1.00',
    "debug_mode" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("headerImage", "id", "tagline", "title", "version") SELECT "headerImage", "id", "tagline", "title", "version" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
