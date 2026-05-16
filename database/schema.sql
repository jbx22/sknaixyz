-- SKN32 PostgreSQL schema for Vercel/Neon/Postgres deployments.
-- Supabase is not required. Run this once against your Postgres database before deploying.

create type user_role as enum ('admin','superadmin','user');
create type user_status as enum ('active','deactivated','suspended');
create type subscription_tier as enum ('basic','free','premium');
create type payment_status as enum ('completed','failed','pending','refunded');
create type session_type as enum ('auth','temp_oauth');
create type property_type as enum ('apartment','commercial','land','townhouse','villa');
create type property_status as enum ('available','rented','sold');
create type ai_report_status as enum ('completed','failed','pending');
create type deletion_request_status as enum ('cancelled','completed','pending');
create type kyc_status as enum ('approved','expired','pending','rejected');
create type investor_suitability as enum ('institutional','qualified','retail');
create type spv_status as enum ('active','dissolved','draft');
create type offering_status as enum ('closed','draft','open','settled');
create type tokenization_request_status as enum ('approved','pending','rejected','under_review');
create type token_transfer_type as enum ('distribution','primary_purchase','secondary_buy','secondary_sell');
create type wallet_transaction_status as enum ('completed','failed','pending');
create type wallet_transaction_type as enum ('deposit','income_distribution','refund','token_purchase','token_sale','withdrawal');
create type secondary_listing_status as enum ('active','cancelled','expired','filled');
create type ledger_entry_type as enum ('asset_freeze','asset_tokenization','asset_unfreeze','compliance_check','emergency_action','global_freeze','global_unfreeze','income_distribution','kyc_verification','regulatory_override','reversal','spv_creation','token_issuance','token_transfer');
create type ledger_entry_status as enum ('confirmed','failed','pending','reversed');
create type control_key_type as enum ('emergency_shutdown','global_distribution_freeze','global_issuance_freeze','global_trading_freeze');

