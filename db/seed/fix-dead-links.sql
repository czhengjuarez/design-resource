-- Fix dead links found via automated check (2026-06-07)
-- Matched by original URL (stable across local/remote D1 instances)

-- [789] https://playbook.ebay.com
UPDATE resources SET url = 'https://playbook.ebay.com', updated_at = current_timestamp WHERE url = 'https://playbook.ebay.com```';

-- [799] Queensland Health
UPDATE resources SET url = 'https://lnkd.in/eC4FCkMi', updated_at = current_timestamp WHERE url = 'https://lnkd.in/eC4FCkMi👍';

-- [863] Research Ops
UPDATE resources SET url = 'https://researchops-community.slack.com', updated_at = current_timestamp WHERE url = 'https://ResearchOpsresearchops-community.slack.com';

-- [455] This WCAG 2.1
UPDATE resources SET url = 'http://web.archive.org/web/20220928103815/https://wcag-filter-tool.com/', updated_at = current_timestamp WHERE url = 'https://wcag-filter-tool.com/';

-- [457] Mismatch
UPDATE resources SET url = 'http://web.archive.org/web/20221001100436/https://katholmesdesign.com/the-book', updated_at = current_timestamp WHERE url = 'https://katholmesdesign.com/the-book';

-- [493] DesignOps Blog
UPDATE resources SET url = 'http://web.archive.org/web/20210729174146/https://www.abstract.com/category/design-ops', updated_at = current_timestamp WHERE url = 'https://www.abstract.com/category/design-ops';

-- [489] DeisgnOps at Airbnb
UPDATE resources SET url = 'http://web.archive.org/web/20240304025207/https://airbnb.design/designops-airbnb/', updated_at = current_timestamp WHERE url = 'https://airbnb.design/designops-airbnb/';

-- [565] UX library
UPDATE resources SET url = 'http://web.archive.org/web/20260125114435/https://www.kickassux.com/ux-library', updated_at = current_timestamp WHERE url = 'https://www.kickassux.com/ux-library';

-- [676] Elisa Design Summit
UPDATE resources SET url = 'http://web.archive.org/web/20241126093239/https://www.elisadesignsummit.com/', updated_at = current_timestamp WHERE url = 'https://www.elisadesignsummit.com/';

-- [690] ConveyUX
UPDATE resources SET url = 'http://web.archive.org/web/20260218085131/https://conveyux.com/', updated_at = current_timestamp WHERE url = 'https://conveyux.com/';

-- [672] PUSH UX
UPDATE resources SET url = 'http://web.archive.org/web/20240417070612/https://push-conference.com/call-for-proposals/main-stage-talk', updated_at = current_timestamp WHERE url = 'https://push-conference.com/call-for-proposals/main-stage-talk';

-- [691] PushUX
UPDATE resources SET url = 'http://web.archive.org/web/20260207133126/https://push-conference.com/ux-2023', updated_at = current_timestamp WHERE url = 'https://push-conference.com/ux-2023/';

-- [744] Types of Org Culture
UPDATE resources SET url = 'http://web.archive.org/web/20260122231743/https://www.ourculturecafe.com/types-of-org-cultures/', updated_at = current_timestamp WHERE url = 'https://www.ourculturecafe.com/types-of-org-cultures/';

-- [698] 4 Tips for Mastering the Art of Reading the Room
UPDATE resources SET url = 'http://web.archive.org/web/20250116055809/https://www.iqoffices.com/blog/reading-the-room/', updated_at = current_timestamp WHERE url = 'https://www.iqoffices.com/blog/reading-the-room/';

-- [871] Design Ops 101
UPDATE resources SET url = 'http://web.archive.org/web/20240917220558/https://www.designopsassembly.com/about', updated_at = current_timestamp WHERE url = 'https://designopsassembly.com/about';

-- [900] How to approach and conduct difficult conversation
UPDATE resources SET url = 'http://web.archive.org/web/20230131223915/https://bradhurstia.com/2016/06/08/balancing-inquiry-and-advocacy-in-educational-systems/', updated_at = current_timestamp WHERE url = 'https://bradhurstia.com/2016/06/08/balancing-inquiry-and-advocacy-in-educational-systems/';

-- [887] Finding Users
UPDATE resources SET url = 'http://web.archive.org/web/20230130173428/https://joinlearners.com/talk/how-to-break-the-barrier-of-finding-users-and-talking-to-them-in-early-stage-tech-startup-product', updated_at = current_timestamp WHERE url = 'https://joinlearners.com/talk/how-to-break-the-barrier-of-finding-users-and-talking-to-them-in-early-stage-tech-startup-product';

-- [686] Refresh Conference
UPDATE resources SET url = 'http://web.archive.org/web/20240714141133/https://refresh.rocks/', updated_at = current_timestamp WHERE url = 'https://refresh.rocks/';

-- [727] Misunderstood corporate values may have side effects
UPDATE resources SET url = 'http://web.archive.org/web/20250213070006/https://droppingclaims.health/p/warning-misunderstood-corporate-values', updated_at = current_timestamp WHERE url = 'https://droppingclaims.health/p/warning-misunderstood-corporate-values?subscribe_prompt=free';

-- [719] The Art of Being Helpful: Mentor vs. Coach vs. Advisor vs. Sponsor - Edge for Scholars
UPDATE resources SET url = 'http://web.archive.org/web/20250119125911/https://edgeforscholars.org/the-art-of-being-helpful-mentor-vs-coach-vs-advisor-vs-sponsor/', updated_at = current_timestamp WHERE url = 'https://edgeforscholars.org/the-art-of-being-helpful-mentor-vs-coach-vs-advisor-vs-sponsor/';

-- [779] The Art of Being Helpful: Mentor vs. Coach vs. Advisor vs. Sponsor - Edge for Scholars
UPDATE resources SET url = 'http://web.archive.org/web/20250119125911/https://edgeforscholars.org/the-art-of-being-helpful-mentor-vs-coach-vs-advisor-vs-sponsor/', updated_at = current_timestamp WHERE url = 'https://edgeforscholars.org/the-art-of-being-helpful-mentor-vs-coach-vs-advisor-vs-sponsor/';
