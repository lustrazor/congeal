-- AlterTable
ALTER TABLE "Group" ADD COLUMN "sortField" TEXT NOT NULL DEFAULT 'order';
ALTER TABLE "Group" ADD COLUMN "sortDirection" TEXT NOT NULL DEFAULT 'asc'; 