
-- Seed common Tahfidz evaluation templates
-- Corrected: Removed 'type' column as it doesn't exist in schema
INSERT INTO evaluation_templates (name, description, institution_id)
SELECT 
  t.name, 
  t.description, 
  (SELECT id FROM institutions LIMIT 1) as institution_id
FROM (VALUES
  ('Hafalan Baru (Sabaq)', 'Setoran hafalan baru hari ini'),
  ('Murojaah Harian (Manzil)', 'Mengulang hafalan lama agar tidak lupa'),
  ('Mengulang Hafalan Baru (Sabaqi)', 'Melancarkan hafalan yang baru disetor kemarin'),
  ('Ujian Kenaikan Juz', 'Tes kelancaran satu juz penuh'),
  ('Setoran Ziyadah', 'Setoran tambahan di luar target harian')
) as t(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_templates WHERE name = t.name
);
