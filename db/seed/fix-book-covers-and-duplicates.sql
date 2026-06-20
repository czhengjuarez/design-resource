-- Fix book covers and clean up duplicates

-- The Design Conductors (id 60): replace broken Coda URL with official site cover
UPDATE resources SET image_url = 'https://static.wixstatic.com/media/950168_e3dc576a15ff418296535dd7fe396f37~mv2.jpg/v1/crop/x_433,y_0,w_480,h_648/fill/w_283,h_383,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/ROSENFELD_24d_Design_Conductors_proof.jpg' WHERE id = 60;

-- What Is DesignOps (id 63): replace broken Coda URL with O'Reilly cover
UPDATE resources SET image_url = 'https://learning.oreilly.com/library/cover/9781492083023/250w/' WHERE id = 63;

-- Org Design for Design Orgs: remove duplicate (id 62, Coda image), keep id 164
-- Update id 164 with O'Reilly cover for consistency
UPDATE resources SET image_url = 'https://learning.oreilly.com/library/cover/9781491929179/250w/' WHERE id = 164;
DELETE FROM resources WHERE id = 62;

-- The Servant as Leader (id 173): fix URL (was Google Drive) and add cover
UPDATE resources
  SET url = 'https://greenleaf.org/product/the-servant-as-leader/',
      image_url = 'https://greenleaf.org/wp-content/uploads/2013/09/servant-as-leader.jpg'
  WHERE id = 173;
