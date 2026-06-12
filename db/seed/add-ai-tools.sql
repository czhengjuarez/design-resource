-- Add AI tools to the AI category (cat 7)
INSERT INTO resources (title, description, url, category_id, type, tags, source, status)
VALUES
  ('Claude', 'AI assistant and models from Anthropic', 'https://claude.ai', 7, 'tool', '[]', 'manual', 'published'),
  ('n8n', 'Workflow automation tool for connecting apps and AI agents', 'https://n8n.io', 7, 'tool', '[]', 'manual', 'published'),
  ('ChatGPT', 'AI chatbot and assistant from OpenAI', 'https://chatgpt.com', 7, 'tool', '[]', 'manual', 'published'),
  ('CrewAI', 'Framework for orchestrating role-playing autonomous AI agents', 'https://www.crewai.com', 7, 'tool', '[]', 'manual', 'published'),
  ('Google AI Studio', 'Web-based tool for prototyping with Google''s Gemini models', 'https://aistudio.google.com', 7, 'tool', '[]', 'manual', 'published'),
  ('agentskills.io', 'Directory of skills and agents for AI coding tools', 'https://agentskills.io', 7, 'tool', '[]', 'manual', 'published'),
  ('Kaggle', 'Community platform for data science and machine learning competitions and datasets', 'https://www.kaggle.com', 7, 'tool', '[]', 'manual', 'published'),
  ('NotebookLM', 'AI-powered research and note-taking tool from Google', 'https://notebooklm.google.com', 7, 'tool', '[]', 'manual', 'published'),
  ('Replit', 'Browser-based IDE with AI-assisted coding and app deployment', 'https://replit.com', 7, 'tool', '[]', 'manual', 'published'),
  ('Gamma', 'AI tool for creating presentations, docs, and webpages', 'https://gamma.app', 7, 'tool', '[]', 'manual', 'published'),
  ('ElevenLabs', 'AI voice generator and text-to-speech platform', 'https://elevenlabs.io', 7, 'tool', '[]', 'manual', 'published');
