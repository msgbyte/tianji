ALTER TABLE WebsiteEvent
  ADD COLUMN IF NOT EXISTS distinctId Nullable(UUID);
