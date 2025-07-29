-- Supabase Database Schema for Starknet Founders Bot
-- Run these commands in your Supabase SQL editor

-- Create chat_messages table
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  founder_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  founder_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  founder_id TEXT NOT NULL,
  content TEXT,
  rating INTEGER,
  agent_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_founder_agent ON chat_messages(founder_id, agent_type);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_sessions_founder ON chat_sessions(founder_id);
CREATE INDEX idx_feedback_founder ON feedback(founder_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Enable real-time for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Row Level Security (RLS) policies
-- Note: Adjust these policies based on your authentication requirements

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Basic policies (you may want to customize these based on your auth setup)
-- Allow all operations for now (customize based on your needs)
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on chat_sessions" ON chat_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on feedback" ON feedback FOR ALL USING (true);

-- Example of more restrictive policies (uncomment and modify as needed):
-- CREATE POLICY "Users can only access their own messages" ON chat_messages FOR ALL USING (auth.uid()::text = founder_id);
-- CREATE POLICY "Users can only access their own sessions" ON chat_sessions FOR ALL USING (auth.uid()::text = founder_id);
-- CREATE POLICY "Users can only submit their own feedback" ON feedback FOR ALL USING (auth.uid()::text = founder_id); 