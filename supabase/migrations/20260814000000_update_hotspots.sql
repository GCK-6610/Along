-- Add description and rating to sponsored_hotspots
ALTER TABLE public.sponsored_hotspots
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1);

-- Update existing hotspots with accurate coordinates and placeholder data
-- Zero 40 Brewing, Hyderabad
UPDATE public.sponsored_hotspots 
SET 
    latitude = 17.4326, 
    longitude = 78.4071,
    description = 'Spacious microbrewery offering craft beers, global cuisine, and a lively vibe.',
    rating = 4.5
WHERE name ILIKE '%Zero 40%';

-- KBR National Park, Hyderabad
UPDATE public.sponsored_hotspots 
SET 
    latitude = 17.4255, 
    longitude = 78.4190,
    description = 'Expansive national park with rich biodiversity, walking trails, and peacocks.',
    rating = 4.6
WHERE name ILIKE '%KBR%';

-- Blue Bottle Coffee (from mock data)
UPDATE public.sponsored_hotspots 
SET 
    description = 'Specialty coffee roaster serving pour-overs and espresso in a minimalist space.',
    rating = 4.7
WHERE name ILIKE '%Blue Bottle%';

-- Central Park (from mock data)
UPDATE public.sponsored_hotspots 
SET 
    description = 'Iconic urban park offering sprawling lawns, lakes, and scenic trails.',
    rating = 4.8
WHERE name ILIKE '%Central Park%';

-- Equinox Gym (from mock data)
UPDATE public.sponsored_hotspots 
SET 
    description = 'Luxury fitness club with state-of-the-art equipment and group classes.',
    rating = 4.5
WHERE name ILIKE '%Equinox%';
