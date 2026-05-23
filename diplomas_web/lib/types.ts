export interface Trabajador {
  nombre: string
  rut: string
  codigo: string
}

export interface Curso {
  id: string
  nombre_curso: string
  fechas_texto: string
  valido_hasta: string
  fecha_raw: string
  creado_en: string
  total_diplomas: number
}

export interface Diploma {
  id: string
  codigo: string
  nombre: string
  rut: string
  nombre_curso: string
  fechas_texto: string
  valido_hasta: string
  pdf_url: string
  curso_id: string
  creado_en: string
}

export interface ExcelData {
  nombre_curso: string
  fecha_raw: string
  fechas_texto: string
  valido_hasta: string
  trabajadores: Trabajador[]
}
