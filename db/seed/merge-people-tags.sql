-- Merge "People to follow 2" (cat 59) into "People to follow" (cat 45)
-- and tag all people by specialty.
-- Apply: wrangler d1 execute design-resources --local --file=db/seed/merge-people-tags.sql

-- 1. Move cat-59 people to cat 45
UPDATE resources SET category_id = 45 WHERE category_id = 59;

-- 2. Delete cat 59 (now empty; parent was 45 so no reparenting needed)
DELETE FROM categories WHERE id = 59;

-- 3. Tag every person — derived from their descriptions
-- Accessibility specialists (from former cat 59)
UPDATE resources SET tags = '["accessibility"]'                                    WHERE id = 472; -- Sheri Byrne-Haber
UPDATE resources SET tags = '["accessibility"]'                                    WHERE id = 473; -- Joe Dolson
UPDATE resources SET tags = '["accessibility","design leadership"]'                WHERE id = 474; -- Derek Featherstone
UPDATE resources SET tags = '["accessibility","inclusive design","design leadership"]' WHERE id = 476; -- Kat Holmes
UPDATE resources SET tags = '["accessibility","web standards"]'                    WHERE id = 475; -- Léonie Watson

-- Design Systems
UPDATE resources SET tags = '["design systems","design leadership"]'               WHERE id = 829; -- Brad Frost
UPDATE resources SET tags = '["design systems","design leadership"]'               WHERE id = 824; -- Dan Mall

-- DesignOps
UPDATE resources SET tags = '["designops","latam"]'                                WHERE id = 858; -- Alexandra Mengoni León
UPDATE resources SET tags = '["designops","design strategy"]'                      WHERE id = 827; -- Alison Rand
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 820; -- John Calhoun
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 821; -- Jon Fukuda
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 834; -- Jake Geller
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 836; -- Meredith Black
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 826; -- Patrizia Bertini
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 832; -- Peter Boersma
UPDATE resources SET tags = '["designops"]'                                        WHERE id = 822; -- Rachel Posman
UPDATE resources SET tags = '["designops","creative ops","design leadership"]'     WHERE id = 841; -- Susie Hall
UPDATE resources SET tags = '["designops","creative ops"]'                         WHERE id = 853; -- Perrie Schad

-- Research Ops / UX Research
UPDATE resources SET tags = '["research ops"]'                                     WHERE id = 816; -- Kate Towsey
UPDATE resources SET tags = '["ux research","design strategy"]'                    WHERE id = 852; -- Erika Hall
UPDATE resources SET tags = '["ux research"]'                                      WHERE id = 830; -- Ruby Pryor

-- Design Leadership
UPDATE resources SET tags = '["design leadership","psychological safety"]'         WHERE id = 823; -- Alla Weinberg
UPDATE resources SET tags = '["design leadership"]'                                WHERE id = 849; -- Doug Powell
UPDATE resources SET tags = '["design leadership"]'                                WHERE id = 831; -- Erin Weigel
UPDATE resources SET tags = '["design leadership","design strategy"]'              WHERE id = 844; -- Gordon Ching
UPDATE resources SET tags = '["design leadership","design strategy"]'              WHERE id = 850; -- Jason Mesut
UPDATE resources SET tags = '["design leadership","design education"]'             WHERE id = 825; -- Jay Peters
UPDATE resources SET tags = '["design leadership"]'                                WHERE id = 815; -- Jehad Affoneh
UPDATE resources SET tags = '["design leadership","design education"]'             WHERE id = 845; -- Josh Silverman
UPDATE resources SET tags = '["design leadership","organizational design"]'        WHERE id = 846; -- Peter Merholz
UPDATE resources SET tags = '["design leadership"]'                                WHERE id = 817; -- Rachel Kobetz
UPDATE resources SET tags = '["design leadership","product"]'                      WHERE id = 848; -- Richard Banfield
UPDATE resources SET tags = '["design leadership","design history"]'               WHERE id = 851; -- Scott Berkun
UPDATE resources SET tags = '["design leadership"]'                                WHERE id = 860; -- Silke Bochat
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE id = 843; -- Teresa Brazen
UPDATE resources SET tags = '["design leadership","recruiting"]'                   WHERE id = 862; -- Tom Scott
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE id = 861; -- Sara Wachter-Boettcher
UPDATE resources SET tags = '["design leadership","coaching"]'                     WHERE id = 839; -- Uta Knablein

-- Design Strategy
UPDATE resources SET tags = '["design strategy","ux"]'                             WHERE id = 854; -- Jaime Levy
UPDATE resources SET tags = '["design strategy","public sector"]'                  WHERE id = 837; -- Wayne Suiter Matamoros

-- Community / Publishing / Events
UPDATE resources SET tags = '["design community","recruiting"]'                    WHERE id = 842; -- Rob Magowan
UPDATE resources SET tags = '["design publishing","design events"]'                WHERE id = 847; -- Louis Rosenfeld
UPDATE resources SET tags = '["design community","latam"]'                         WHERE id = 857; -- Mariana Valenzuela
UPDATE resources SET tags = '["public sector","latam"]'                            WHERE id = 856; -- Mariana Salgado

-- AI
UPDATE resources SET tags = '["ai"]'                                               WHERE id = 819; -- Mira Murati
UPDATE resources SET tags = '["ai","design leadership"]'                           WHERE id = 838; -- Roger Rohatgi
UPDATE resources SET tags = '["ai","design strategy"]'                             WHERE id = 855; -- Valerie Madden

-- Coaching / Recruiting / Mentorship
UPDATE resources SET tags = '["coaching","recruiting"]'                            WHERE id = 840; -- Meg Rye
UPDATE resources SET tags = '["mentorship","design"]'                              WHERE id = 833; -- Catt Small
UPDATE resources SET tags = '["recruiting","design community"]'                    WHERE id = 828; -- Laura Baker

-- Other
UPDATE resources SET tags = '["product management"]'                               WHERE id = 835; -- John Cutler
UPDATE resources SET tags = '["design"]'                                           WHERE id = 818; -- Qin Li
UPDATE resources SET tags = '["design"]'                                           WHERE id = 859; -- Garron Engstrom
