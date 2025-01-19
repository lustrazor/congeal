-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mailbox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDivider" BOOLEAN NOT NULL DEFAULT false,
    "iconName" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT 'gray',
    "viewMode" TEXT NOT NULL DEFAULT 'grid',
    "email" TEXT,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "username" TEXT,
    "password" TEXT,
    "useSSL" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Mailbox" ("createdAt", "iconColor", "iconName", "id", "isDivider", "name", "order", "updatedAt", "viewMode") SELECT "createdAt", "iconColor", "iconName", "id", "isDivider", "name", "order", "updatedAt", "viewMode" FROM "Mailbox";
DROP TABLE "Mailbox";
ALTER TABLE "new_Mailbox" RENAME TO "Mailbox";
CREATE INDEX "Mailbox_order_idx" ON "Mailbox"("order");
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "title" TEXT NOT NULL DEFAULT 'Congeal',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "is_dark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "header_enabled" BOOLEAN NOT NULL DEFAULT true,
    "all_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "ungrouped_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "show_private_groups" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0.1',
    "debug_mode" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en'
);
INSERT INTO "new_Settings" ("all_view_mode", "debug_mode", "headerImage", "header_enabled", "id", "is_dark", "show_private_groups", "tagline", "title", "ungrouped_view_mode", "updated_at", "version") SELECT "all_view_mode", "debug_mode", "headerImage", "header_enabled", "id", "is_dark", "show_private_groups", "tagline", "title", "ungrouped_view_mode", "updated_at", "version" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
