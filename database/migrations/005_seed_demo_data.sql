-- Seed demo data (idempotent - only inserts if no data exists)
-- Since the DB already has live users (only id=1 exists), we reference user_id=1

-- Properties
INSERT INTO properties (user_id, title, description, price, location_name, latitude, longitude, area_sqm, bedrooms, bathrooms, property_type, status, is_featured, contact_phone, furnished)
SELECT 1, 'Villa in Riyadh - Al Olaya', 'Luxury villa', 5000000.00, 'Al Olaya, Riyadh', 24.7136, 46.6753, 450, 5, 4.5, 'villa', 'available', TRUE, '+966501234560', TRUE
WHERE (SELECT COUNT(*) FROM properties) < 3;

INSERT INTO properties (user_id, title, description, price, location_name, latitude, longitude, area_sqm, bedrooms, bathrooms, property_type, status, is_featured, contact_phone, furnished)
SELECT 1, 'Apartment in Jeddah - Corniche', 'Modern apartment', 1800000.00, 'Corniche, Jeddah', 21.5433, 39.1728, 180, 3, 2.0, 'apartment', 'rented', TRUE, '+966501234561', TRUE
WHERE (SELECT COUNT(*) FROM properties) < 5;

INSERT INTO properties (user_id, title, description, price, location_name, latitude, longitude, area_sqm, bedrooms, bathrooms, property_type, status, is_featured, contact_phone, furnished)
SELECT 1, 'Commercial Office in Dammam', 'Prime office space', 3500000.00, 'Al Khobar, Dammam', 26.4207, 50.0888, 300, 0, 2.0, 'commercial', 'rented', FALSE, '+966501234562', FALSE
WHERE (SELECT COUNT(*) FROM properties) < 6;
