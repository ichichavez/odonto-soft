-- Crear tabla de ventas de materiales
CREATE TABLE IF NOT EXISTS material_sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_material_sales_invoice_id ON material_sales(invoice_id);
CREATE INDEX IF NOT EXISTS idx_material_sales_material_id ON material_sales(material_id);
CREATE INDEX IF NOT EXISTS idx_material_sales_created_at ON material_sales(created_at);

-- Agregar comentarios para documentación
COMMENT ON TABLE material_sales IS 'Registro de ventas de materiales dentales';
COMMENT ON COLUMN material_sales.invoice_id IS 'ID de la factura asociada';
COMMENT ON COLUMN material_sales.material_id IS 'ID del material vendido';
COMMENT ON COLUMN material_sales.quantity IS 'Cantidad vendida';
COMMENT ON COLUMN material_sales.cost_price IS 'Precio de costo del material';
COMMENT ON COLUMN material_sales.sale_price IS 'Precio de venta unitario';
COMMENT ON COLUMN material_sales.total IS 'Total de la venta (quantity * sale_price)';
