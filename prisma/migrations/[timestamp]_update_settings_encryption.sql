-- CreateTable
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
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy the data
INSERT INTO "new_Settings" (
    "id", "title", "tagline", "is_dark", "headerImage", 
    "header_enabled", "all_view_mode", "ungrouped_view_mode", 
    "version", "debug_mode", "updated_at"
)
SELECT 
    "id", "title", "tagline", "isDark", "headerImage",
    "headerEnabled", "allViewMode", "ungroupedViewMode",
    "version", false, CURRENT_TIMESTAMP
FROM "Settings";

-- Drop the old table
DROP TABLE "Settings";

-- Rename the new table to the old name
ALTER TABLE "new_Settings" RENAME TO "Settings";