-- Merge RFP conferences (cat 18) into Conferences (cat 43)
-- Keep 5 unique good entries, drop the rest, then remove category 18

-- Move unique good entries to cat 43
UPDATE resources SET category_id = 43 WHERE id IN (
  222, -- The Human Insight Summit (THiS)
  233, -- World Usability Congress
  234, -- UXY'all (main site URL)
  237, -- UXStrat (main site URL)
  238  -- UXPA
);

-- Delete: archived/broken links, blog roundups, duplicates, and
-- weaker-URL entries superseded by the ones moved above
DELETE FROM resources WHERE id IN (
  221, -- PUSH UX (Wayback Machine)
  223, -- UX y'all (CFP URL — superseded by id 234)
  224, -- UX STRAT (strat.events URL — superseded by id 237)
  225, -- Elisa Design Summit (Wayback Machine)
  226, -- UXDX EMEA (year-specific URL — UXDX already in cat 43)
  227, -- UX CON' 24 (blog roundup link)
  228, -- UXDX APAC (blog roundup link)
  229, -- UXLx 2024 (blog roundup link)
  230, -- UXDX USA (blog roundup link)
  231, -- UX Copenhagen 2024 (blog roundup link)
  232, -- Elisa (careers page — not a conference)
  235, -- Refresh Conference (Wayback Machine)
  236, -- Hatch Conference (duplicate — already in cat 43)
  239, -- ConveyUX (Wayback Machine)
  240  -- PushUX (Wayback Machine duplicate of 221)
);

-- Delete the now-empty RFP category
DELETE FROM categories WHERE id = 18;
