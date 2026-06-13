-- Add ResearchOps Review substack to Research (cat 11)
INSERT INTO resources (title, description, url, category_id, type, tags, source, status)
VALUES (
  'The ResearchOps Review',
  'Newsletter on ResearchOps practices, tools, and team operations',
  'https://www.theresearchopsreview.com/',
  11,
  'article',
  '["researchops","newsletter"]',
  'manual',
  'published'
);
