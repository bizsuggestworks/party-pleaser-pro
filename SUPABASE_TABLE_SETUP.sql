-- Create the evite_events table in Supabase
-- Run this SQL in your Supabase Dashboard: SQL Editor

CREATE TABLE IF NOT EXISTS evite_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'evite_events' AND column_name = 'user_id') THEN
    ALTER TABLE evite_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_evite_events_user_id ON evite_events(user_id);

-- Update RLS policies to allow users to manage their own events
DROP POLICY IF EXISTS "Allow public insert" ON evite_events;
CREATE POLICY "Allow authenticated users to insert their events" ON evite_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public update" ON evite_events;
CREATE POLICY "Allow users to update their own events or public update for RSVPs" ON evite_events
  FOR UPDATE
  USING (auth.uid() = user_id OR true); -- Users can update their own events, or anyone can update (for RSVPs)

DROP POLICY IF EXISTS "Allow public read access" ON evite_events;
CREATE POLICY "Allow public read access" ON evite_events
  FOR SELECT
  USING (true); -- Keep public read for invite links

