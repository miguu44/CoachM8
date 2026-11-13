import {useEffect,useState} from 'react'
import {collection,onSnapshot,addDoc,setDoc,deleteDoc,doc} from 'firebase/firestore'
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'firebase/auth'
import {db,auth} from './firebase'
import Court from './Court'

const CATS=['Benjamín','Alevín','Infantil','Cadete','Junior','Senior']
const GOALS=['Bote','Tiro','Defensa','Transiciones','Táctica colectiva']
const POS=['Base','Escolta','Alero','Ala-pívot','Pívot']
const inp='border border-stone-300 rounded-lg p-2.5 w-full bg-white text-base'
const btn='bg-orange-600 active:bg-orange-700 text-white rounded-lg px-4 py-2.5 font-semibold'
const btn2='border border-stone-300 bg-white rounded-lg px-3 py-2 text-sm'
const fmt=(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
const today=()=>{const d=new Date();return fmt(d.getFullYear(),d.getMonth(),d.getDate())}
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function useCol(uid,name){
  const [d,setD]=useState([])
  useEffect(()=>onSnapshot(collection(db,'users',uid,name),s=>setD(s.docs.map(x=>({id:x.id,...x.data()})))),[uid,name])
  return d
}
const api=(uid,n)=>({add:x=>addDoc(collection(db,'users',uid,n),x),set:(id,x)=>setDoc(doc(db,'users',uid,n,id),x,{merge:true}),del:id=>deleteDoc(doc(db,'users',uid,n,id))})

function parseSession(t){
  const m=t.match(/\{[\s\S]*\}/); if(!m) throw new Error('No encuentro JSON en la respuesta')
  const j=JSON.parse(m[0]); if(!Array.isArray(j.blocks)) throw new Error('Falta la lista "blocks"'); return j
}
function buildPrompt(team,n,goal,dur,mat){
  return `Eres un entrenador de baloncesto experto en formación. Diseña una sesión de entrenamiento.
Categoría: ${team?.cat||''} (${team?.name||''}). Jugadores disponibles hoy: ${n}.
Objetivo: ${goal}. Duración total: ${dur} minutos. Material: ${mat||'balones y canastas'}.
Incluye calentamiento, parte principal y vuelta a la calma; adapta la dificultad a la edad.
Responde SOLO con JSON válido, sin texto extra, con este formato:
{"title":"...","blocks":[{"name":"...","minutes":10,"description":"explicación paso a paso con organización en la pista","material":"..."}]}
Los minutos de todos los bloques deben sumar ${dur}.`
}
function Session({it}){
  return <div className="mt-2 text-sm space-y-2">
    {it.diagram?.length>0&&<div className="max-w-md"><Court value={it.diagram} ro/></div>}
    {it.blocks?.map((b,i)=><div key={i} className="border-l-4 border-orange-500 pl-3">
      <b>{b.name}</b> <span className="text-stone-500">{b.minutes} min{b.material?` · ${b.material}`:''}</span>
      <p className="whitespace-pre-line">{b.description}</p></div>)}
    {it.description&&<p className="whitespace-pre-line">{it.description}</p>}</div>
}

function Login(){
  const [e,setE]=useState(''),[p,setP]=useState(''),[err,setErr]=useState('')
  const go=async reg=>{try{await(reg?createUserWithEmailAndPassword:signInWithEmailAndPassword)(auth,e,p)}catch(x){setErr(x.code)}}
  return <div className="min-h-screen grid place-items-center p-6"><div className="w-full max-w-sm space-y-3">
    <h1 className="text-3xl font-extrabold">Pizarra Coach</h1><p className="text-stone-600">Entra con tu correo para sincronizar ordenador y móvil.</p>
    <input className={inp} type="email" placeholder="Correo" value={e} onChange={x=>setE(x.target.value)}/>
    <input className={inp} type="password" placeholder="Contraseña (mín. 6)" value={p} onChange={x=>setP(x.target.value)}/>
    {err&&<p className="text-red-600 text-sm">{err}</p>}
    <button className={btn+' w-full'} onClick={()=>go(false)}>Entrar</button>
    <button className={btn2+' w-full'} onClick={()=>go(true)}>Crear cuenta</button></div></div>
}

function Teams({teams,players,tid,setTid,A}){
  const [n,setN]=useState(''),[c,setC]=useState(CATS[2]),[pn,setPn]=useState(''),[d,setD]=useState(''),[pos,setPos]=useState(POS[0])
  const mine=players.filter(p=>p.teamId===tid).sort((a,b)=>a.num-b.num)
  return <div className="space-y-6">
    <section className="space-y-2"><h2 className="text-xl font-bold">Equipos</h2>
      <div className="flex gap-2 flex-wrap"><input className={inp+' flex-1 min-w-40'} placeholder="Nombre del equipo" value={n} onChange={e=>setN(e.target.value)}/>
      <select className={inp+' w-auto'} value={c} onChange={e=>setC(e.target.value)}>{CATS.map(x=><option key={x}>{x}</option>)}</select>
      <button className={btn} onClick={()=>{if(n){A.teams.add({name:n,cat:c});setN('')}}}>Crear</button></div>
      <div className="flex gap-2 flex-wrap">{teams.map(t=><button key={t.id} onClick={()=>setTid(t.id)}
        className={`rounded-full px-4 py-2 text-sm font-medium ${t.id===tid?'bg-stone-900 text-white':'bg-white border'}`}>{t.name} · {t.cat}</button>)}</div></section>
    {tid&&<section className="space-y-2"><h2 className="text-xl font-bold">Plantilla ({mine.length})</h2>
      <div className="flex gap-2 flex-wrap"><input className={inp+' flex-1 min-w-40'} placeholder="Nombre" value={pn} onChange={e=>setPn(e.target.value)}/>
      <input className={inp+' w-20'} type="number" placeholder="Nº" value={d} onChange={e=>setD(e.target.value)}/>
      <select className={inp+' w-auto'} value={pos} onChange={e=>setPos(e.target.value)}>{POS.map(x=><option key={x}>{x}</option>)}</select>
      <button className={btn} onClick={()=>{if(pn){A.players.add({teamId:tid,name:pn,num:+d||0,pos});setPn('');setD('')}}}>Añadir</button></div>
      {mine.map(p=><div key={p.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border">
        <b className="w-8 text-orange-600">{p.num}</b><span className="flex-1">{p.name}</span><span className="text-sm text-stone-500">{p.pos}</span>
        <button className="text-red-600 text-sm" onClick={()=>confirm('¿Borrar jugador?')&&A.players.del(p.id)}>Borrar</button></div>)}</section>}
  </div>
}

const ST={A:['Asiste','bg-green-600 text-white'],F:['Falta','bg-red-600 text-white'],L:['Lesión','bg-amber-500 text-white']}
function Attendance({players,att,tid,A,date,setDate}){
  const mine=players.filter(p=>p.teamId===tid).sort((a,b)=>a.num-b.num)
  const recs=att.filter(a=>a.teamId===tid)
  const cur=recs.find(a=>a.date===date)?.r||{}
  const mark=(pid,v)=>A.attendance.set(`${tid}_${date}`,{teamId:tid,date,r:{[pid]:cur[pid]===v?'':v}})
  if(!tid) return <p>Primero crea o selecciona un equipo.</p>
  return <div className="space-y-4">
    <div className="flex items-center gap-3"><h2 className="text-xl font-bold flex-1">Asistencia</h2><input type="date" className={inp+' w-auto'} value={date} onChange={e=>setDate(e.target.value)}/></div>
    <p className="text-sm text-stone-600">Hoy: {mine.filter(p=>cur[p.id]==='A').length} asisten · {mine.filter(p=>cur[p.id]==='F').length} faltan · {mine.filter(p=>cur[p.id]==='L').length} lesionados</p>
    {mine.map(p=>{const tot=recs.length,a=recs.filter(r=>r.r?.[p.id]==='A').length
      return <div key={p.id} className="bg-white border rounded-xl p-3"><div className="flex justify-between mb-2"><span><b className="text-orange-600">{p.num}</b> {p.name}</span>
        <span className="text-sm text-stone-500">{tot?Math.round(a/tot*100):0}% · {a}/{tot}</span></div>
        <div className="grid grid-cols-3 gap-2">{Object.entries(ST).map(([k,[l,cl]])=><button key={k} onClick={()=>mark(p.id,k)}
          className={`rounded-lg py-3 font-semibold ${cur[p.id]===k?cl:'bg-stone-100'}`}>{l}</button>)}</div></div>})}
  </div>
}

function AI({teams,players,att,tid,date,A}){
  const team=teams.find(t=>t.id===tid)
  const mine=players.filter(p=>p.teamId===tid)
  const cur=att.find(a=>a.teamId===tid&&a.date===date)?.r
  const n=cur?mine.filter(p=>!['F','L'].includes(cur[p.id])).length:mine.length
  const [goal,setGoal]=useState(GOALS[0]),[dur,setDur]=useState(90),[mat,setMat]=useState('')
  const [key,setKey]=useState(localStorage.getItem('akey')||''),[paste,setPaste]=useState(''),[res,setRes]=useState(null),[msg,setMsg]=useState('')
  const prompt=buildPrompt(team,n,goal,dur,mat)
  const gen=async()=>{setMsg('Generando…')
    try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:3000,messages:[{role:'user',content:prompt}]})})
      const j=await r.json(); if(j.error) throw new Error(j.error.message)
      setRes(parseSession(j.content[0].text));setMsg('')}catch(e){setMsg(e.message)}}
  const parse=()=>{try{setRes(parseSession(paste));setMsg('')}catch(e){setMsg(e.message)}}
  const save=()=>{A.library.add({type:'session',title:res.title||'Sesión',cat:team?.cat||'',goal,players:n,duration:dur,blocks:res.blocks});setMsg('Guardada en la biblioteca ✓')}
  if(!tid) return <p>Primero selecciona un equipo.</p>
  return <div className="space-y-4"><h2 className="text-xl font-bold">Asistente de entrenamientos</h2>
    <p className="bg-orange-100 rounded-lg p-3 text-sm">{team.name} · {team.cat} · <b>{n} jugadores</b> disponibles el {date}</p>
    <div className="grid sm:grid-cols-3 gap-2"><select className={inp} value={goal} onChange={e=>setGoal(e.target.value)}>{GOALS.map(g=><option key={g}>{g}</option>)}</select>
      <select className={inp} value={dur} onChange={e=>setDur(+e.target.value)}><option value={60}>60 min</option><option value={90}>90 min</option></select>
      <input className={inp} placeholder="Material (conos, aros…)" value={mat} onChange={e=>setMat(e.target.value)}/></div>
    <div className="bg-white border rounded-xl p-3 space-y-2"><b>Con API Key de Claude</b>
      <input className={inp} type="password" placeholder="sk-ant-… (se guarda solo en este dispositivo)" value={key} onChange={e=>{setKey(e.target.value);localStorage.setItem('akey',e.target.value)}}/>
      <button className={btn} disabled={!key} onClick={gen}>Generar sesión aquí</button></div>
    <div className="bg-white border rounded-xl p-3 space-y-2"><b>Modo gratuito (sin API)</b>
      <button className={btn2} onClick={()=>navigator.clipboard.writeText(prompt).then(()=>setMsg('Prompt copiado ✓'))}>Copiar prompt listo</button>
      <textarea className={inp} rows={5} placeholder="Pega aquí la respuesta de Claude/ChatGPT" value={paste} onChange={e=>setPaste(e.target.value)}/>
      <button className={btn2} onClick={parse}>Estructurar respuesta</button></div>
    {msg&&<p className="text-sm">{msg}</p>}
    {res&&<div className="bg-white border rounded-xl p-4"><h3 className="font-bold text-lg">{res.title}</h3><Session it={res}/><button className={btn+' mt-3'} onClick={save}>Guardar en biblioteca</button></div>}
  </div>
}

