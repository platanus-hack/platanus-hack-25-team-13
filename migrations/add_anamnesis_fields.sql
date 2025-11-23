-- Add new fields to anamnesis table
-- Execute each ALTER TABLE statement separately

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS calificacion numeric(3,1) NULL;

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS tiempo_demora integer NULL;

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS is_completed boolean NULL DEFAULT false;

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS diagnostico_final text NULL;

ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS feedback_data jsonb NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.anamnesis.calificacion IS 'Calificación promedio de la simulación (1-7)';
COMMENT ON COLUMN public.anamnesis.tiempo_demora IS 'Tiempo que demoró la simulación en segundos';
COMMENT ON COLUMN public.anamnesis.is_completed IS 'Indica si la simulación fue completada o abandonada';
COMMENT ON COLUMN public.anamnesis.diagnostico_final IS 'Diagnóstico final que se muestra en la homepage';
COMMENT ON COLUMN public.anamnesis.feedback_data IS 'Datos completos del feedback de la simulación';

