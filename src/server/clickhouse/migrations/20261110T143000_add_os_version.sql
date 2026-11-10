ALTER TABLE WebsiteSession ADD COLUMN IF NOT EXISTS osVersion Nullable(String);
ALTER TABLE ApplicationSession ADD COLUMN IF NOT EXISTS osVersion Nullable(String);
