'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Curso, Diploma } from '@/lib/types'

const Icon = {
  upload:   () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  folder:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  diploma:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  download: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  zip:      () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  check:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x:        () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  spinner:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M22 12a10 10 0 0 1-10 10"/></svg>,
  search:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  calendar: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

function Badge({ children, color='blue' }: { children: React.ReactNode; color?: string }) {
  const c: Record<string,string> = {
    blue: 'background:#dbeafe;color:#1e40af',
    green:'background:#dcfce7;color:#166534',
    gray: 'background:#f1f5f9;color:#475569',
  }
  return <span style={{...Object.fromEntries((c[color]||c.blue).split(';').map(s=>s.split(':'))),
    padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:600,display:'inline-block'}}>{children}</span>
}

interface ProcessResult {
  ok: boolean; curso_id: string; curso: string; fechas: string; total: number
  trabajadores: {nombre:string;rut:string;codigo:string}[]
  fechas_texto: string; valido_hasta: string
}

// ── Upload Zone ────────────────────────────────────────────────────────────
function UploadZone({ onResult }: { onResult: (d: ProcessResult) => void }) {
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (!file.name.match(/\.(xlsx?|xls)$/i)) { setError('Solo .xlsx o .xls'); return }
    setLoading(true); setError(''); setFileName(file.name)
    try {
      const fd = new FormData(); fd.append('excel', file)
      const res  = await fetch('/api/generar', { method:'POST', body:fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      onResult(data)
    } catch(e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setLoading(false) }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) processFile(f)
  }, [])

  return (
    <div>
      <div onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)} onDrop={onDrop}
        style={{border:`2px dashed ${dragging?'var(--accent)':'var(--border)'}`,borderRadius:12,
          padding:'40px 24px',textAlign:'center',cursor:loading?'default':'pointer',
          background:dragging?'var(--light)':'var(--white)',transition:'all .2s'}}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{display:'none'}}
          onChange={e=>e.target.files?.[0]&&processFile(e.target.files[0])} />
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8,color:'var(--accent)'}}>
              <Icon.spinner/> Procesando...
            </div>
            <p style={{color:'var(--muted)',fontSize:14}}>Procesando <strong>{fileName}</strong>...</p>
          </div>
        ) : (
          <>
            <div style={{width:56,height:56,borderRadius:12,background:'var(--light)',
              display:'flex',alignItems:'center',justifyContent:'center',
              margin:'0 auto 16px',color:'var(--accent)'}}><Icon.upload/></div>
            <p style={{fontWeight:600,color:'var(--navy)',marginBottom:6}}>Arrastra tu archivo Excel aquí</p>
            <p style={{color:'var(--muted)',fontSize:13}}>o haz clic para seleccionar · .xlsx / .xls</p>
          </>
        )}
      </div>
      {error && (
        <div style={{marginTop:10,padding:'10px 14px',background:'#fef2f2',
          border:'1px solid #fecaca',borderRadius:8,color:'var(--error)',
          fontSize:13,display:'flex',alignItems:'center',gap:8}}>
          <Icon.x/>{error}
        </div>
      )}
    </div>
  )
}

