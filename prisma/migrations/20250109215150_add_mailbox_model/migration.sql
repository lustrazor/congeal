/*
  Warnings:

  - You are about to drop the column `isDivider` on the `Mailbox` table. All the data in the column will be lost.
  - You are about to drop the column `lastSync` on the `Mailbox` table. All the data in the column will be lost.
  - You are about to drop the column `viewMode` on the `Mailbox` table. All the data in the column will be lost.
  - You are about to drop the column `iconName` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Message` table. All the data in the column will be lost.
  - Made the column `body` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mailboxId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mailbox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "iconName" TEXT,
    "iconColor" TEXT,
    "email" TEXT,
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "username" TEXT,
    "password" TEXT,
    "useSSL" BOOLEAN NOT NULL DEFAULT true,
    "useOAuth" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Mailbox" ("createdAt", "email", "iconColor", "iconName", "id", "imapHost", "imapPort", "name", "order", "password", "updatedAt", "useSSL", "username") SELECT "createdAt", "email", "iconColor", "iconName", "id", "imapHost", "imapPort", "name", "order", "password", "updatedAt", "useSSL", "username" FROM "Mailbox";
DROP TABLE "Mailbox";
ALTER TABLE "new_Mailbox" RENAME TO "Mailbox";
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mailboxId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("body", "createdAt", "id", "mailboxId", "subject", "updatedAt") SELECT "body", "createdAt", "id", "mailboxId", "subject", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
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
