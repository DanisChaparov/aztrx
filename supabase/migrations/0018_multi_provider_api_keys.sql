-- Add OpenAI and Gemini API key columns alongside the existing Anthropic one.
-- Free-tier users can bring any of the three and the assistant auto-selects.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS openai_api_key text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gemini_api_key text;
