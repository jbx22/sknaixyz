-- Add listing_type column to properties table
-- Differentiates between properties listed for sale vs rent

create type listing_type as enum ('sale', 'rent');

alter table properties
  add column listing_type listing_type not null default 'sale';
