-- Seed Sponsored Hotspots for Hyderabad
INSERT INTO public.sponsored_hotspots (name, tags, image_url, latitude, longitude, is_active)
VALUES
  (
    'Roastery Coffee House',
    '{"coffee", "food", "chill"}',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000',
    17.4208,
    78.4143,
    true
  ),
  (
    'IKEA HITEC City',
    '{"food", "chill", "networking"}',
    'https://images.unsplash.com/photo-1560935574-8b65675cc84d?auto=format&fit=crop&q=80&w=1000',
    17.4382,
    78.3739,
    true
  ),
  (
    'KBR National Park',
    '{"fitness", "outdoors"}',
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a5d?auto=format&fit=crop&q=80&w=1000',
    17.4217,
    78.4168,
    true
  ),
  (
    'Zero40 Brewing',
    '{"food", "networking", "chill"}',
    'https://images.unsplash.com/photo-1538481199005-971576f4e11a?auto=format&fit=crop&q=80&w=1000',
    17.4320,
    78.4060,
    true
  );
