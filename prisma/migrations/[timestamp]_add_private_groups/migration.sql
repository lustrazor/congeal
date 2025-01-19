-- RedefineTables
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDivider" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "iconName" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT 'gray',
    "viewMode" TEXT NOT NULL DEFAULT 'grid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Group" ("id", "name", "order", "isDivider", "iconName", "iconColor", "viewMode", "createdAt", "updatedAt") 
SELECT "id", "name", "order", "isDivider", "iconName", "iconColor", "viewMode", "createdAt", "updatedAt" 
FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE INDEX "Group_order_idx" ON "Group"("order");

CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Congeal',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "is_dark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "header_enabled" BOOLEAN NOT NULL DEFAULT false,
    "all_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "ungrouped_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "show_private_groups" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.00',
    "debug_mode" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("id", "title", "tagline", "is_dark", "headerImage", "header_enabled", "all_view_mode", "ungrouped_view_mode", "version", "debug_mode", "updated_at")
SELECT "id", "title", "tagline", "is_dark", "headerImage", "header_enabled", "all_view_mode", "ungrouped_view_mode", "version", "debug_mode", "updated_at"
FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON; 