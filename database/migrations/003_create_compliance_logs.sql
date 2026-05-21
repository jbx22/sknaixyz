CREATE TABLE IF NOT EXISTS compliance_logs (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES rental_contracts(id) ON DELETE SET NULL
);
