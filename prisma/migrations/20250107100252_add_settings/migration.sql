-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT 'Group Maker',
    "tagline" TEXT NOT NULL DEFAULT 'Create balanced groups with ease',
    "updatedAt" DATETIME NOT NULL
);
