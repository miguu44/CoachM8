import {useRef,useState} from 'react'
const TOOLS=[['att','○ Ataque'],['def','✕ Defensa'],['cone','△ Cono'],['cut','→ Movimiento'],['pass','⇢ Pase'],['dribble','〰 Bote'],['move','✋ Mover'],['del','🗑 Borrar']]
const ARROWS=['cut','pass','dribble']
const wave=a=>{const dx=a.x2-a.x1,dy=a.y2-a.y1,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;let d=`M${a.x1} ${a.y1}`
  for(let s=7;s<L-7;s+=7){const o=Math.round(s/7)%2?6:-6;d+=`L${a.x1+ux*s-uy*o} ${a.y1+uy*s+ux*o}`}return d+`L${a.x2} ${a.y2}`}
export default function Court({value=[],onChange,ro}){
  const ref=useRef(),[tool,setTool]=useState('att'),[tmp,setTmp]=useState(null),[drag,setDrag]=useState(null)
  const pt=e=>{const s=ref.current,p=s.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const r=p.matrixTransform(s.getScreenCTM().inverse());return{x:Math.round(r.x),y:Math.round(r.y)}}
  const down=e=>{if(ro)return;const p=pt(e)
    if(ARROWS.includes(tool)){setTmp({t:tool,x1:p.x,y1:p.y,x2:p.x,y2:p.y});ref.current.setPointerCapture(e.pointerId)}
    else if(['att','def','cone'].includes(tool))onChange([...value,{t:tool,n:value.filter(v=>v.t===tool).length+1,x:p.x,y:p.y}])}
  const nodeDown=(e,i)=>{if(ro)return;e.stopPropagation()
    if(tool==='del')onChange(value.filter((_,k)=>k!==i))
    else if(tool==='move'&&value[i].x!=null){setDrag(i);ref.current.setPointerCapture(e.pointerId)}}
  const move=e=>{if(tmp){const p=pt(e);setTmp({...tmp,x2:p.x,y2:p.y})}
    else if(drag!=null){const p=pt(e);onChange(value.map((v,k)=>k===drag?{...v,x:p.x,y:p.y}:v))}}
  const up=()=>{if(tmp&&Math.hypot(tmp.x2-tmp.x1,tmp.y2-tmp.y1)>20)onChange([...value,tmp]);setTmp(null);setDrag(null)}
  const arrow=(a,k)=>{const p={stroke:'#1c1917',strokeWidth:3,fill:'none',markerEnd:'url(#ah)',onPointerDown:e=>nodeDown(e,k),className:tool==='del'&&!ro?'cursor-pointer':''}
    return a.t==='dribble'?<path key={k} d={wave(a)} {...p}/>:<line key={k} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} strokeDasharray={a.t==='pass'?'9 7':undefined} {...p}/>}
  const node=(v,k)=>v.t==='att'?<g key={k} onPointerDown={e=>nodeDown(e,k)}><circle cx={v.x} cy={v.y} r={17} fill="#fff" stroke="#1c1917" strokeWidth={3}/><text x={v.x} y={v.y+6} textAnchor="middle" fontSize="17" fontWeight="700">{v.n}</text></g>
    :v.t==='def'?<g key={k} onPointerDown={e=>nodeDown(e,k)}><circle cx={v.x} cy={v.y} r={17} fill="#fff" fillOpacity=".01"/><path d={`M${v.x-12} ${v.y-12}L${v.x+12} ${v.y+12}M${v.x+12} ${v.y-12}L${v.x-12} ${v.y+12}`} stroke="#dc2626" strokeWidth={4} strokeLinecap="round"/><text x={v.x+16} y={v.y-12} fontSize="13" fill="#dc2626" fontWeight="700">{v.n}</text></g>
    :<path key={k} onPointerDown={e=>nodeDown(e,k)} d={`M${v.x} ${v.y-13}L${v.x+13} ${v.y+10}L${v.x-13} ${v.y+10}Z`} fill="#f97316" stroke="#9a3412" strokeWidth={2}/>
  return <div>
    {!ro&&<div className="flex flex-wrap gap-1.5 mb-2">{TOOLS.map(([k,l])=><button type="button" key={k} onClick={()=>setTool(k)} className={`rounded-lg px-2.5 py-2 text-sm border ${tool===k?'bg-stone-900 text-white':'bg-white'}`}>{l}</button>)}
      <button type="button" className="rounded-lg px-2.5 py-2 text-sm border bg-white" onClick={()=>onChange(value.slice(0,-1))}>↶ Deshacer</button></div>}
    <svg ref={ref} viewBox="0 0 500 400" className="w-full rounded-xl border-2 border-stone-800 select-none" style={{touchAction:ro?'auto':'none',background:'#e8c58f'}}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9Z" fill="#1c1917"/></marker></defs>
      <g fill="none" stroke="#fff" strokeWidth="3"><rect x="165" y="10" width="170" height="215" fill="#d9a46a"/><path d="M195 225A55 55 0 0 0 305 225"/><path d="M45 10V100A211 211 0 0 0 455 100V10"/>
        <path d="M210 50A40 40 0 0 0 290 50"/><path d="M220 35H280"/><circle cx="250" cy="50" r="9" stroke="#ea580c"/><path d="M195 225A55 55 0 0 1 305 225" strokeDasharray="7 6"/>
        <path d="M0 390H500M195 390A55 55 0 0 1 305 390"/></g>
      {value.filter(v=>v.x1!=null).map(arrow)}{tmp&&arrow(tmp,'tmp')}
      {value.map((v,k)=>v.x!=null?node(v,k):null)}
    </svg></div>
}
