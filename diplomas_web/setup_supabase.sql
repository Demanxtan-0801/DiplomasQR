-- Ejecuta esto en el SQL Editor de Supabase

-- Tabla cursos (nueva)
CREATE TABLE IF NOT EXISTS cursos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_curso   TEXT NOT NULL,
    fechas_texto   TEXT,
    valido_hasta   TEXT,
    fecha_raw      TEXT,
    total_diplomas INT DEFAULT 0,
    creado_en      TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla diplomas (actualizada con curso_id)
CREATE TABLE IF NOT EXISTS diplomas (
    id           TEXT PRIMARY KEY,
    curso_id     UUID REFERENCES cursos(id) ON DELETE CASCADE,
    codigo       TEXT NOT NULL,
    nombre       TEXT NOT NULL,
    rut          TEXT NOT NULL,
    nombre_curso TEXT,
    fechas_texto TEXT,
    valido_hasta TEXT,
    pdf_url      TEXT DEFAULT '',
    creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS cursos
ALTER TABLE cursos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura cursos"   ON cursos;
DROP POLICY IF EXISTS "insercion cursos" ON cursos;
DROP POLICY IF EXISTS "lectura diplomas"   ON diplomas;
DROP POLICY IF EXISTS "insercion diplomas" ON diplomas;
DROP POLICY IF EXISTS "update diplomas"    ON diplomas;

CREATE POLICY "lectura cursos"   ON cursos   FOR SELECT USING (true);
CREATE POLICY "insercion cursos" ON cursos   FOR INSERT WITH CHECK (true);
CREATE POLICY "lectura diplomas"   ON diplomas FOR SELECT USING (true);
CREATE POLICY "insercion diplomas" ON diplomas FOR INSERT WITH CHECK (true);
CREATE POLICY "update diplomas"    ON diplomas FOR UPDATE USING (true);
