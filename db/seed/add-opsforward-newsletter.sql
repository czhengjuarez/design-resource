-- Add OpsForward newsletter to DesignOps > Newsletters (cat 24)
INSERT INTO resources (title, description, url, category_id, type, tags, source, status)
VALUES (
  'OpsForward',
  'Newsletter on DesignOps practices, tools, and team operations',
  'https://changying.substack.com/',
  24,
  'newsletter',
  '["designops","newsletter"]',
  'manual',
  'published'
);