// ── Success Panel ──────────────────────────────────────────────────────────
function SuccessPanel({ result, onReset }: { result: ProcessResult; onReset: () => void }) {
  return (
    <div className="animate-fade-up" style={{background:'var(--white)',borderRadius:12,
      border:'1px solid var(--border)',overflow:'hidden'}}>
      <div style={{background:'var(--navy)',padding:'20px 24px',color:'white'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,.15)',
              display:'flex',alignItems:'center',justifyContent:'center'}}><Icon.check/></div>
            <div>
              <p style={{fontWeight:700,fontSize:16}}>{result.curso}</p>
              <p style={{opacity:.7,fontSize:13}}>{result.fechas_texto}</p>
            </div>
          </div>
          <Badge color="green">{result.total} diplomas</Badge>
        </div>
      </div>
      <div style={{padding:'14px 24px',background:'#fffbeb',borderBottom:'1px solid #fde68a'}}>
        <p style={{fontSize:13,color:'#92400e',fontWeight:600,marginBottom:4}}>
          📋 Siguiente paso — generar los PDFs con QR
        </p>
        <code style={{display:'block',marginTop:4,background:'#fef3c7',padding:'6px 10px',
          borderRadius:6,fontSize:12,color:'#78350f'}}>python3 lanzar.py</code>
      </div>
      <div style={{maxHeight:280,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'var(--bg)',position:'sticky',top:0}}>
            {['#','Nombre','RUT','Código'].map(h=>(
              <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,
                fontWeight:700,color:'var(--muted)',textTransform:'uppercase',
                letterSpacing:.5,borderBottom:'1px solid var(--border)'}}>{h}</th>
            ))}</tr></thead>
          <tbody>{result.trabajadores.map((t,i)=>(
            <tr key={i} style={{borderBottom:'1px solid var(--bg)'}}>
              <td style={{padding:'10px 16px',fontSize:12,color:'var(--muted)'}}>{i+1}</td>
              <td style={{padding:'10px 16px',fontSize:13,fontWeight:500}}>{t.nombre}</td>
              <td style={{padding:'10px 16px',fontSize:13,fontFamily:'monospace'}}>{t.rut}</td>
              <td style={{padding:'10px 16px'}}>
                <code style={{fontSize:11,background:'var(--light)',padding:'2px 8px',
                  borderRadius:4,color:'var(--blue)'}}>{t.codigo}</code>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{padding:'14px 24px',borderTop:'1px solid var(--border)',
        display:'flex',justifyContent:'flex-end'}}>
        <button onClick={onReset} style={{padding:'8px 18px',borderRadius:8,
          border:'1px solid var(--border)',background:'white',color:'var(--navy)',
          fontSize:13,fontWeight:600,cursor:'pointer'}}>
          Subir otro Excel
        </button>
      </div>
    </div>
  )
}

