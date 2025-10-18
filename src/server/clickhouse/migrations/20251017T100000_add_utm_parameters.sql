-- Add UTM parameters to WebsiteEvent table
ALTER TABLE WebsiteEvent
  ADD COLUMN IF NOT EXISTS utmSource Nullable(String),
  ADD COLUMN IF NOT EXISTS utmMedium Nullable(String),
  ADD COLUMN IF NOT EXISTS utmCampaign Nullable(String),
  ADD COLUMN IF NOT EXISTS utmTerm Nullable(String),
  ADD COLUMN IF NOT EXISTS utmContent Nullable(String);
