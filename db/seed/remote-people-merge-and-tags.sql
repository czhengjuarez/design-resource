-- Portable version of merge-people-tags.sql + add-changying.sql +
-- cleanup-people-category.sql, written against slugs/titles instead of
-- hardcoded ids (which differ between local and remote D1 instances since
-- the Coda import relies on autoincrement).

-- 1. Move "People to follow 2" people into "People to follow"
UPDATE resources
SET category_id = (SELECT id FROM categories WHERE slug = 'people-to-follow')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'people-to-follow-2');

DELETE FROM categories WHERE slug = 'people-to-follow-2';

-- 2. Tag every person by specialty (matched by title — unique per person)
UPDATE resources SET tags = '["accessibility"]' WHERE title = 'Sheri Byrne-Haber (disabled)

 (She/Her)';
UPDATE resources SET tags = '["accessibility"]'                                    WHERE title = 'Joe Dolson';
UPDATE resources SET tags = '["accessibility","design leadership"]'                WHERE title = 'Derek Featherstone (He/Him)';
UPDATE resources SET tags = '["accessibility","inclusive design","design leadership"]' WHERE title = 'Kat Holmes';
UPDATE resources SET tags = '["accessibility","web standards"]'                    WHERE title = 'Léonie Watson';

UPDATE resources SET tags = '["design systems","design leadership"]'               WHERE title = 'Brad Frost';
UPDATE resources SET tags = '["design systems","design leadership"]'               WHERE title = 'Dan Mall';

UPDATE resources SET tags = '["designops","latam"]'                                WHERE title = 'Alexandra Mengoni León';
UPDATE resources SET tags = '["designops","design strategy"]'                      WHERE title = 'Alison Rand';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'John Calhoun';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Jon Fukuda';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Jake Geller';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Meredith Black';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Patrizia Bertini';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Peter Boersma';
UPDATE resources SET tags = '["designops"]'                                        WHERE title = 'Rachel Posman';
UPDATE resources SET tags = '["designops","creative ops","design leadership"]'     WHERE title = 'Susie Hall';
UPDATE resources SET tags = '["designops","creative ops"]'                         WHERE title = 'Perrie Schad';

UPDATE resources SET tags = '["research ops"]'                                     WHERE title = 'Kate Towsey';
UPDATE resources SET tags = '["ux research","design strategy"]'                    WHERE title = 'Erika Hall';
UPDATE resources SET tags = '["ux research"]'                                      WHERE title = 'Ruby Pryor';

UPDATE resources SET tags = '["design leadership","psychological safety"]'         WHERE title = 'Alla Weinberg';
UPDATE resources SET tags = '["design leadership"]'                                WHERE title = 'Doug Powell';
UPDATE resources SET tags = '["design leadership"]'                                WHERE title = 'Erin Weigel';
UPDATE resources SET tags = '["design leadership","design strategy"]'              WHERE title = 'Gordon Ching';
UPDATE resources SET tags = '["design leadership","design strategy"]'              WHERE title = 'Jason Mesut';
UPDATE resources SET tags = '["design leadership","design education"]'             WHERE title = 'Jay Peters';
UPDATE resources SET tags = '["design leadership"]'                                WHERE title = 'Jehad Affoneh';
UPDATE resources SET tags = '["design leadership","design education"]'             WHERE title = 'Josh Silverman';
UPDATE resources SET tags = '["design leadership","organizational design"]'        WHERE title = 'Peter Merholz';
UPDATE resources SET tags = '["design leadership"]'                                WHERE title = 'Rachel Kobetz';
UPDATE resources SET tags = '["design leadership","product"]'                      WHERE title = 'Richard Banfield';
UPDATE resources SET tags = '["design leadership","design history"]'               WHERE title = 'Scott Berkun';
UPDATE resources SET tags = '["design leadership"]'                                WHERE title = 'Silke Bochat';
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE title = 'Teresa Brazen, CPCC, ACC';
UPDATE resources SET tags = '["design leadership","recruiting"]'                   WHERE title = 'Tom Scott';
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE title = 'Sara Wachter-Boettcher';
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE title = 'Uta Knablein';

UPDATE resources SET tags = '["design strategy","ux"]'                             WHERE title = 'Jaime Levy';
UPDATE resources SET tags = '["design strategy","public sector"]'                  WHERE title = 'Wayne Suiter Matamoros';

UPDATE resources SET tags = '["design community","recruiting"]'                    WHERE title = 'Rob Magowan';
UPDATE resources SET tags = '["design publishing","design events"]'                WHERE title = 'Louis Rosenfeld';
UPDATE resources SET tags = '["design community","latam"]'                         WHERE title = 'Mariana Valenzuela';
UPDATE resources SET tags = '["public sector","latam"]'                            WHERE title = 'Mariana Salgado';

UPDATE resources SET tags = '["ai"]'                                               WHERE title = 'Mira Murati';
UPDATE resources SET tags = '["ai","design leadership"]'                           WHERE title = 'Roger Rohatgi';
UPDATE resources SET tags = '["ai","design strategy"]'                             WHERE title = 'Valerie Madden';

UPDATE resources SET tags = '["coaching","recruiting"]'                            WHERE title = 'Meg Rye';
UPDATE resources SET tags = '["mentorship","design"]'                              WHERE title = '🐱 Catt Small 👩🏾‍💻';
UPDATE resources SET tags = '["recruiting","design community"]'                    WHERE title = 'Laura Baker';

UPDATE resources SET tags = '["product management"]'                               WHERE title = 'John Cutler';
UPDATE resources SET tags = '["design"]'                                           WHERE title = 'Qin Li';
UPDATE resources SET tags = '["design"]'                                           WHERE title = 'Garron Engstrom';

-- 3. Clean Sheri's title (had embedded newlines from Coda import)
UPDATE resources SET title = 'Sheri Byrne-Haber (She/Her)'
WHERE title = 'Sheri Byrne-Haber (disabled)

 (She/Her)';

-- 4. Add Changying (Z) Zheng
INSERT INTO resources (title, description, url, category_id, type, tags, source, status)
VALUES (
  'Changying (Z) Zheng',
  'DesignOps leader and AI transformation specialist',
  'https://www.linkedin.com/in/changyingz/',
  (SELECT id FROM categories WHERE slug = 'people-to-follow'),
  'person',
  '["designops","ai transformation","design leadership"]',
  'manual',
  'published'
);

-- 5. Move two misplaced notes out of People to follow
UPDATE resources SET category_id = (SELECT id FROM categories WHERE slug = 'design-system')
WHERE title = 'Design System people etc';
UPDATE resources SET category_id = (SELECT id FROM categories WHERE slug = 'women-leadership')
WHERE title = 'Women speakers';
