'use client';
import React, { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const [mode, setMode] = useState('quick');

  // Quick
  const [qFile, setQFile] = useState(null);
  const [qPrompt, setQPrompt] = useState('Matte black body, change wheel rims to red, tint windows');
  const [qLoading, setQLoading] = useState(false);
  const [qOutput, setQOutput] = useState(null);
  const [qError, setQError] = useState(null);

  // Precise
  const [pFile, setPFile] = useState(null);
  const [pPrompt, setPPrompt] = useState('Make masked area glossy red. Keep everything else identical.');
  const [pLoading, setPLoading] = useState(false);
  const [pOutput, setPOutput] = useState(null);
  const [pError, setPError] = useState(null);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!pFile) return;
    const url = URL.createObjectURL(pFile);
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      const maxW = 900;
      const scale = Math.min(maxW / img.width, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0,0,w,h); // black = keep area
      if (imgRef.current) {
        imgRef.current.src = url;
        imgRef.current.width = w;
        imgRef.current.height = h;
      }
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [pFile]);

  function drawStart(){ setIsDrawing(true); }
  function drawEnd(){ setIsDrawing(false); }
  function drawMove(e){
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    const getPos = (ev) => {
      if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX - rect.left, y: ev.touches[0].clientY - rect.top };
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    };
    const { x, y } = getPos(e);
    ctx.fillStyle = 'white'; // white = edit area
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  async function submitQuick(e){
    e.preventDefault();
    try{
      if(!qFile) throw new Error('Please select an image');
      setQLoading(true); setQError(null); setQOutput(null);
      const form = new FormData();
      form.append('image', qFile);
      form.append('prompt', qPrompt);
      const res = await fetch('/api/generate', { method:'POST', body: form });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setQOutput(data.output || []);
    }catch(err){ setQError(err.message || 'Generation failed'); }
    finally{ setQLoading(false); }
  }

  async function submitPrecise(e){
    e.preventDefault();
    try{
      if(!pFile) throw new Error('Please select an image');
      if(!canvasRef.current) throw new Error('Mask canvas not ready');
      setPLoading(true); setPError(null); setPOutput(null);
      const blob = await new Promise(resolve => canvasRef.current.toBlob(b => resolve(b), 'image/png'));
      const form = new FormData();
      form.append('image', pFile);
      form.append('mask', new File([blob], 'mask.png', { type:'image/png' }));
      form.append('prompt', pPrompt);
      const res = await fetch('/api/inpaint', { method:'POST', body: form });
      if(!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPOutput(data.output || []);
    }catch(err){ setPError(err.message || 'Inpainting failed'); }
    finally{ setPLoading(false); }
  }

  return (
    <main>
      <section style={{ background:'#111419', padding:24, borderRadius:16, border:'1px solid #1f2937' }}>
        <h2 style={{ marginTop:0 }}>CarCustomsAI — Quick & Precise</h2>
        <p>Quick = whole-image edits from text. Precise = paint a mask (white areas are edited) for details like rims & windows.</p>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          <button onClick={()=>setMode('quick')} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #374151', background: mode==='quick'?'#2563eb':'#0b0d10', color:'white' }}>Quick Edit</button>
          <button onClick={()=>setMode('precise')} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #374151', background: mode==='precise'?'#2563eb':'#0b0d10', color:'white' }}>Precise Edit</button>
        </div>

        {mode==='quick' && (
          <form onSubmit={submitQuick} style={{ display:'grid', gap:12 }}>
            <input type="file" accept="image/*" onChange={e=>setQFile(e.target.files?.[0]||null)} style={{ padding:8, borderRadius:8, background:'#0b0d10', border:'1px solid #374151' }} required />
            <textarea value={qPrompt} onChange={e=>setQPrompt(e.target.value)} rows={3} style={{ padding:12, borderRadius:8, background:'#0b0d10', border:'1px solid #374151', color:'#e7eaee' }} />
            <button type="submit" disabled={qLoading} style={{ padding:'12px 16px', borderRadius:10, border:'none', background:qLoading?'#374151':'#2563eb', color:'white', fontWeight:600 }}>
              {qLoading?'Generating…':'Generate (Quick)'}
            </button>
            {qError && <div style={{ background:'#1f2937', padding:12, borderRadius:8, color:'#fecaca', border:'1px solid #b91c1c' }}>{qError}</div>}
            {qOutput && qOutput.length>0 && (
              <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {qOutput.map((url,i)=>(
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`AI result ${i+1}`} style={{ width:'100%', borderRadius:12, border:'1px solid #374151' }} />
                  </a>
                ))}
              </div>
            )}
          </form>
        )}

        {mode==='precise' && (
          <form onSubmit={submitPrecise} style={{ display:'grid', gap:12 }}>
            <input type="file" accept="image/*" onChange={e=>setPFile(e.target.files?.[0]||null)} style={{ padding:8, borderRadius:8, background:'#0b0d10', border:'1px solid #374151' }} required />
            <p style={{ margin:0 }}>Paint <b>white</b> on areas to modify (e.g., rims, windows). Black = unchanged.</p>
            <div style={{ position:'relative', width:'100%', overflowX:'auto', border:'1px dashed #374151', borderRadius:8, padding:8 }}>
              <img ref={imgRef} alt="preview" style={{ display:pFile?'block':'none', width:'100%', maxWidth:900, borderRadius:8, marginBottom:8 }} />
              <canvas
                ref={canvasRef}
                onMouseDown={drawStart} onMouseUp={drawEnd} onMouseLeave={drawEnd} onMouseMove={drawMove}
                onTouchStart={drawStart} onTouchEnd={drawEnd} onTouchMove={drawMove}
                style={{ display:pFile?'block':'none', width:'100%', maxWidth:900, borderRadius:8, background:'transparent', cursor:'crosshair' }}
              />
            </div>
            <textarea value={pPrompt} onChange={e=>setPPrompt(e.target.value)} rows={3} style={{ padding:12, borderRadius:8, background:'#0b0d10', border:'1px solid #374151', color:'#e7eaee' }} />
            <button type="submit" disabled={pLoading} style={{ padding:'12px 16px', borderRadius:10, border:'none', background:pLoading?'#374151':'#2563eb', color:'white', fontWeight:600 }}>
              {pLoading?'Generating…':'Generate (Precise)'}
            </button>
            {pError && <div style={{ background:'#1f2937', padding:12, borderRadius:8, color:'#fecaca', border:'1px solid #b91c1c' }}>{pError}</div>}
            {pOutput && pOutput.length>0 && (
              <div style={{ display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {pOutput.map((url,i)=>(
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`AI result ${i+1}`} style={{ width:'100%', borderRadius:12, border:'1px solid #374151' }} />
                  </a>
                ))}
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
