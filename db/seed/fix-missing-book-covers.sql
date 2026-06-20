-- Fix covers and URLs for books missing thumbnails
-- 6 covers found; 5 still need manual lookup (marked below)

-- Change-Maker (474) - Rosenfeld/Two Waves, cover from Amazon CDN
UPDATE resources SET
  url = 'https://rosenfeldmedia.com/books/changemakers/',
  image_url = 'https://images-na.ssl-images-amazon.com/images/P/1959029142.01._SCLZZZZZZZ_.jpg'
WHERE id = 474;

-- Farther Faster and Far Less Drama (480) - BenBella Books
UPDATE resources SET
  url = 'https://benbellabooks.com/shop/farther-faster-and-far-less-drama/',
  image_url = 'https://benbellabooks.com/wp-content/uploads/2022/07/farther-faster-far-less-drama-1-380x570.jpg'
WHERE id = 480;

-- Influence Is Your Superpower (483) - Random House, cover from Amazon CDN
UPDATE resources SET
  url = 'https://www.zoechance.com',
  image_url = 'https://images-na.ssl-images-amazon.com/images/P/1984854356.01._SCLZZZZZZZ_.jpg'
WHERE id = 483;

-- Rise of the DEO (493) - Amazon page provided by user
UPDATE resources SET
  url = 'https://www.amazon.com/Rise-DEO-Leadership-Design-Voices/dp/0321934393',
  image_url = 'https://images-na.ssl-images-amazon.com/images/P/0321934393.01._SCLZZZZZZZ_.jpg'
WHERE id = 493;

-- Start-Up Factory (497) - Corporate Rebels official site
UPDATE resources SET
  url = 'https://www.corporate-rebels.com/books/start-up-factory',
  image_url = 'https://corporate-rebels.imgix.net/books/Start-up-Factory-main.jpg?auto=compress,format&fit=clip&h=320&w=260'
WHERE id = 497;

-- The Toyota Way to Lean Leadership (505) - Amazon CDN
UPDATE resources SET
  url = 'https://www.amazon.com/Toyota-Way-Lean-Leadership-Development/dp/0071780785',
  image_url = 'https://images-na.ssl-images-amazon.com/images/P/0071780785.01._SCLZZZZZZZ_.jpg'
WHERE id = 505;

-- Speak-Up Culture (496) - author site (cover not found, URL updated)
UPDATE resources SET url = 'https://www.shedinspires.com/book' WHERE id = 496;

-- Navigating the Politics of UX (487) - Rosenfeld (cover not found, URL updated)
UPDATE resources SET url = 'https://rosenfeldmedia.com/books/navigating-the-politics-of-ux/' WHERE id = 487;

-- Present Yourself (492) - Rosenfeld (cover not found, URL updated)
UPDATE resources SET url = 'https://rosenfeldmedia.com/books/present-yourself/' WHERE id = 492;

-- Rituals Roadmap (494) - Rosenfeld (cover not found, URL updated)
UPDATE resources SET url = 'https://rosenfeldmedia.com/books/rituals-roadmap/' WHERE id = 494;

-- The Gervais Principle (502) - Ribbonfarm (cover not found, URL updated)
UPDATE resources SET url = 'https://www.ribbonfarm.com/the-gervais-principle/' WHERE id = 502;
