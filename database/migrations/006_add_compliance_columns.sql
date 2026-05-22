-- Migration 006: Add compliance columns to rental_contracts
-- This adds the columns needed by the compliance cron engine, audit checklist, and stats endpoints

ALTER TABLE rental_contracts
  ADD COLUMN IF NOT EXISTS ejar_contract_number text,
  ADD COLUMN IF NOT EXISTS compliance_status text DEFAULT 'pending_validation',
  ADD COLUMN IF NOT EXISTS auto_renew_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rega_license_number text;

-- Add unique index on ejar_contract_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_rental_contracts_ejar_number ON rental_contracts(ejar_contract_number);

-- Add index on compliance_status for stats queries
CREATE INDEX IF NOT EXISTS idx_rental_contracts_compliance_status ON rental_contracts(compliance_status);
