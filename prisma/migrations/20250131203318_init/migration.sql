-- CreateTable
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDivider" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "iconName" TEXT,
    "iconColor" TEXT NOT NULL DEFAULT 'gray',
    "viewMode" TEXT NOT NULL DEFAULT 'grid',
    "sortField" TEXT NOT NULL DEFAULT 'order',
    "sortDirection" TEXT NOT NULL DEFAULT 'asc',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'gray',
    "iconName" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "useStatusColor" BOOLEAN NOT NULL DEFAULT true,
    "dueAt" DATETIME,
    "groupId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "title" TEXT NOT NULL DEFAULT 'Congeal',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "is_dark" BOOLEAN NOT NULL DEFAULT false,
    "headerImage" TEXT,
    "header_enabled" BOOLEAN NOT NULL DEFAULT true,
    "all_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "ungrouped_view_mode" TEXT NOT NULL DEFAULT 'grid',
    "show_private_groups" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0.25',
    "debug_mode" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "google_enabled" BOOLEAN NOT NULL DEFAULT false,
    "outlook_enabled" BOOLEAN NOT NULL DEFAULT false,
    "all_sort_field" TEXT NOT NULL DEFAULT 'order',
    "all_sort_direction" TEXT NOT NULL DEFAULT 'asc',
    "ungrouped_sort_field" TEXT NOT NULL DEFAULT 'order',
    "ungrouped_sort_direction" TEXT NOT NULL DEFAULT 'asc'
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "encryptionSalt" TEXT,
    "resetToken" TEXT,
    "resetTokenExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quote" TEXT NOT NULL,
    "thinker" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mailbox" (
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

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mailboxId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Group_order_idx" ON "Group"("order");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
