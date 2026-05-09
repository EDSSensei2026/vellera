import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import HFPerformanceAnalysis from "../components/HFPerformanceAnalysis";

const C = {
  bg:"#0a0e1a", card:"#111827", border:"#1f2937",
  accent:"#3b82f6", green:"#22c55e", yellow:"#eab308",
  orange:"#f97316", red:"#ef4444", purple:"#a855f7",
  teal:"#14b8a6", muted:"#6b7280", text:"#f9fafb", sec:"#9ca3af",
};

const rcol = v => v==null?C.muted:v>=67?C.green:v>=34?C.yellow:C.red;
const hcol = v => v==null?C.muted:v>=60?C.green:v>=35?C.yellow:C.red;

const ALERTS = {
  none:    { bg:"#052e16", border:"#166534", text:"#4ade80", label:"✅ All Systems Normal" },
  watch:   { bg:"#1c1917", border:"#a16207", text:"#fde047", label:"👁 Watch — Minor Stress" },
  warning: { bg:"#1c0a00", border:"#c2410c", text:"#fb923c", label:"⚠️ Warning — Recovery Compromised" },
  critical:{ bg:"#1c0000", border:"#b91c1c", text:"#f87171", label:"🔴 Critical — Rest Required" },
};

function velReady(hrv, rec) {
  const h=hrv||0, r=rec||0;
  if(h>=80&&r>=80) return {score:95,label:"Peak Performance 🔥",tip:"Max effort. PRs, hard sparring, competition.",color:C.green};
  if(h>=65&&r>=60) return {score:80,label:"Strong 💪",tip:"Heavy compounds, hard sparring.",color:C.green};
  if(h>=50&&r>=40) return {score:65,label:"Moderate ⚡",tip:"Technique work or moderate conditioning.",color:C.yellow};
  if(h>=35&&r>=25) return {score:45,label:"Low Energy 🌊",tip:"Mobility, light skill work only.",color:C.orange};
  return {score:20,label:"Rest Day 🛑",tip:"Full rest or recovery walk only. No training.",color:C.red};
}

