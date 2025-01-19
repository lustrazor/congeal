-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT true,
    "encryptionSalt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Congeal',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "isDark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "headerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allViewMode" TEXT NOT NULL DEFAULT 'grid',
    "ungroupedViewMode" TEXT NOT NULL DEFAULT 'grid',
    "version" TEXT NOT NULL DEFAULT '1.00',
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("allViewMode", "headerEnabled", "headerImage", "id", "isDark", "tagline", "title", "ungroupedViewMode", "updatedAt") SELECT "allViewMode", "headerEnabled", "headerImage", "id", "isDark", "tagline", "title", "ungroupedViewMode", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
