-- SuyuFit Database Schema for Supabase

-- Logs table (food entries)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  name TEXT NOT NULL,
  carbs NUMERIC(10, 2) DEFAULT 0,
  protein NUMERIC(10, 2) DEFAULT 0,
  fat NUMERIC(10, 2) DEFAULT 0,
  fiber NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time TIME NOT NULL,
  exercise_name TEXT NOT NULL,
  sets JSONB NOT NULL, -- Array of {reps: number, weight: number}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profile table
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  weight NUMERIC(10, 2),
  height NUMERIC(10, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plan table (macro targets)
CREATE TABLE IF NOT EXISTS plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carbs NUMERIC(10, 2) DEFAULT 200,
  protein NUMERIC(10, 2) DEFAULT 150,
  fat NUMERIC(10, 2) DEFAULT 60,
  fiber NUMERIC(10, 2) DEFAULT 30,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);

-- Insert default profile
INSERT INTO profile (name, age, weight, height)
VALUES ('Suyu', 25, 70, 175)
ON CONFLICT DO NOTHING;

-- Insert default plan
INSERT INTO plan (carbs, protein, fat, fiber)
VALUES (200, 150, 60, 30)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) - Optional, but recommended
-- Since you don't want auth, we'll make tables publicly accessible
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (no auth needed)
CREATE POLICY "Allow all on logs" ON logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on workouts" ON workouts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on profile" ON profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plan" ON plan FOR ALL USING (true) WITH CHECK (true);