function DiagramEdit({i,A}){
  const [on,setOn]=useState(false),[d,setD]=useState(i.diagram||[])
  return <div className="mt-2"><button className={btn2} onClick={()=>setOn(!on)}>✏️ {i.diagram?.length?'Editar':'Añadir'} diagrama</button>
    {on&&<div className="mt-2"><Court value={d} onChange={setD}/><button className={btn+' mt-2'} onClick={()=>{A.library.set(i.id,{diagram:d});setOn(false)}}>Guardar diagrama</button></div>}</div>
}

function Library({lib,teams,tid,A}){
  const [q,setQ]=useState(''),[fc,setFc]=useState(''),[fg,setFg]=useState(''),[fn,setFn]=useState('')
  const [f,setF]=useState({title:'',description:'',cat:CATS[2],goal:GOALS[0],players:10}),[open,setOpen]=useState(false)
  const [pd,setPd]=useState(today())
  const list=lib.filter(i=>(!q||(i.title+(i.description||'')).toLowerCase().includes(q.toLowerCase()))&&(!fc||i.cat===fc)&&(!fg||i.goal===fg)&&(!fn||i.players<=+fn))
  return <div className="space-y-4"><h2 className="text-xl font-bold">Biblioteca</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><input className={inp+' col-span-2 sm:col-span-1'} placeholder="Buscar…" value={q} onChange={e=>setQ(e.target.value)}/>
      <select className={inp} value={fc} onChange={e=>setFc(e.target.value)}><option value="">Toda edad</option>{CATS.map(c=><option key={c}>{c}</option>)}</select>
      <select className={inp} value={fg} onChange={e=>setFg(e.target.value)}><option value="">Todo objetivo</option>{GOALS.map(c=><option key={c}>{c}</option>)}</select>
      <input className={inp} type="number" placeholder="Nº jugadores" value={fn} onChange={e=>setFn(e.target.value)}/></div>
    <button className={btn2} onClick={()=>setOpen(!open)}>+ Nuevo ejercicio</button>
    {open&&<div className="bg-white border rounded-xl p-3 grid sm:grid-cols-2 gap-2">
      <input className={inp} placeholder="Título" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
      <input className={inp} type="number" placeholder="Jugadores" value={f.players} onChange={e=>setF({...f,players:+e.target.value})}/>
      <select className={inp} value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
      <select className={inp} value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}>{GOALS.map(c=><option key={c}>{c}</option>)}</select>
      <textarea className={inp+' sm:col-span-2'} rows={4} placeholder="Descripción" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      <div className="sm:col-span-2"><p className="text-sm mb-1 text-stone-600">Diagrama de pista (opcional)</p><Court value={f.diagram||[]} onChange={d=>setF({...f,diagram:d})}/></div>
      <button className={btn} onClick={()=>{if(f.title){A.library.add({...f,type:'exercise'});setF({title:'',description:'',cat:CATS[2],goal:GOALS[0],players:10});setOpen(false)}}}>Guardar</button></div>}
    <div className="flex items-center gap-2 text-sm">Planificar para: <input type="date" className={inp+' w-auto'} value={pd} onChange={e=>setPd(e.target.value)}/></div>
    {!list.length&&<p className="text-stone-500">Aún no hay resultados. Guarda ejercicios o sesiones generadas.</p>}
    {list.map(i=><details key={i.id} className="bg-white border rounded-xl p-3"><summary className="cursor-pointer font-semibold">{i.type==='session'?'📋':'🏀'} {i.title}
      <span className="block text-xs font-normal text-stone-500">{i.cat} · {i.goal} · {i.players} jug.{i.duration?` · ${i.duration} min`:''}</span></summary>
      <Session it={i}/><DiagramEdit i={i} A={A}/><div className="flex gap-2 mt-3"><button className={btn2} disabled={!tid} onClick={()=>A.plans.add({date:pd,teamId:tid,item:{...i}})}>Planificar</button>
      <button className="text-red-600 text-sm" onClick={()=>confirm('¿Borrar?')&&A.library.del(i.id)}>Borrar</button></div></details>)}
  </div>
}

