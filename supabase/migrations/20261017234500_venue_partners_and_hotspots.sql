-- Add perk_text, along_rating, google_rating to sponsored_hotspots
ALTER TABLE public.sponsored_hotspots
ADD COLUMN IF NOT EXISTS perk_text TEXT,
ADD COLUMN IF NOT EXISTS along_rating NUMERIC(3, 1),
ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3, 1);

-- Update KBR National Park so it has no perk_text (ensuring it shows as Popular Spot, not Partner Perk)
UPDATE public.sponsored_hotspots
SET perk_text = NULL,
    google_rating = 4.6,
    along_rating = 4.8,
    description = 'Expansive national park with rich biodiversity, 5km walking trails, and peacocks.'
WHERE name ILIKE '%KBR%';

-- Update Roastery and Zero40 with real partner perks
UPDATE public.sponsored_hotspots
SET perk_text = '10% off bill for Along groups of 4+',
    google_rating = 4.6,
    along_rating = 4.9,
    description = 'Artisanal coffee roaster with specialty brews and lush outdoor courtyard seating.'
WHERE name ILIKE '%Roastery%';

UPDATE public.sponsored_hotspots
SET perk_text = 'Complimentary appetizer with first craft pitcher',
    google_rating = 4.5,
    along_rating = 4.7,
    description = 'Spacious microbrewery offering craft beers, global cuisine, and vibrant energy.'
WHERE name ILIKE '%Zero%';

-- Table for inbound venue partner applications submitted from the landing page
CREATE TABLE IF NOT EXISTS public.venue_partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_name TEXT NOT NULL,
    category TEXT NOT NULL,
    city_area TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    proposed_perk TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.venue_partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous submissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_partner_applications' AND policyname = 'Anyone can submit partner application'
    ) THEN
        CREATE POLICY "Anyone can submit partner application"
        ON public.venue_partner_applications
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_partner_applications' AND policyname = 'Allow read for anon and authenticated'
    ) THEN
        CREATE POLICY "Allow read for anon and authenticated"
        ON public.venue_partner_applications
        FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_partner_applications' AND policyname = 'Allow update for anon and authenticated'
    ) THEN
        CREATE POLICY "Allow update for anon and authenticated"
        ON public.venue_partner_applications
        FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;


