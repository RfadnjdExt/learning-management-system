
-- Seed new badges for requested testing scenarios
INSERT INTO badges (slug, name, description, category, icon)
VALUES 
  ('hafal-juz-30', 'Hafidz Juz 30', 'Telah menyelesaikan hafalan Juz 30 dengan baik.', 'achievement', 'book-open'),
  ('streak-7-days', 'Rajin Mengaji (7 Hari)', 'Melakukan setoran hafalan selama 7 hari berturut-turut.', 'streak', 'flame')
ON CONFLICT (slug) DO NOTHING;