function Planner({plans,teams,lib,tid,A}){
  const t0=new Date(),[ym,setYm]=useState([t0.getFullYear(),t0.getMonth()]),[sel,setSel]=useState(today()),[pick,setPick]=useState('')
  const [y,m]=ym,first=(new Date(y,m,1).getDay()+6)%7,nd=new Date(y,m+1,0).getDate()
  const cells=[...Array(first).fill(null),...Array.from({length:nd},(_,i)=>i+1)]
  const go=k=>{const d=new Date(y,m+k,1);setYm([d.getFullYear(),d.getMonth()])}
  const on=d=>plans.filter(p=>p.date===d),day=on(sel),[sy,sm,sd]=sel.split('-')
  return <div className="space-y-4">
    <div className="flex items-center gap-2"><button className={btn2} onClick={()=>go(-1)}>‹</button><h2 className="flex-1 text-center text-xl font-bold">{MESES[m]} {y}</h2><button className={btn2} onClick={()=>go(1)}>›</button>
      <button className={btn2} onClick={()=>{setYm([t0.getFullYear(),t0.getMonth()]);setSel(today())}}>Hoy</button></div>
    <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-500">{['L','M','X','J','V','S','D'].map(x=><div key={x}>{x}</div>)}</div>
    <div className="grid grid-cols-7 gap-1">{cells.map((d,i)=>{if(!d)return <div key={i}/>;const k=fmt(y,m,d),ps=on(k)
      return <button key={i} onClick={()=>setSel(k)} className={`min-h-14 md:min-h-24 rounded-lg border p-1 text-left align-top ${k===sel?'border-orange-600 ring-2 ring-orange-300':''} ${k===today()?'bg-orange-100':'bg-white'}`}>
        <span className="text-sm font-semibold">{d}</span>
        {ps.slice(0,2).map(p=><span key={p.id} className="hidden md:block truncate text-[11px] bg-orange-600 text-white rounded px-1 mt-0.5">{p.item.title}</span>)}
        {ps.length>0&&<span className="md:hidden flex gap-0.5 mt-1">{ps.map(p=><i key={p.id} className="w-2 h-2 rounded-full bg-orange-600"/>)}</span>}</button>})}</div>
    <section className="space-y-2"><h3 className="font-bold capitalize">{new Date(sy,sm-1,sd).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</h3>
      {!day.length&&<p className="text-stone-500">Sin sesión este día.</p>}
      {day.map(p=><details key={p.id} open className="bg-white border rounded-xl p-3"><summary className="cursor-pointer font-semibold">{p.item.title}<span className="block text-xs font-normal text-stone-500">{teams.find(x=>x.id===p.teamId)?.name}</span></summary>
        <Session it={p.item}/><button className="text-red-600 text-sm mt-2" onClick={()=>A.plans.del(p.id)}>Quitar</button></details>)}
      <div className="flex gap-2"><select className={inp} value={pick} onChange={e=>setPick(e.target.value)}><option value="">Añadir desde la biblioteca…</option>{lib.map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select>
        <button className={btn} disabled={!pick||!tid} onClick={()=>{A.plans.add({date:sel,teamId:tid,item:{...lib.find(i=>i.id===pick)}});setPick('')}}>Añadir</button></div></section></div>
}

const TABS=[['plan','Calendario','📅'],['att','Asistencia','✅'],['ai','IA','✨'],['lib','Biblioteca','📚'],['teams','Equipos','👥']]
function Main({uid}){
  const teams=useCol(uid,'teams'),players=useCol(uid,'players'),att=useCol(uid,'attendance'),lib=useCol(uid,'library'),plans=useCol(uid,'plans')
  const A=Object.fromEntries(['teams','players','attendance','library','plans'].map(n=>[n,api(uid,n)]))
  const [tab,setTab]=useState('att'),[tid,setTid]=useState(localStorage.getItem('tid')||''),[date,setDate]=useState(today())
  useEffect(()=>{if(teams.length&&!teams.find(t=>t.id===tid))setTid(teams[0].id)},[teams])
  useEffect(()=>{localStorage.setItem('tid',tid)},[tid])
  const nav=(cls,sel)=>TABS.map(([k,l,i])=><button key={k} onClick={()=>setTab(k)} className={cls+(tab===k?sel:'')}><span className="text-xl">{i}</span><span>{l}</span></button>)
  return <div className="md:flex min-h-screen">
    <aside className="hidden md:flex flex-col w-60 bg-stone-900 text-stone-200 p-4 gap-1 sticky top-0 h-screen">
      <h1 className="text-xl font-extrabold text-orange-500 mb-4">Pizarra Coach</h1>{nav('flex items-center gap-3 rounded-lg px-3 py-2.5 text-left',' bg-orange-600 text-white')}
      <select className="mt-4 bg-stone-800 rounded-lg p-2 text-sm" value={tid} onChange={e=>setTid(e.target.value)}>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.cat}</option>)}</select>
      <button className="mt-auto text-sm text-stone-400 text-left" onClick={()=>signOut(auth)}>Cerrar sesión</button></aside>
    <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 max-w-3xl w-full mx-auto">
      <div className="md:hidden mb-3"><select className={inp} value={tid} onChange={e=>setTid(e.target.value)}><option value="">Elige equipo</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name} · {t.cat}</option>)}</select></div>
      {tab==='teams'&&<Teams {...{teams,players,tid,setTid,A}}/>}
      {tab==='att'&&<Attendance {...{players,att,tid,A,date,setDate}}/>}
      {tab==='ai'&&<AI {...{teams,players,att,tid,date,A}}/>}
      {tab==='lib'&&<Library {...{lib,teams,tid,A}}/>}
      {tab==='plan'&&<Planner {...{plans,teams,lib,tid,A}}/>}
      <button className="md:hidden mt-8 text-sm text-stone-500" onClick={()=>signOut(auth)}>Cerrar sesión</button></main>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-stone-900 text-stone-300 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
      {nav('flex flex-col items-center py-2 text-[11px]',' text-orange-400')}</nav></div>
}

export default function App(){
  const [u,setU]=useState(undefined)
  useEffect(()=>onAuthStateChanged(auth,setU),[])
  if(u===undefined) return <p className="p-6">Cargando…</p>
  return u?<Main uid={u.uid}/>:<Login/>
}
