-- Final cleanup of People to follow (cat 45):
-- 1. Clean Sheri Byrne-Haber's title (had embedded newlines from Coda import)
-- 2. Move two misplaced notes out to their proper categories

UPDATE resources SET title = 'Sheri Byrne-Haber (She/Her)' WHERE id = 472;

UPDATE resources SET category_id = 67 WHERE id = 901; -- "Design System people etc" -> Design System
UPDATE resources SET category_id = 58 WHERE id = 902; -- "Women speakers" -> Women Leadership
