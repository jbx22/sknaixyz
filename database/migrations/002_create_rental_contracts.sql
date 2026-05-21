CREATE TABLE IF NOT EXISTS rental_contracts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    ejar_contract_number VARCHAR(50) UNIQUE NOT NULL,
    rega_license_number VARCHAR(50) NOT NULL,
    tenant_masked_id VARCHAR(50) NOT NULL,
    tenant_phone VARCHAR(20) NOT NULL,
    monthly_rent NUMERIC(10,2) NOT NULL CHECK (monthly_rent > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    next_payment_date DATE NOT NULL,
    auto_renew_flag BOOLEAN DEFAULT TRUE,
    compliance_status VARCHAR(20) DEFAULT 'VALID' CHECK (compliance_status IN ('VALID','WARNING','CRITICAL','EXPIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    CONSTRAINT chk_dates CHECK (end_date > start_date)
);
