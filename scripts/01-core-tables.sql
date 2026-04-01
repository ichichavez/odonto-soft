-- ============================================================
-- ODONTO-SOFT: Tablas principales
-- Ejecutar DESPUÉS de 00-bootstrap.sql
-- ============================================================

-- 1. Clínicas (multi-tenant)
CREATE TABLE IF NOT EXISTS clinics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE,
  logo_url         TEXT,
  primary_color    TEXT DEFAULT '#10b981',
  consent_template TEXT DEFAULT
'Yo, el/la abajo firmante, en pleno uso de mis facultades mentales, declaro que:

1. He sido informado/a sobre los tratamientos a realizar, sus beneficios, riesgos y alternativas.
2. Autorizo al profesional tratante a realizar los procedimientos odontológicos necesarios.
3. Declaro que toda la información médica proporcionada es verdadera y completa.
4. Entiendo que puedo retirar este consentimiento en cualquier momento antes de iniciar el tratamiento.
5. Confirmo que he tenido la oportunidad de realizar preguntas y que han sido respondidas satisfactoriamente.

La información contenida en esta ficha es estrictamente confidencial y de uso exclusivo del profesional tratante.',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar FK clinic_id en users (ahora que existe la tabla clinics)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

-- 2. Pacientes
CREATE TABLE IF NOT EXISTS patients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  identity_number  TEXT,
  email            TEXT,
  phone            TEXT,
  secondary_phone  TEXT,
  birth_date       DATE,
  gender           TEXT,
  marital_status   TEXT,
  address          TEXT,
  avatar_url       TEXT,
  clinic_id        UUID REFERENCES clinics(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Historial médico simple (legacy, se mantiene por compatibilidad)
CREATE TABLE IF NOT EXISTS medical_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  allergies        TEXT,
  medications      TEXT,
  chronic_diseases TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tratamientos del catálogo
CREATE TABLE IF NOT EXISTS treatments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  price            DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  clinic_id        UUID REFERENCES clinics(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Citas
CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id   UUID NOT NULL REFERENCES public.users(id),
  treatment_id UUID REFERENCES treatments(id),
  date         DATE NOT NULL,
  time         TIME NOT NULL,
  duration     INTEGER DEFAULT 30,
  status       TEXT NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes        TEXT,
  clinic_id    UUID REFERENCES clinics(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number      TEXT NOT NULL,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  date        DATE NOT NULL,
  valid_until DATE,
  subtotal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate    DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'pendiente'
              CHECK (status IN ('pendiente','aceptado','rechazado','expirado')),
  notes       TEXT,
  clinic_id   UUID REFERENCES clinics(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id    UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id),
  description  TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL,
  total        DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Facturas
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number         TEXT NOT NULL,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  budget_id      UUID REFERENCES budgets(id),
  created_by     UUID NOT NULL REFERENCES public.users(id),
  date           DATE NOT NULL,
  due_date       DATE NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate       DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente','pagada','anulada','vencida')),
  payment_method TEXT,
  notes          TEXT,
  clinic_id      UUID REFERENCES clinics(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id),
  description  TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL,
  total        DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Inventario
CREATE TABLE IF NOT EXISTS material_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  clinic_id   UUID REFERENCES clinics(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  category_id         UUID NOT NULL REFERENCES material_categories(id),
  description         TEXT,
  unit                TEXT NOT NULL DEFAULT 'unidad',
  stock_quantity      DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_quantity  DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit_percentage   DECIMAL(5,2) NOT NULL DEFAULT 0,
  price               DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier            TEXT,
  clinic_id           UUID REFERENCES clinics(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id   UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada','salida','ajuste')),
  quantity      DECIMAL(10,2) NOT NULL,
  notes         TEXT,
  reference     TEXT,
  clinic_id     UUID REFERENCES clinics(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  quantity    DECIMAL(10,2) NOT NULL,
  cost_price  DECIMAL(10,2) NOT NULL,
  sale_price  DECIMAL(10,2) NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info'
             CHECK (type IN ('info','warning','error','success')),
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIN
-- ============================================================
