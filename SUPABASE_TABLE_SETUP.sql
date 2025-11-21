-- Create the evite_events table in Supabase
-- Run this SQL in your Supabase Dashboard: SQL Editor

CREATE TABLE IF NOT EXISTS evite_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  host_name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  template TEXT DEFAULT 'classic',
  guests JSONB DEFAULT '[]'::jsonb,
  use_custom_images BOOLEAN DEFAULT false,
  custom_style TEXT,
  custom_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - make events publicly readable
ALTER TABLE evite_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read events (for invite links)
CREATE POLICY "Allow public read access" ON evite_events
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert events
CREATE POLICY "Allow public insert" ON evite_events
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update events (for RSVPs)
CREATE POLICY "Allow public update" ON evite_events
  FOR UPDATE
  USING (true);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_evite_events_id ON evite_events(id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_evite_events_created_at ON evite_events(created_at DESC);

-- If table already exists, add missing columns
DO $$ 
BEGIN
  -- Add use_custom_images column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evite_events' AND column_name = 'use_custom_images') THEN
    ALTER TABLE evite_events ADD COLUMN use_custom_images BOOLEAN DEFAULT false;
  END IF;
  
  -- Add custom_style column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evite_events' AND column_name = 'custom_style') THEN
    ALTER TABLE evite_events ADD COLUMN custom_style TEXT;
  END IF;
  
  -- Add custom_images column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evite_events' AND column_name = 'custom_images') THEN
    ALTER TABLE evite_events ADD COLUMN custom_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

