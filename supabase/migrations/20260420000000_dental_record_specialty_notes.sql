-- Add specialty_notes JSONB column to dental_records
-- Stores free-text notes for Ortodoncia, Armonización Orofacial, and Periodoncia tabs.

alter table dental_records
  add column if not exists specialty_notes jsonb default '{}'::jsonb;

comment on column dental_records.specialty_notes is
  'Free-text specialty notes: { ortodoncia, armonizacion, perio }';
