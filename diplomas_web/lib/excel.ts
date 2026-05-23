import * as XLSX from 'xlsx'
import { ExcelData, Trabajador } from './types'

const MESES: Record<string, number> = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12
}

const MESES_ES: Record<number, string> = {
  1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',
  7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateEs(d: Date): string {
  return `${d.getDate()} de ${MESES_ES[d.getMonth()+1]} del ${d.getFullYear()}`
}

export function parsearFechas(fechaRaw: string): { fechasTexto: string; validoHasta: string } {
  const fl = fechaRaw.toLowerCase()

  // Caso 1: "26 y 27 de Abril del 2026" (2 días)
  const m2 = fl.match(/(\d+)\s+y\s+(\d+)\s+de\s+(\w+)\s+(?:del?\s+)?(\d{4})/)
  if (m2) {
    const [,d1,d2,mes,anio] = m2
    const mesN = MESES[mes] || 1
    const dtFin = new Date(+anio, mesN-1, +d2)
    const valido = addDays(dtFin, 365)
    return {
      fechasTexto: `${d1} y ${d2} de ${mes.charAt(0).toUpperCase()+mes.slice(1)} del ${anio}`,
      validoHasta: formatDateEs(valido)
    }
  }

  // Caso 2: "10 de Abril 2026" (1 día) o "10 de Abril del 2026"
  const m1 = fl.match(/(\d+)\s+de\s+(\w+)\s+(?:del?\s+)?(\d{4})/)
  if (m1) {
    const [,d,mes,anio] = m1
    const mesN = MESES[mes] || 1
    const dt = new Date(+anio, mesN-1, +d)
    const valido = addDays(dt, 365)
    return {
      fechasTexto: `${d} de ${mes.charAt(0).toUpperCase()+mes.slice(1)} del ${anio}`,
      validoHasta: formatDateEs(valido)
    }
  }

  return { fechasTexto: fechaRaw, validoHasta: 'Por determinar' }
}

export function parsearExcel(buffer: ArrayBuffer): ExcelData {
  const wb   = XLSX.read(buffer, { type: 'array' })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][]

  let nombreCurso = ''
  let fechaRaw    = ''
  const trabajadores: Trabajador[] = []
  let enTabla = false

  for (const row of rows) {
    const celdas = row.map(c => String(c ?? '').trim())
    const texto  = celdas.filter(Boolean).join(' ')
    if (!texto) continue

    // Detectar encabezado de tabla
    if (celdas.some(c => c === 'Nombre') && celdas.some(c => c === 'Rut')) {
      enTabla = true
      continue
    }

    if (enTabla) {
      const noVacios = celdas.filter(Boolean)
      // Primera celda no vacía es número → fila de trabajador
      if (noVacios.length >= 4 && /^\d+$/.test(noVacios[0])) {
        const idxs = celdas.map((c,i) => c ? i : -1).filter(i => i >= 0)
        trabajadores.push({
          nombre: celdas[idxs[1]] || '',
          rut:    celdas[idxs[2]] || '',
          codigo: String(celdas[idxs[3]] || ''),
        })
        continue
      }
      enTabla = false
    }

    // Metadatos
    if (texto.startsWith('Fecha:') || texto.startsWith('Fecha :')) {
      fechaRaw = texto.replace(/^Fecha\s*:\s*/i, '').trim()
    }
    if ((texto.includes('Curso') || texto.includes('curso')) && !nombreCurso) {
      // Extraer nombre del curso de la celda que lo contiene
      const cel = celdas.find(c => c.length > 5 && (c.includes('Curso') || c.includes('curso')))
      if (cel) nombreCurso = cel
    }
  }

  const { fechasTexto, validoHasta } = parsearFechas(fechaRaw)

  return {
    nombre_curso: nombreCurso || 'Curso de Capacitación',
    fecha_raw:    fechaRaw,
    fechas_texto: fechasTexto,
    valido_hasta: validoHasta,
    trabajadores,
  }
}
