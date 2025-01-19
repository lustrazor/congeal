-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Group Maker',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "isDark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "headerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allViewMode" TEXT NOT NULL DEFAULT 'grid',
    "ungroupedViewMode" TEXT NOT NULL DEFAULT 'grid',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("allViewMode", "headerImage", "id", "isDark", "tagline", "title", "ungroupedViewMode", "updatedAt") SELECT "allViewMode", "headerImage", "id", "isDark", "tagline", "title", "ungroupedViewMode", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
