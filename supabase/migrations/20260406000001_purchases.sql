-- =====================================================
-- Módulo de Compras (actualiza stock de materiales)
-- =====================================================

CREATE TABLE IF NOT EXISTS purchases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID REFERENCES clinics(id),
  created_by  UUID REFERENCES public.users(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier    TEXT,
  notes       TEXT,
  total       DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id  UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  material_id  UUID REFERENCES materials(id),
  description  TEXT NOT NULL,
  quantity     DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  unit_cost    DECIMAL(12,2) NOT NULL DEFAULT 0,
  total        DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_purchases_clinic ON purchases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date   ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_material ON purchase_items(material_id);

-- RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchases_select" ON purchases;
DROP POLICY IF EXISTS "purchases_insert" ON purchases;
DROP POLICY IF EXISTS "purchases_update" ON purchases;
DROP POLICY IF EXISTS "purchases_delete" ON purchases;
CREATE POLICY "purchases_select" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "purchases_insert" ON purchases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purchases_update" ON purchases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "purchases_delete" ON purchases FOR DELETE TO authenticated USING (true);

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_items_select" ON purchase_items;
DROP POLICY IF EXISTS "purchase_items_insert" ON purchase_items;
DROP POLICY IF EXISTS "purchase_items_delete" ON purchase_items;
CREATE POLICY "purchase_items_select" ON purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "purchase_items_insert" ON purchase_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purchase_items_delete" ON purchase_items FOR DELETE TO authenticated USING (true);
