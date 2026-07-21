-- Adds nullable operational coordinates for maps. Existing records continue to work without coordinates.
ALTER TABLE partners ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_latitude double precision;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_longitude double precision;

ALTER TABLE donation_submissions ADD COLUMN IF NOT EXISTS pickup_latitude double precision;
ALTER TABLE donation_submissions ADD COLUMN IF NOT EXISTS pickup_longitude double precision;