function Ring({ value, max=100, color, label, size=88 }) {
  const r=(size-14)/2, circ=2*Math.PI*r, pct=Math.min((value||0)/max,1);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={11}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={11}
          strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
        <text x={size/2} y={size/2+6} textAnchor="middle" fill={C.text} fontSize={17} fontWeight={800}>{value??"—"}</text>
      </svg>
      <span style={{fontSize:10,color:C.sec,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{label}</span>
    </div>
  );
}

function Spark({ data, color, h=32, w=100 }) {
  const vals=(data||[]).map(Number).filter(v=>!isNaN(v));
  if(vals.length<2) return null;
  const mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-mn)/rng)*(h-4)-2}`).join(" ");
  return (
    <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/></svg>
  );
}

function MCard({ label, value, unit, color, icon, tdata, trend }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",flexDirection:"column",gap:4}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.sec,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{icon} {label}</span>
        {trend!=null&&<span style={{fontSize:11,color:trend>0?C.green:C.red,fontWeight:700}}>{trend>0?"▲":"▼"}{Math.abs(trend).toFixed(1)}{unit}</span>}
      </div>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontSize:28,fontWeight:800,color:color||C.text,lineHeight:1}}>{value??"—"}</span>
        {unit&&<span style={{fontSize:12,color:C.muted}}>{unit}</span>}
      </div>
      {tdata&&tdata.length>1&&<Spark data={tdata} color={color||C.accent}/>}
    </div>
  );
}

export default function WellnessDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);

  const handleAddRecoveryTask = async () => {
    setAddingTask(true);
    try {
      await base44.functions.invoke("addRecoveryLogTask", {});
      toast.success("Recovery log task added to Google Tasks!");
    } catch (e) {
      toast.error("Failed to add task — make sure Google Tasks is connected.");
    } finally {
      setAddingTask(false);
    }
  };

  useEffect(() => {
    base44.entities.BiometricLog.list("-date", 30)
      .then(d => { setLogs(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const latest = logs[0] || null;
  const tr = f => logs.slice(0,14).map(e=>e[f]).filter(v=>v!=null);
  const dl = f => { const a=tr(f); return a.length>=2?a[0]-a[1]:null; };
  const ready = latest ? velReady(latest.hrv, latest.recovery_pct) : null;

  const alertLevel = latest ? (
    (latest.hrv < 25 || latest.recovery_pct < 33) ? "critical" :
    (latest.hrv < 35 || latest.recovery_pct < 50) ? "warning" :
    (latest.hrv < 50 || latest.recovery_pct < 65) ? "watch" : "none"
  ) : "none";
  const alertStyle = ALERTS[alertLevel] || ALERTS.none;

  if (loading) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.sec,fontSize:15}}>
      Loading biometric data…
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter',sans-serif",color:C.text,paddingBottom:60}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1a1040)",borderBottom:`1px solid #1f2937`,padding:"20px 24px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:-.5}}>⚡ Performance Hub</div>
          <div style={{fontSize:12,color:C.sec,marginTop:2}}>
            Vellera · Train Smarter · Recover Faster
            {latest&&<> · Last sync: <strong style={{color:C.text}}>{latest.date}</strong></>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          {latest&&(
            <div style={{flex:1,background:alertStyle.bg,border:`1px solid ${alertStyle.border}`,borderRadius:10,padding:"10px 16px",color:alertStyle.text,fontSize:13,fontWeight:600}}>
              {alertStyle.label}
            </div>
          )}
          <button
            onClick={handleAddRecoveryTask}
            disabled={addingTask}
            style={{background:"#1d4ed8",border:"none",borderRadius:10,padding:"10px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:addingTask?"not-allowed":"pointer",opacity:addingTask?0.6:1,whiteSpace:"nowrap"}}
          >
            {addingTask ? "Adding…" : "➕ Add to Google Tasks"}
          </button>
        </div>
      </div>

      <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:20}}>

        {!latest&&(
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"32px 24px",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📡</div>
            <div style={{fontSize:15,fontWeight:700}}>No biometric data yet</div>
            <div style={{fontSize:13,color:C.sec,marginTop:4}}>Log a BiometricLog entry or connect WHOOP to get started.</div>
          </div>
        )}

        {latest&&<>
          {/* Core Vitals */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.sec,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Core Vitals</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
              <MCard label="HRV" value={latest.hrv} unit="ms" color={hcol(latest.hrv)} icon="💓" tdata={tr("hrv")} trend={dl("hrv")}/>
              <MCard label="Recovery" value={latest.recovery_pct} unit="%" color={rcol(latest.recovery_pct)} icon="🔋" tdata={tr("recovery_pct")} trend={dl("recovery_pct")}/>
              <MCard label="Sleep" value={latest.sleep_performance} unit="%" color={latest.sleep_performance>=80?C.green:latest.sleep_performance>=60?C.yellow:C.orange} icon="😴" tdata={tr("sleep_performance")}/>
              <MCard label="Resting HR" value={latest.rhr} unit="bpm" color={latest.rhr?(latest.rhr<=60?C.green:latest.rhr<=72?C.yellow:C.orange):C.muted} icon="❤️" tdata={tr("rhr")} trend={dl("rhr")!=null?-dl("rhr"):null}/>
              {latest.strain!=null&&<MCard label="Strain" value={latest.strain} unit="/21" color={latest.strain>=18?C.red:latest.strain>=14?C.orange:C.green} icon="🏋️" tdata={tr("strain")}/>}
              {latest.body_battery!=null&&<MCard label="Body Battery" value={latest.body_battery} unit="%" color={latest.body_battery>=60?C.green:latest.body_battery>=30?C.yellow:C.red} icon="⚡" tdata={tr("body_battery")}/>}
            </div>
          </div>

          {/* Status rings */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.sec,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>Status at a Glance</div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",gap:24,flexWrap:"wrap",alignItems:"center"}}>
              <Ring value={latest.recovery_pct} color={rcol(latest.recovery_pct)} label="Recovery"/>
              <Ring value={latest.hrv} max={120} color={hcol(latest.hrv)} label="HRV"/>
              {latest.sleep_performance!=null&&<Ring value={latest.sleep_performance} color={C.teal} label="Sleep %"/>}
            </div>
          </div>

          {/* Training Readiness */}
          {ready&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.sec,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>⚡ Training Readiness</div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start"}}>
                <Ring value={ready.score} color={ready.color} label="Readiness" size={100}/>
                <div style={{flex:1,minWidth:180,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:22,fontWeight:900,color:ready.color}}>{ready.label}</div>
                  <div style={{fontSize:13,color:C.sec,lineHeight:1.5}}>{ready.tip}</div>
                  <div style={{background:"#1f2937",borderRadius:8,padding:"8px 14px",fontSize:13,color:C.sec}}>
                    Today's volume: <span style={{color:C.text,fontWeight:700}}>
                      {ready.score>=80?"Normal":ready.score>=65?"−10%":ready.score>=45?"−30%":"No training"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {logs.length>1&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.sec,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>📅 Recent History</div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead><tr>{["Date","HRV","Recovery","Sleep %","RHR","Strain"].map(c=>(
                      <th key={c} style={{color:C.sec,textAlign:"left",padding:"8px 12px",borderBottom:`1px solid #1f2937`,fontWeight:600,textTransform:"uppercase",fontSize:10,letterSpacing:.8}}>{c}</th>
                    ))}</tr></thead>
                    <tbody>{logs.slice(0,14).map((e,i)=>(
                      <tr key={e.id||i} style={{borderBottom:`1px solid #1f293750`}}>
                        <td style={{padding:"8px 12px",color:C.text}}>{e.date}</td>
                        <td style={{padding:"8px 12px",color:hcol(e.hrv),fontWeight:700}}>{e.hrv??"—"}ms</td>
                        <td style={{padding:"8px 12px",color:rcol(e.recovery_pct),fontWeight:700}}>{e.recovery_pct!=null?`${e.recovery_pct}%`:"—"}</td>
                        <td style={{padding:"8px 12px",color:C.text}}>{e.sleep_performance!=null?`${e.sleep_performance}%`:"—"}</td>
                        <td style={{padding:"8px 12px",color:C.text}}>{e.rhr!=null?`${e.rhr}bpm`:"—"}</td>
                        <td style={{padding:"8px 12px",color:C.text}}>{e.strain!=null?`${e.strain}/21`:"—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HF AI Analysis */}
          <HFPerformanceAnalysis logs={logs} />

          {/* Notes */}
          {latest.notes&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.sec,textTransform:"uppercase",letterSpacing:1.2,marginBottom:10}}>📝 Notes</div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",fontSize:13,color:C.sec,lineHeight:1.6}}>{latest.notes}</div>
            </div>
          )}
        </>}

      </div>
    </div>
  );
}