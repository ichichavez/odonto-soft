-- Tabla de plantillas de consentimiento por especialidad.
-- Permite que cada clínica tenga múltiples plantillas (una general + por especialidad).

create table consent_templates (
  id          uuid        primary key default gen_random_uuid(),
  clinic_id   uuid        not null references clinics(id) on delete cascade,
  name        text        not null,
  specialty   text        not null default 'general',
  content     text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on consent_templates(clinic_id, specialty);

comment on table  consent_templates             is 'Plantillas de consentimiento informado por especialidad';
comment on column consent_templates.specialty   is 'general | armonizacion | ortodoncia | periodoncia | estetica | cirugia';
