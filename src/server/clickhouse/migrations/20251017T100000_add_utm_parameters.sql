-- Add UTM parameters to WebsiteEvent table
ALTER TABLE WebsiteEvent
  ADD COLUMN IF NOT EXISTS utmSource String NULL,
  ADD COLUMN IF NOT EXISTS utmMedium String NULL,
  ADD COLUMN IF NOT EXISTS utmCampaign String NULL,
  ADD COLUMN IF NOT EXISTS utmTerm String NULL,
  ADD COLUMN IF NOT EXISTS utmContent String NULL;
