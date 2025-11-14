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

