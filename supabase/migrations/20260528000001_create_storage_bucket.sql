-- =====================================================
-- STORAGE: Bucket product-images
-- =====================================================
-- Esegui questo SQL nel tuo progetto Supabase:
-- Dashboard → SQL Editor → New Query → Incolla e Run
-- =====================================================

-- Crea il bucket product-images (pubblico in lettura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB max per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- POLICY: Chiunque può leggere (download immagini pubbliche)
-- =====================================================
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- =====================================================
-- POLICY: Solo venditori autenticati possono caricare
--         nella propria cartella: {vendor_id}/...
-- =====================================================
DROP POLICY IF EXISTS "Vendors can upload their product images" ON storage.objects;
CREATE POLICY "Vendors can upload their product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

-- =====================================================
-- POLICY: Solo il venditore proprietario può eliminare
-- =====================================================
DROP POLICY IF EXISTS "Vendors can delete their product images" ON storage.objects;
CREATE POLICY "Vendors can delete their product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

-- =====================================================
-- POLICY: Solo il venditore proprietario può aggiornare
-- =====================================================
DROP POLICY IF EXISTS "Vendors can update their product images" ON storage.objects;
CREATE POLICY "Vendors can update their product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );
