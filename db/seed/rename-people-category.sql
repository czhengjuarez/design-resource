-- Rename "People" -> "Developing People" to differentiate it from
-- "People to follow" in the navigation. Matched by slug + parent slug
-- (stable across local/remote D1 instances with different autoincrement ids).
UPDATE categories
SET name = 'Developing People', updated_at = current_timestamp
WHERE slug = 'people'
  AND parent_id = (SELECT id FROM categories WHERE slug = 'on-practice-people');