// ── Curso Card ─────────────────────────────────────────────────────────────
function CursoCard({ curso, selected, onClick }: { curso:Curso; selected:boolean; onClick:()=>void }) {
  return (
    <div onClick={onClick} style={{padding:'14px 16px',borderRadius:10,cursor:'pointer',
      border:`2px solid ${selected?'var(--accent)':'var(--border)'}`,
      background:selected?'var(--light)':'var(--white)',transition:'all .15s'}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
        <div style={{width:32,height:32,borderRadius:8,flexShrink:0,
          background:selected?'var(--accent)':'var(--bg)',
          display:'flex',alignItems:'center',justifyContent:'center',
          color:selected?'white':'var(--muted)'}}><Icon.folder/></div>
        <div style={{minWidth:0}}>
          <p style={{fontWeight:600,fontSize:13,color:'var(--navy)',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>
            {curso.nombre_curso}</p>
          <p style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{curso.fechas_texto}</p>
          <div style={{marginTop:6}}>
            <Badge color={selected?'blue':'gray'}>{curso.total_diplomas} diplomas</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Diploma Table ──────────────────────────────────────────────────────────
function DiplomaTable({ diplomas, search }: { diplomas:Diploma[]; search:string }) {
  const filtered = diplomas.filter(d =>
    d.nombre.toLowerCase().includes(search.toLowerCase()) ||
    d.rut.includes(search) || d.codigo.includes(search)
  )
  if (!filtered.length) return (
    <div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>No se encontraron diplomas</div>
  )
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr style={{background:'var(--bg)'}}>
          {['Nombre','RUT','Código','Válido hasta','PDF'].map(h=>(
            <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,
              fontWeight:700,color:'var(--muted)',textTransform:'uppercase',
              letterSpacing:.5,borderBottom:'1px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
          ))}</tr></thead>
        <tbody>{filtered.map(d=>(
          <tr key={d.id} style={{borderBottom:'1px solid var(--bg)'}}>
            <td style={{padding:'11px 16px',fontWeight:500,fontSize:13}}>{d.nombre}</td>
            <td style={{padding:'11px 16px',fontFamily:'monospace',fontSize:12,color:'var(--muted)'}}>{d.rut}</td>
            <td style={{padding:'11px 16px'}}>
              <code style={{fontSize:11,background:'var(--light)',padding:'2px 8px',
                borderRadius:4,color:'var(--blue)'}}>N°00-{d.codigo}</code>
            </td>
            <td style={{padding:'11px 16px',fontSize:12,color:'var(--muted)',whiteSpace:'nowrap'}}>{d.valido_hasta}</td>
            <td style={{padding:'11px 16px'}}>
              {d.pdf_url ? (
                <a href={d.pdf_url} target="_blank" rel="noreferrer" style={{
                  display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',
                  borderRadius:6,fontSize:12,fontWeight:600,
                  background:'var(--navy)',color:'white',textDecoration:'none'}}>
                  <Icon.download/> Ver PDF
                </a>
              ) : (
                <span style={{fontSize:12,color:'var(--muted)',fontStyle:'italic'}}>Pendiente</span>
              )}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [cursos,        setCursos]        = useState<Curso[]>([])
  const [selectedCurso, setSelected]      = useState<Curso|null>(null)
  const [diplomas,      setDiplomas]      = useState<Diploma[]>([])
  const [search,        setSearch]        = useState('')
  const [result,        setResult]        = useState<ProcessResult|null>(null)
  const [loadingCursos, setLoadingCursos] = useState(true)
  const [loadingDips,   setLoadingDips]   = useState(false)
  const [descargando,   setDescargando]   = useState(false)
  const [progreso,      setProgreso]      = useState(0)

  useEffect(() => {
    fetch('/api/cursos').then(r=>r.json())
      .then(d=>{ setCursos(d||[]); setLoadingCursos(false) })
      .catch(()=>setLoadingCursos(false))
  }, [result])

  useEffect(() => {
    if (!selectedCurso) return
    setLoadingDips(true)
    fetch(`/api/diplomas?curso_id=${selectedCurso.id}`).then(r=>r.json())
      .then(d=>{ setDiplomas(d||[]); setLoadingDips(false) })
      .catch(()=>setLoadingDips(false))
  }, [selectedCurso])

  const pdfsDisponibles = diplomas.filter(d => d.pdf_url).length

  async function handleDescargarTodos() {
    if (!selectedCurso || pdfsDisponibles === 0) return
    setDescargando(true)
    setProgreso(0)
    try {
      const JSZip = (await import('jszip')).default
      const zip   = new JSZip()
      const carpeta = zip.folder(selectedCurso.nombre_curso) as InstanceType<typeof JSZip>
      const conPdf  = diplomas.filter(d => d.pdf_url)
      let completados = 0

      await Promise.all(conPdf.map(async d => {
        try {
          const res  = await fetch(d.pdf_url)
          const blob = await res.blob()
          const nombre = `${d.codigo}_${d.nombre.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9 ]/g,'').trim()}.pdf`
          carpeta.file(nombre, blob)
        } catch { console.error(`Error: ${d.nombre}`) }
        finally {
          completados++
          setProgreso(Math.round((completados / conPdf.length) * 100))
        }
      }))

      const blob = await zip.generateAsync({ type:'blob' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${selectedCurso.nombre_curso.replace(/[^a-zA-Z0-9 ]/g,'').trim()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch(e) { console.error(e) }
    finally { setDescargando(false); setProgreso(0) }
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Header */}
      <header style={{background:'var(--navy)',padding:'0 32px',display:'flex',
        alignItems:'center',justifyContent:'space-between',height:60,
        borderBottom:'1px solid rgba(255,255,255,.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:'var(--accent)',
            display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}>
            <Icon.diploma/>
          </div>
          <div>
            <p style={{color:'white',fontWeight:700,fontSize:15,lineHeight:1}}>Acciona</p>
            <p style={{color:'rgba(255,255,255,.5)',fontSize:11,lineHeight:1,marginTop:2}}>Gestión de Diplomas</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:'#4ade80'}}/>
          <span style={{color:'rgba(255,255,255,.6)',fontSize:12}}>Conectado a Supabase</span>
        </div>
      </header>

      <main style={{display:'grid',gridTemplateColumns:'280px 1fr',height:'calc(100vh - 60px)'}}>
        {/* Sidebar */}
        <aside style={{background:'var(--white)',borderRight:'1px solid var(--border)',
          display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{padding:'20px 16px 12px',borderBottom:'1px solid var(--border)'}}>
            <p style={{fontWeight:700,fontSize:14,color:'var(--navy)',marginBottom:2}}>Cursos registrados</p>
            <p style={{fontSize:12,color:'var(--muted)'}}>{cursos.length} {cursos.length===1?'curso':'cursos'}</p>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'12px'}}>
            {loadingCursos ? (
              <div style={{padding:20,color:'var(--muted)',fontSize:13}}>Cargando...</div>
            ) : cursos.length===0 ? (
              <div style={{padding:20,textAlign:'center',color:'var(--muted)',fontSize:13}}>
                Aún no hay cursos.<br/>Sube un Excel para comenzar.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {cursos.map(c=>(
                  <CursoCard key={c.id} curso={c} selected={selectedCurso?.id===c.id}
                    onClick={()=>{ setSelected(c); setResult(null); setSearch('') }} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <div style={{overflow:'auto',padding:'28px 32px',display:'flex',flexDirection:'column',gap:24}}>
          {/* Upload */}
          <section>
            <div style={{marginBottom:14}}>
              <h1 style={{fontSize:18,fontWeight:700,color:'var(--navy)'}}>Subir nuevo Excel</h1>
              <p style={{fontSize:13,color:'var(--muted)',marginTop:2}}>
                Sube el listado de trabajadores para registrar el curso
              </p>
            </div>
            {result ? (
              <SuccessPanel result={result} onReset={()=>setResult(null)} />
            ) : (
              <div style={{background:'var(--white)',borderRadius:12,
                border:'1px solid var(--border)',padding:24}}>
                <UploadZone onResult={setResult} />
              </div>
            )}
          </section>

          {/* Diplomas del curso seleccionado */}
          {selectedCurso && (
            <section className="animate-fade-up">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                marginBottom:14,flexWrap:'wrap',gap:12}}>
                <div>
                  <h2 style={{fontSize:16,fontWeight:700,color:'var(--navy)'}}>
                    {selectedCurso.nombre_curso}
                  </h2>
                  <p style={{fontSize:12,color:'var(--muted)',marginTop:2,
                    display:'flex',alignItems:'center',gap:6}}>
                    <Icon.calendar/>
                    {selectedCurso.fechas_texto} · Válido hasta {selectedCurso.valido_hasta}
                  </p>
                </div>

                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  {/* Botón descargar todos */}
                  <button onClick={handleDescargarTodos}
                    disabled={descargando || pdfsDisponibles===0}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',
                      borderRadius:8,fontSize:13,fontWeight:600,border:'none',
                      cursor:pdfsDisponibles===0?'not-allowed':'pointer',
                      background:pdfsDisponibles===0?'var(--border)':descargando?'var(--accent)':'var(--blue)',
                      color:pdfsDisponibles===0?'var(--muted)':'white',transition:'all .15s'}}>
                    {descargando
                      ? <><Icon.spinner/> {progreso}% descargado</>
                      : <><Icon.zip/> {pdfsDisponibles===0
                          ? 'Sin PDFs disponibles'
                          : `Descargar todos (${pdfsDisponibles})`}</>
                    }
                  </button>

                  {/* Buscador */}
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',
                      color:'var(--muted)',pointerEvents:'none'}}><Icon.search/></div>
                    <input value={search} onChange={e=>setSearch(e.target.value)}
                      placeholder="Buscar trabajador..."
                      style={{paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,
                        borderRadius:8,border:'1px solid var(--border)',fontSize:13,
                        outline:'none',width:220,background:'var(--white)',color:'var(--navy)'}}/>
                  </div>
                </div>
              </div>

              <div style={{background:'var(--white)',borderRadius:12,
                border:'1px solid var(--border)',overflow:'hidden'}}>
                {loadingDips ? (
                  <div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <Icon.spinner/> Cargando diplomas...
                    </div>
                  </div>
                ) : (
                  <DiplomaTable diplomas={diplomas} search={search} />
                )}
              </div>
            </section>
          )}

          {/* Estado inicial */}
          {!selectedCurso && !result && cursos.length>0 && (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
              color:'var(--muted)',textAlign:'center',flexDirection:'column',gap:12,padding:40}}>
              <div style={{width:48,height:48,borderRadius:12,background:'var(--light)',
                display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>
                <Icon.folder/>
              </div>
              <div>
                <p style={{fontWeight:600,color:'var(--navy)'}}>Selecciona un curso</p>
                <p style={{fontSize:13,marginTop:4}}>Elige un curso del panel izquierdo para ver sus diplomas</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
