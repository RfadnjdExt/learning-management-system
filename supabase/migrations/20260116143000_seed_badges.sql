-- Seed Badges
insert into public.badges (slug, name, description, icon, category) values
  ('first-step', 'Langkah Pertama', 'Menyelesaikan evaluasi hafalan pertama', 'star', 'Milestone'),
  ('high-achiever', 'Penghafal Rajin', 'Menyelesaikan 10 sesi evaluasi', 'trophy', 'Milestone'),
  ('half-century', 'Setengah Abad', 'Mencapai 50 sesi evaluasi', 'crown', 'Milestone'),
  ('juz-30', 'Hafidz Juz 30', 'Menyelesaikan hafalan Juz 30', 'medal', 'Hafalan'),
  ('streak-7', 'Istiqomah Mingguan', 'Menghafal 7 hari berturut-turut', 'zap', 'Keaktifan')
on conflict (slug) do nothing;
