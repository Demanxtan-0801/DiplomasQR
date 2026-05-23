import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parsearExcel } from '@/lib/excel'
import { randomUUID } from 'crypto'
import * as crypto from 'crypto'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET = 'diplomas'

function diplomaId(codigo: string) {
  return crypto.createHash('sha256').update(codigo).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('excel') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const data   = parsearExcel(buffer)

    if (!data.trabajadores.length) {
      return NextResponse.json({ error: 'No se encontraron trabajadores en el Excel' }, { status: 400 })
    }

    // Crear registro de curso
    const cursoId = randomUUID()
    const { error: cursoError } = await sb.from('cursos').insert({
      id:             cursoId,
      nombre_curso:   data.nombre_curso,
      fechas_texto:   data.fechas_texto,
      valido_hasta:   data.valido_hasta,
      fecha_raw:      data.fecha_raw,
      total_diplomas: data.trabajadores.length,
    })
    if (cursoError) throw new Error(`Error creando curso: ${cursoError.message}`)

    // Registrar cada diploma (sin PDF por ahora — el PDF lo genera el script Python local)
    // La web solo registra los datos y la URL se actualiza cuando el script Python sube el PDF
    const diplomas = data.trabajadores.map(t => ({
      id:           diplomaId(t.codigo),
      curso_id:     cursoId,
      codigo:       t.codigo,
      nombre:       t.nombre,
      rut:          t.rut,
      nombre_curso: data.nombre_curso,
      fechas_texto: data.fechas_texto,
      valido_hasta: data.valido_hasta,
      pdf_url:      '',  // se llenará cuando el script suba el PDF
    }))

    const { error: dipError } = await sb.from('diplomas').upsert(diplomas)
    if (dipError) throw new Error(`Error guardando diplomas: ${dipError.message}`)

    return NextResponse.json({
      ok: true,
      curso_id:   cursoId,
      curso:      data.nombre_curso,
      fechas:     data.fechas_texto,
      total:      data.trabajadores.length,
      trabajadores: data.trabajadores,
      fechas_texto: data.fechas_texto,
      valido_hasta: data.valido_hasta,
    })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
