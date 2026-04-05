-- =====================================================
-- Políticas RLS para tablas principales
-- Permite CRUD completo a usuarios autenticados
-- =====================================================

-- ---- patients ----
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_select"  ON patients;
DROP POLICY IF EXISTS "patients_insert"  ON patients;
DROP POLICY IF EXISTS "patients_update"  ON patients;
DROP POLICY IF EXISTS "patients_delete"  ON patients;

CREATE POLICY "patients_select" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients_insert" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "patients_update" ON patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "patients_delete" ON patients FOR DELETE TO authenticated USING (true);

-- ---- medical_records ----
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medical_records_select" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete" ON medical_records;

CREATE POLICY "medical_records_select" ON medical_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "medical_records_insert" ON medical_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "medical_records_update" ON medical_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "medical_records_delete" ON medical_records FOR DELETE TO authenticated USING (true);

-- ---- dental_records ----
ALTER TABLE dental_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_records_select" ON dental_records;
DROP POLICY IF EXISTS "dental_records_insert" ON dental_records;
DROP POLICY IF EXISTS "dental_records_update" ON dental_records;
DROP POLICY IF EXISTS "dental_records_delete" ON dental_records;

CREATE POLICY "dental_records_select" ON dental_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "dental_records_insert" ON dental_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dental_records_update" ON dental_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "dental_records_delete" ON dental_records FOR DELETE TO authenticated USING (true);

-- ---- dental_record_history ----
ALTER TABLE dental_record_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dental_record_history_select" ON dental_record_history;
DROP POLICY IF EXISTS "dental_record_history_insert" ON dental_record_history;

CREATE POLICY "dental_record_history_select" ON dental_record_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "dental_record_history_insert" ON dental_record_history FOR INSERT TO authenticated WITH CHECK (true);

-- ---- appointments ----
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated USING (true);

-- ---- budgets ----
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select" ON budgets;
DROP POLICY IF EXISTS "budgets_insert" ON budgets;
DROP POLICY IF EXISTS "budgets_update" ON budgets;
DROP POLICY IF EXISTS "budgets_delete" ON budgets;

CREATE POLICY "budgets_select" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "budgets_insert" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "budgets_update" ON budgets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "budgets_delete" ON budgets FOR DELETE TO authenticated USING (true);

-- ---- budget_items ----
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;

CREATE POLICY "budget_items_select" ON budget_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "budget_items_insert" ON budget_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "budget_items_update" ON budget_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "budget_items_delete" ON budget_items FOR DELETE TO authenticated USING (true);

-- ---- treatments ----
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatments_select" ON treatments;
DROP POLICY IF EXISTS "treatments_insert" ON treatments;
DROP POLICY IF EXISTS "treatments_update" ON treatments;
DROP POLICY IF EXISTS "treatments_delete" ON treatments;

CREATE POLICY "treatments_select" ON treatments FOR SELECT TO authenticated USING (true);
CREATE POLICY "treatments_insert" ON treatments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "treatments_update" ON treatments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "treatments_delete" ON treatments FOR DELETE TO authenticated USING (true);

-- ---- invoices ----
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "invoices_delete" ON invoices FOR DELETE TO authenticated USING (true);

-- ---- invoice_items ----
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;

CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE TO authenticated USING (true);

-- ---- materials ----
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_select" ON materials;
DROP POLICY IF EXISTS "materials_insert" ON materials;
DROP POLICY IF EXISTS "materials_update" ON materials;
DROP POLICY IF EXISTS "materials_delete" ON materials;

CREATE POLICY "materials_select" ON materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_insert" ON materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materials_update" ON materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "materials_delete" ON materials FOR DELETE TO authenticated USING (true);

-- ---- material_categories ----
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_categories_select" ON material_categories;
DROP POLICY IF EXISTS "material_categories_insert" ON material_categories;
DROP POLICY IF EXISTS "material_categories_update" ON material_categories;
DROP POLICY IF EXISTS "material_categories_delete" ON material_categories;

CREATE POLICY "material_categories_select" ON material_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "material_categories_insert" ON material_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "material_categories_update" ON material_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "material_categories_delete" ON material_categories FOR DELETE TO authenticated USING (true);

-- ---- material_sales ----
ALTER TABLE material_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_sales_select" ON material_sales;
DROP POLICY IF EXISTS "material_sales_insert" ON material_sales;
DROP POLICY IF EXISTS "material_sales_update" ON material_sales;
DROP POLICY IF EXISTS "material_sales_delete" ON material_sales;

CREATE POLICY "material_sales_select" ON material_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "material_sales_insert" ON material_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "material_sales_update" ON material_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "material_sales_delete" ON material_sales FOR DELETE TO authenticated USING (true);

-- ---- inventory_movements ----
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_movements_select" ON inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_insert" ON inventory_movements;

CREATE POLICY "inventory_movements_select" ON inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_movements_insert" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

-- ---- notifications ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;

CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (true);

-- ---- consent_signatures ----
ALTER TABLE consent_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_signatures_select" ON consent_signatures;
DROP POLICY IF EXISTS "consent_signatures_insert" ON consent_signatures;
DROP POLICY IF EXISTS "consent_signatures_update" ON consent_signatures;
DROP POLICY IF EXISTS "consent_signatures_delete" ON consent_signatures;

CREATE POLICY "consent_signatures_select" ON consent_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "consent_signatures_insert" ON consent_signatures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "consent_signatures_update" ON consent_signatures FOR UPDATE TO authenticated USING (true);
CREATE POLICY "consent_signatures_delete" ON consent_signatures FOR DELETE TO authenticated USING (true);

-- ---- users (public profile, no datos sensibles) ----
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (true);

-- ---- treatment_plan_items ----
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_plan_items_select" ON treatment_plan_items;
DROP POLICY IF EXISTS "treatment_plan_items_insert" ON treatment_plan_items;
DROP POLICY IF EXISTS "treatment_plan_items_update" ON treatment_plan_items;
DROP POLICY IF EXISTS "treatment_plan_items_delete" ON treatment_plan_items;

CREATE POLICY "treatment_plan_items_select" ON treatment_plan_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "treatment_plan_items_insert" ON treatment_plan_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "treatment_plan_items_update" ON treatment_plan_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "treatment_plan_items_delete" ON treatment_plan_items FOR DELETE TO authenticated USING (true);

-- ---- prescriptions ----
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_update" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_delete" ON prescriptions;

CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "prescriptions_insert" ON prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prescriptions_update" ON prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "prescriptions_delete" ON prescriptions FOR DELETE TO authenticated USING (true);
