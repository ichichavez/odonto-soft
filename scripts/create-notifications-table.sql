-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan actualizar sus propias notificaciones
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para insertar notificaciones (solo usuarios autenticados)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para eliminar notificaciones propias
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Insertar algunas notificaciones de ejemplo
INSERT INTO public.notifications (user_id, title, message, type, read) VALUES
(
    (SELECT id FROM public.users LIMIT 1),
    'Bienvenido al sistema',
    'Tu cuenta ha sido configurada correctamente. ¡Bienvenido al sistema de gestión dental!',
    'success',
    false
),
(
    (SELECT id FROM public.users LIMIT 1),
    'Recordatorio de cita',
    'Tienes una cita programada para mañana a las 10:00 AM con el paciente Juan Pérez.',
    'info',
    false
),
(
    (SELECT id FROM public.users LIMIT 1),
    'Stock bajo',
    'El material "Amalgama dental" tiene stock bajo. Solo quedan 5 unidades.',
    'warning',
    false
);

-- Verificar que la tabla se creó correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Contar notificaciones creadas
SELECT COUNT(*) as total_notifications FROM public.notifications;

COMMIT;
