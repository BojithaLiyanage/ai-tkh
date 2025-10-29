-- Update chatbot_conversations table structure

-- First, clear the table to avoid conflicts (since we're changing the structure)
TRUNCATE TABLE chatbot_conversations CASCADE;

-- Drop old columns if they exist
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS question CASCADE;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS answer CASCADE;
ALTER TABLE chatbot_conversations DROP COLUMN IF EXISTS response_time_ms CASCADE;

-- Add new columns
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]';
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE chatbot_conversations ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;

-- Add unique constraint to session_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_chatbot_conversations_session_id'
    ) THEN
        ALTER TABLE chatbot_conversations
        ADD CONSTRAINT uq_chatbot_conversations_session_id UNIQUE (session_id);
    END IF;
END$$;
