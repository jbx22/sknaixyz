CREATE TABLE rega_license_cache (
    id SERIAL PRIMARY KEY,
    license_number VARCHAR(50) NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    holder_name VARCHAR(255),
    holder_type VARCHAR(20),
    expiry_date DATE,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_response JSONB,
    UNIQUE(license_number)
);
