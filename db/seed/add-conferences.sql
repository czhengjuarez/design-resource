-- Add Conferences category under Design Events (cat 4)
INSERT INTO categories (name, slug, parent_id, sort_order)
VALUES ('Conferences', 'conferences', 4, 2);

-- Add 14 conference resources (category_id resolved by slug)
INSERT INTO resources (title, url, category_id, type, tags, source, status)
VALUES
  ('Hatch Conference',
   'https://www.hatchconference.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["design leadership","conference"]', 'manual', 'published'),

  ('DesignOps Summit (Rosenfeld)',
   'https://rosenfeldmedia.com/designopssummit2018',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["designops","conference"]', 'manual', 'published'),

  ('Advancing Research (Rosenfeld)',
   'https://rosenfeldmedia.com/advancing-research-2021',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["research","conference"]', 'manual', 'published'),

  ('Design at Scale (Rosenfeld)',
   'https://rosenfeldmedia.com/design-at-scale-2021',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["design systems","conference"]', 'manual', 'published'),

  ('The DesignOps Global Conference',
   'https://www.designops-conference.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["designops","conference"]', 'manual', 'published'),

  ('Clarity Conference',
   'https://www.clarityconf.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["design systems","conference"]', 'manual', 'published'),

  ('UXDX',
   'https://uxdx.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["ux","conference"]', 'manual', 'published'),

  ('IxDA',
   'https://ixda.org',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["interaction design","conference"]', 'manual', 'published'),

  ('Into Design Systems',
   'https://www.intodesignsystems.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["design systems","conference"]', 'manual', 'published'),

  ('UX+Dev Summit',
   'https://www.uxdsummit.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["ux","conference"]', 'manual', 'published'),

  ('SXSW',
   'https://www.sxsw.com',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["design","conference"]', 'manual', 'published'),

  ('DesignOps Conference (Henry Stewart)',
   'https://www.henrystewartconferences.com/events/designops',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["designops","conference"]', 'manual', 'published'),

  ('Creative Operations Europe',
   'https://www.henrystewartconferences.com/events/creative-ops',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["designops","conference"]', 'manual', 'published'),

  ('Design Operations Symposium',
   'https://www.henrystewartconferences.com/events/design-ops',
   (SELECT id FROM categories WHERE slug='conferences'),
   'event', '["designops","conference"]', 'manual', 'published');