create table users (
  id bigserial primary key,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  phone text,
  role user_role not null default 'user',
  status user_status not null default 'active',
  subscription_tier subscription_tier not null default 'free',
  email_verified boolean not null default false,
  email_verified_at timestamptz,
  ai_reports_used integer not null default 0,
  ai_reports_reset_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_passwords (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, password_hash text not null, created_at timestamptz default now());
create table sessions (id text primary key, user_id bigint not null references users(id) on delete cascade, session_type session_type default 'auth', created_at timestamptz default now(), last_accessed timestamptz default now(), expires_at timestamptz not null);
create table login_attempts (id bigserial primary key, email text not null, attempted_at timestamptz default now(), success boolean default false);
create table oauth_accounts (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, provider text not null, provider_user_id text not null, provider_email text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table oauth_states (id bigserial primary key, provider text not null, state text not null, code_verifier text not null, redirect_url text not null, expires_at timestamptz not null, created_at timestamptz default now());
create table email_verification_codes (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, code text not null, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz default now());

create table properties (
  id bigserial primary key, user_id bigint not null references users(id) on delete cascade, title text not null, description text, price numeric not null, location_name text not null, latitude numeric not null, longitude numeric not null, area_sqm numeric not null, bedrooms integer, bathrooms numeric, property_type property_type not null, status property_status not null default 'available', images text[] default '{}', amenities text[] default '{}', contact_phone text, floor_number integer, year_built integer, zip_code text, furnished boolean default false, is_featured boolean not null default false, ai_report_status ai_report_status, ai_report_data jsonb, ai_report_error text, ai_report_generated_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table property_chats (id bigserial primary key, property_id bigint not null references properties(id) on delete cascade, user_id bigint not null references users(id) on delete cascade, message text not null, deleted_by_admin boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table property_views (id bigserial primary key, property_id bigint not null references properties(id) on delete cascade, user_id bigint references users(id) on delete set null, ip_address text, user_agent text, viewed_at timestamptz default now());
create table user_favorites (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, property_id bigint not null references properties(id) on delete cascade, created_at timestamptz default now(), unique(user_id, property_id));

create table subscription_payments (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, tier subscription_tier not null, amount numeric not null, currency text not null default 'SAR', payment_method text, payment_status payment_status not null default 'pending', transaction_id text, started_at timestamptz not null default now(), expires_at timestamptz not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table admin_activity_logs (id bigserial primary key, admin_id bigint not null references users(id) on delete cascade, action_type text not null, target_type text, target_id bigint, details jsonb, ip_address text, created_at timestamptz default now());
create table compliance_logs (id bigserial primary key, user_id bigint references users(id) on delete set null, entity_type text not null, entity_id bigint, action text not null, details jsonb default '{}'::jsonb, ip_address text, created_at timestamptz default now());
create table data_deletion_requests (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, status deletion_request_status not null default 'pending', notes text, requested_at timestamptz default now(), processed_at timestamptz);

create table kyc_records (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, status kyc_status not null default 'pending', suitability investor_suitability not null default 'retail', full_name_ar text, full_name_en text, national_id text, date_of_birth timestamptz, nationality text, phone text, address text, risk_score integer, rejection_reason text, verified_at timestamptz, expires_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table investor_acknowledgements (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, acknowledgement_type text not null, version text not null default '1.0', ip_address text, acknowledged_at timestamptz default now());
create table spvs (id bigserial primary key, name text not null, registration_number text, legal_structure text, legal_documents jsonb, status spv_status not null default 'draft', created_at timestamptz default now(), updated_at timestamptz default now());
create table tokenized_assets (id bigserial primary key, property_id bigint not null references properties(id) on delete cascade, spv_id bigint not null references spvs(id), total_value numeric not null, total_tokens integer not null, token_price numeric not null default 100, tokens_sold integer not null default 0, offering_status offering_status not null default 'draft', annual_rental_yield numeric, title_deed_url text, valuation_report_url text, income_rights boolean not null default true, voting_rights boolean not null default false, transferable boolean not null default false, zoning_eligible boolean not null default false, lock_up_days integer not null default 90, settled_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table tokenization_requests (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, property_id bigint not null references properties(id) on delete cascade, estimated_value numeric, desired_token_price numeric, notes text, status tokenization_request_status not null default 'pending', admin_notes text, rejection_reason text, reviewed_by bigint references users(id), reviewed_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table investor_wallets (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, balance_sar numeric not null default 0, frozen_sar numeric not null default 0, total_deposited numeric not null default 0, total_withdrawn numeric not null default 0, total_invested numeric not null default 0, total_income_received numeric not null default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table token_holdings (id bigserial primary key, user_id bigint not null references users(id) on delete cascade, tokenized_asset_id bigint not null references tokenized_assets(id) on delete cascade, quantity integer not null default 0, average_purchase_price numeric not null default 0, total_invested numeric not null default 0, total_income_received numeric not null default 0, acquired_at timestamptz default now(), updated_at timestamptz default now());
create table token_transfers (id bigserial primary key, tokenized_asset_id bigint not null references tokenized_assets(id) on delete cascade, from_user_id bigint references users(id), to_user_id bigint not null references users(id), quantity integer not null, price_per_token numeric not null, total_amount numeric not null, transfer_type token_transfer_type not null, created_at timestamptz default now());
create table secondary_listings (id bigserial primary key, tokenized_asset_id bigint not null references tokenized_assets(id) on delete cascade, seller_id bigint not null references users(id), quantity integer not null, filled_quantity integer not null default 0, price_per_token numeric not null, status secondary_listing_status not null default 'active', expires_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table income_distributions (id bigserial primary key, tokenized_asset_id bigint not null references tokenized_assets(id) on delete cascade, total_amount numeric not null, amount_per_token numeric not null, period_start timestamptz not null, period_end timestamptz not null, distribution_date timestamptz not null, description text, created_at timestamptz default now());
create table wallet_transactions (id bigserial primary key, wallet_id bigint not null references investor_wallets(id) on delete cascade, user_id bigint not null references users(id) on delete cascade, type wallet_transaction_type not null, status wallet_transaction_status not null default 'pending', amount numeric not null, description text, reference_id text, metadata jsonb default '{}'::jsonb, completed_at timestamptz, created_at timestamptz default now());

create table ledger_entries (id bigserial primary key, sequence_number bigint not null, entry_type ledger_entry_type not null, status ledger_entry_status not null default 'pending', executed_by bigint not null references users(id), from_user_id bigint references users(id), to_user_id bigint references users(id), asset_id bigint, spv_id bigint, token_amount integer, price_per_token numeric, sar_amount numeric, metadata jsonb not null default '{}'::jsonb, compliance_checks jsonb not null default '{}'::jsonb, contract_rule_set text not null default 'v1', legal_reference text, previous_hash text not null default '', entry_hash text not null, reversed_entry_id bigint references ledger_entries(id), reversal_reason text, ip_address text, created_at timestamptz default now());
create table asset_controls (id bigserial primary key, asset_id bigint not null, is_frozen boolean not null default false, transfers_paused boolean not null default false, distributions_paused boolean not null default false, issuance_paused boolean not null default false, regulatory_hold boolean not null default false, regulatory_reference text, freeze_reason text, frozen_by bigint references users(id), frozen_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table global_controls (id bigserial primary key, control_key control_key_type not null, is_active boolean not null default false, reason text, activated_by bigint references users(id), activated_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table smart_contract_rules (id bigserial primary key, asset_id bigint not null, rule_version text not null default 'v1', require_kyc boolean not null default true, require_suitability_check boolean not null default true, require_settlement_confirmation boolean not null default true, can_freeze_individual_holdings boolean not null default true, can_force_transfer boolean not null default false, max_token_supply integer not null, tokens_reserved integer not null default 0, min_investment_sar numeric not null default 0, max_investment_sar numeric, max_investors integer, min_holding_period_days integer not null default 90, allowed_suitabilities text[] not null default '{}', allowed_jurisdictions text[] not null default '{}', distribution_frequency text not null default 'quarterly', auto_distribute boolean not null default false, withholding_tax_rate numeric not null default 0, created_by bigint not null references users(id), created_at timestamptz default now(), updated_at timestamptz default now());

create index idx_users_email on users(email);
create index idx_sessions_user on sessions(user_id);
create index idx_properties_user on properties(user_id);
create index idx_properties_location on properties(latitude, longitude);
create index idx_subscription_payments_user on subscription_payments(user_id);
create index idx_tokenized_assets_property on tokenized_assets(property_id);
create index idx_token_holdings_user on token_holdings(user_id);
create index idx_ledger_sequence on ledger_entries(sequence_number);

-- REGA compliance and workflow audit tables
create type rega_form_status as enum ('draft', 'completed', 'submitted', 'approved', 'rejected');
create type rega_form_type as enum ('kyc', 'risk_acknowledgment', 'subscription_terms', 'property_listing');
create type workflow_status as enum ('draft', 'pending_admin_review', 'changes_requested', 'approved', 'rejected', 'suspended', 'listed', 'settled');
create type asset_user_type as enum ('owner', 'broker', 'developer', 'investor');
create type workflow_type as enum ('fractional', 'tokenization', 'secondary');

create table rega_forms (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  form_type rega_form_type not null,
  form_data jsonb not null,
  status rega_form_status not null default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table property_listings (
  id bigserial primary key,
  title text not null,
  city text not null,
  district text not null,
  latitude numeric not null,
  longitude numeric not null,
  price numeric not null,
  type property_type not null,
  status property_status not null default 'available',
  bedrooms integer,
  area_sqm numeric not null,
  ai_score numeric,
  description_en text,
  description_ar text,
  listed_by bigint references users(id),
  rer_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table workflow_audit (
  id bigserial primary key,
  workflow workflow_type not null,
  target_id text not null,
  actor text not null,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_rega_forms_user on rega_forms(user_id, form_type, status);
create index idx_property_listings_city on property_listings(city, status);
create index idx_property_listings_location on property_listings(latitude, longitude);
create index idx_workflow_audit_workflow on workflow_audit(workflow, created_at);
create index idx_workflow_audit_actor on workflow_audit(actor);

-- Fractional ownership requests
create type fractional_request_status as enum ('pending', 'under_review', 'approved', 'rejected', 'active', 'completed');

create table fractional_requests (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  property_id bigint references properties(id) on delete set null,
  property_title text not null,
  city text not null default 'Riyadh',
  estimated_value numeric,
  fractional_percent numeric(5,2),
  target_raise numeric,
  minimum_ticket numeric default 1000,
  income_model text,
  use_of_funds text,
  exit_plan text,
  risk_summary text,
  documents text[] default '{}',
  rega_checklist jsonb default '{}'::jsonb,
  status fractional_request_status not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fractional investments (user buys into a fractional request)
create type fractional_investment_status as enum ('pending', 'active', 'completed', 'withdrawn');

create table fractional_investments (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  fractional_request_id bigint not null references fractional_requests(id) on delete cascade,
  amount_invested numeric(15,2) not null,
  fraction_acquired numeric(5,4) not null,
  status fractional_investment_status not null default 'active',
  created_at timestamptz default now()
);

-- Token transactions (buy/sell in secondary market)
create type token_tx_type as enum ('buy', 'sell', 'transfer');
create type token_tx_status as enum ('pending', 'completed', 'failed', 'cancelled');

create table token_transactions (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  tokenization_request_id bigint references tokenization_requests(id) on delete set null,
  tokenized_asset_id bigint references tokenized_assets(id) on delete set null,
  transaction_type token_tx_type not null,
  quantity integer not null,
  price_per_token numeric(15,2) not null,
  total_amount numeric(15,2) not null,
  status token_tx_status not null default 'pending',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_fractional_requests_user on fractional_requests(user_id, status);
create index idx_fractional_requests_property on fractional_requests(property_id);
create index idx_fractional_investments_request on fractional_investments(fractional_request_id);
create index idx_fractional_investments_user on fractional_investments(user_id);
create index idx_token_transactions_user on token_transactions(user_id, status);
create index idx_token_transactions_asset on token_transactions(tokenized_asset_id);

-- Smart Rent Management Module
create type rent_contract_status as enum ('draft', 'active', 'expired', 'terminated', 'renewed');
create type rent_invoice_status as enum ('pending', 'paid', 'overdue', 'cancelled', 'partial');;
create type rent_payment_method as enum ('bank_transfer', 'cash', 'check', 'online', 'payment_link', 'other');
create type rent_payment_status as enum ('pending', 'completed', 'failed', 'refunded');
create type payment_intent_status as enum ('created', 'processing', 'succeeded', 'failed', 'cancelled');
create type payment_provider_name as enum ('mock', 'tap', 'moyasar', 'hyperpay');
create type webhook_event_status as enum ('received', 'processed', 'failed');
create type expense_category as enum ('maintenance', 'insurance', 'taxes', 'management_fee', 'utilities', 'repair', 'marketing', 'legal', 'other');
create type distribution_status as enum ('pending', 'processing', 'completed', 'failed');
create type allocation_status as enum ('pending', 'confirmed', 'disputed');

create table property_units (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  unit_number text not null,
  floor_number integer,
  area_sqm numeric,
  bedrooms integer,
  bathrooms numeric,
  monthly_rent numeric not null default 0,
  status property_status not null default 'available',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rental_contracts (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  unit_id bigint references property_units(id) on delete set null,
  tenant_user_id bigint not null references users(id) on delete cascade,
  landlord_user_id bigint not null references users(id) on delete cascade,
  monthly_rent numeric not null,
  security_deposit numeric not null default 0,
  start_date timestamptz not null,
  end_date timestamptz not null,
  contract_status rent_contract_status not null default 'draft',
  payment_due_day integer not null default 1,
  auto_generate_invoice boolean not null default true,
  notes text,
  contract_document_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rent_invoices (
  id bigserial primary key,
  contract_id bigint not null references rental_contracts(id) on delete cascade,
  property_id bigint not null references properties(id) on delete cascade,
  tenant_user_id bigint not null references users(id) on delete cascade,
  amount numeric not null,
  due_date timestamptz not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  invoice_status rent_invoice_status not null default 'pending',
  paid_amount numeric not null default 0,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rent_payments (
  id bigserial primary key,
  invoice_id bigint not null references rent_invoices(id) on delete cascade,
  contract_id bigint not null references rental_contracts(id) on delete cascade,
  property_id bigint not null references properties(id) on delete cascade,
  tenant_user_id bigint not null references users(id) on delete cascade,
  amount numeric not null,
  payment_method rent_payment_method not null default 'bank_transfer',
  payment_status rent_payment_status not null default 'pending',
  transaction_reference text,
  payment_date timestamptz,
  notes text,
  recorded_by bigint references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table payment_intents (
  id bigserial primary key,
  invoice_id bigint not null references rent_invoices(id) on delete cascade,
  provider payment_provider_name not null default 'mock',
  provider_intent_id text,
  amount numeric not null,
  currency text not null default 'SAR',
  payment_url text,
  intent_status payment_intent_status not null default 'created',
  metadata jsonb default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table payment_webhook_events (
  id bigserial primary key,
  provider payment_provider_name not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz default now()
);

create table rent_receipts (
  id bigserial primary key,
  payment_id bigint not null references rent_payments(id) on delete cascade,
  invoice_id bigint not null references rent_invoices(id) on delete cascade,
  tenant_user_id bigint not null references users(id) on delete cascade,
  amount numeric not null,
  receipt_number text not null unique,
  receipt_url text,
  issued_at timestamptz default now()
);

create table rent_reminders (
  id bigserial primary key,
  invoice_id bigint not null references rent_invoices(id) on delete cascade,
  contract_id bigint not null references rental_contracts(id) on delete cascade,
  reminder_type text not null default 'due_soon',
  sent_at timestamptz default now(),
  delivery_status text not null default 'sent'
);

create table property_ownership_shares (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  ownership_percentage numeric(5,2) not null,
  investment_amount numeric not null default 0,
  acquired_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table property_expenses (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  category expense_category not null default 'other',
  amount numeric not null,
  description text,
  expense_date timestamptz not null,
  recorded_by bigint references users(id),
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rental_income_allocations (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  owner_user_id bigint not null references users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  total_income numeric not null,
  total_expenses numeric not null default 0,
  net_income numeric not null,
  ownership_share_id bigint references property_ownership_shares(id) on delete set null,
  allocated_amount numeric not null,
  allocation_status allocation_status not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table investor_distributions (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  allocation_id bigint not null references rental_income_allocations(id) on delete cascade,
  investor_user_id bigint not null references users(id) on delete cascade,
  amount numeric not null,
  distribution_status distribution_status not null default 'pending',
  distribution_date timestamptz,
  transaction_reference text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rent_audit_logs (
  id bigserial primary key,
  action text not null,
  entity_type text not null,
  entity_id bigint not null,
  user_id bigint references users(id) on delete set null,
  details jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz default now()
);

create index idx_property_units_property on property_units(property_id);
create index idx_rental_contracts_property on rental_contracts(property_id);
create index idx_rental_contracts_tenant on rental_contracts(tenant_user_id);
create index idx_rental_contracts_status on rental_contracts(contract_status);
create index idx_rent_invoices_contract on rent_invoices(contract_id);
create index idx_rent_invoices_tenant on rent_invoices(tenant_user_id);
create index idx_rent_invoices_status on rent_invoices(invoice_status);
create index idx_rent_invoices_due_date on rent_invoices(due_date);
create index idx_rent_payments_invoice on rent_payments(invoice_id);
create index idx_rent_payments_contract on rent_payments(contract_id);
create index idx_rent_payments_status on rent_payments(payment_status);
create index idx_payment_intents_invoice on payment_intents(invoice_id);
create index idx_payment_webhook_events_provider on payment_webhook_events(provider, processed);
create index idx_rent_receipts_payment on rent_receipts(payment_id);
create index idx_rent_receipts_tenant on rent_receipts(tenant_user_id);
create index idx_property_ownership_property on property_ownership_shares(property_id);
create index idx_property_ownership_user on property_ownership_shares(user_id);
create index idx_property_expenses_property on property_expenses(property_id);
create index idx_property_expenses_category on property_expenses(category);
create index idx_rental_income_allocations_property on rental_income_allocations(property_id);
create index idx_rental_income_allocations_owner on rental_income_allocations(owner_user_id);
create index idx_investor_distributions_property on investor_distributions(property_id);
create index idx_investor_distributions_investor on investor_distributions(investor_user_id);
create index idx_investor_distributions_status on investor_distributions(distribution_status);
create index idx_rent_audit_logs_entity on rent_audit_logs(entity_type, entity_id);
create index idx_rent_audit_logs_created on rent_audit_logs(created_at);

-- Property Access Control
create type property_member_role as enum ('owner', 'developer', 'broker', 'investor', 'tenant');

alter table properties alter column status type property_status using status::property_status;
alter type property_status add value if not exists 'pending';
alter type property_status add value if not exists 'maintenance';
alter type user_role add value if not exists 'owner';
alter type user_role add value if not exists 'developer';
alter type user_role add value if not exists 'broker';

create table property_members (
  id bigserial primary key,
  property_id bigint not null references properties(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  role property_member_role not null default 'owner',
  granted_by bigint references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(property_id, user_id, role)
);

create index idx_property_members_property on property_members(property_id);
create index idx_property_members_user on property_members(user_id);

-- Dashboard & Notifications
create table admin_role_assignments (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  assigned_role text not null,
  assigned_by bigint not null references users(id),
  scope text default 'all',
  is_active boolean default true,
  created_at timestamptz default now(),
  revoked_at timestamptz,
  revoked_by bigint references users(id)
);

create index idx_admin_role_assignments_user on admin_role_assignments(user_id);
create index idx_admin_role_assignments_role on admin_role_assignments(assigned_role);

create table user_dashboard_preferences (
  id bigserial primary key,
  user_id bigint not null unique references users(id) on delete cascade,
  layout jsonb default '{}'::jsonb,
  widgets text[] default '{"recent_properties","my_investments","rent_summary","market_activity"}',
  theme text default 'system',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notifications (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean default false,
  action_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_notifications_user on notifications(user_id, is_read, created_at);

alter table admin_activity_logs add column if not exists target_user_id bigint;
alter table admin_activity_logs add column if not exists outcome text;
