-- CreateTable
CREATE TABLE "Mailbox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDivider" BOOLEAN NOT NULL DEFAULT false,
    "iconName" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT 'gray',
    "viewMode" TEXT NOT NULL DEFAULT 'grid',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'envelope',
    "order" INTEGER NOT NULL DEFAULT 0,
    "mailboxId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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

-- CreateIndex
CREATE INDEX "Mailbox_order_idx" ON "Mailbox"("order");

-- CreateIndex
CREATE INDEX "Message_mailboxId_idx" ON "Message"("mailboxId");

-- CreateIndex
CREATE INDEX "Message_order_idx" ON "Message"("order");
