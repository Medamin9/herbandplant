-- Migration: Create banners table for home page banner management
-- Run this with: psql -U your_user -d your_database -f create_banners_table.sql

CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    desktop_image TEXT NOT NULL,
    mobile_image TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default banner (you can update these paths after uploading images)
INSERT INTO banners (desktop_image, mobile_image, is_active)
VALUES ('/api/default-banner.jpg', '/api/default-banner-mobile.jpg', TRUE)
ON CONFLICT DO NOTHING;

-- Create index for quick lookup of active banner
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active) WHERE is_active = TRUE;
