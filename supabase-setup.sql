-- TechDesk IT Support - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
-- Allow anyone to insert tickets (for the public form)
CREATE POLICY "Allow public ticket submission" ON tickets
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read tickets (for admin dashboard - consider restricting this)
CREATE POLICY "Allow public ticket reading" ON tickets
  FOR SELECT USING (true);

-- Allow anyone to update tickets (for admin dashboard - consider restricting this)
CREATE POLICY "Allow public ticket updates" ON tickets
  FOR UPDATE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();