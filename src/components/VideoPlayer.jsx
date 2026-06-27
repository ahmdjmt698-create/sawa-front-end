/**
 * مشغّل الفيديو مع النص المفرَّغ + الميزات الذكية
 */
import { useState, useRef, useEffect } from "react";
import { transcriptAPI, aiAPI } from "../api/client";
import AIFeatures from "./AIFeatures";

export default function VideoPlayer({ video, mediaUrl }) {
  const [transcript,   setTranscript]   = useState(null);
  const [status,       setStatus]       = useState("loading");
  const [currentTime,  setCurrentTime]  = useState(0);
  const [activeIdx,    setActiveIdx]    = useState(-1);
  const [isEditing,    setIsEditing]    = useState(false);
  const [editText,     setEditText]     = useState("");
  const [copied,       setCopied]       = useState(false);
  const [showAI,       setShowAI]       = useState(false);

  const videoRef  = useRef(null);
  const segRefs   = useRef({});
  const pollRef   = useRef(null);

  const fetchTranscript = async () => {
    try {
      const t = await transcriptAPI.get(video.id);
      setTranscript(t);
      setStatus(t.status);
      if (t.full_text) setEditText(t.full_text);
      if (t.status === "pending" || t.status === "processing") {
        pollRef.current = setTimeout(fetchTranscript, 4000);
      }
    } catch { setStatus("error"); }
  };

  useEffect(() => {
    fetchTranscript();
    return () => clearTimeout(pollRef.current);
  }, [video.id]);

  // مزامنة الوقت مع الجمل
  useEffect(() => {
    if (!transcript?.segments) return;
    const idx = transcript.segments.findIndex(
      (s) => currentTime >= s.start && currentTime < s.end
    );
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      if (idx >= 0 && segRefs.current[idx]) {
        segRefs.current[idx].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentTime, transcript]);

  const seekTo  = (t) => { if (videoRef.current) { videoRef.current.currentTime = t; videoRef.current.play(); } };
  const copyAll = () => { navigator.clipboard.writeText(transcript?.full_text || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const saveEdit = async () => {
    try {
      await transcriptAPI.edit(video.id, { full_text: editText });
      setTranscript((t) => ({ ...t, full_text: editText }));
      setIsEditing(false);
    } catch (e) { alert("فشل الحفظ: " + e.message); }
  };

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;

  // ألوان المتحدثين
  const SPEAKER_COLORS = ["#34D399","#818CF8","#F59E0B","#F472B6","#60A5FA","#C084FC"];
  const speakerColor = (name) => {
    if (!name) return "var(--text-muted)";
    const idx = parseInt(name.replace(/\D/g,"")) - 1 || 0;
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:20, alignItems:"start" }}>

      {/* ── عمود الفيديو ──────────────────────────── */}
      <div>
        <div style={{ borderRadius:14, overflow:"hidden", background:"#000", border:"1px solid var(--border)", marginBottom:16 }}>
          <video ref={videoRef} src={mediaUrl} controls
            style={{ width:"100%", display:"block", maxHeight:440 }}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          />
        </div>

        {/* بيانات الفيديو */}
        <div className="card" style={{ marginBottom:16 }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{video.title}</h2>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:12 }}>
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>👁 {video.views_count} مشاهدة</span>
            {video.duration && <span style={{ fontSize:12, color:"var(--text-muted)" }}>⏱ {fmtTime(video.duration)}</span>}
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>📅 {new Date(video.created_at).toLocaleDateString("ar")}</span>
          </div>

          {/* رابط المشاركة */}
          <div style={{ padding:"10px 14px", background:"var(--bg)", borderRadius:8, border:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text-muted)", flexShrink:0 }}>🔗</span>
            <span style={{ fontSize:12, color:"var(--green)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {window.location.origin}/share/{video.share_token}
            </span>
            <button className="btn btn-outline" style={{ padding:"4px 12px", fontSize:11, flexShrink:0 }}
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${video.share_token}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
              {copied ? "✅" : "نسخ"}
            </button>
          </div>
        </div>

        {/* ── الميزات الذكية ────────────────────────── */}
        <div className="card">
          <button
            onClick={() => setShowAI(!showAI)}
            style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", padding:0 }}
          >
            <span style={{ fontWeight:700, fontSize:15 }}>
              ✨ الميزات الذكية
            </span>
            <div style={{ display:"flex", gap:6 }}>
              <span style={{ fontSize:10, background:"#34D39920", color:"#34D399", borderRadius:6, padding:"2px 8px" }}>ترجمة</span>
              <span style={{ fontSize:10, background:"#818CF820", color:"#818CF8", borderRadius:6, padding:"2px 8px" }}>تلخيص</span>
              <span style={{ fontSize:10, background:"#C084FC20", color:"#C084FC", borderRadius:6, padding:"2px 8px" }}>متحدثون</span>
              <span style={{ color:"var(--text-muted)", fontSize:14 }}>{showAI ? "▲" : "▼"}</span>
            </div>
          </button>

          {showAI && (
            <div style={{ marginTop:14, borderTop:"1px solid var(--border)", paddingTop:14 }}>
              <AIFeatures videoId={video.id} transcriptDone={status === "done"} />
            </div>
          )}
        </div>
      </div>

      {/* ── عمود التفريغ ──────────────────────────── */}
      <div className="card" style={{ position:"sticky", top:20, maxHeight:"85vh", display:"flex", flexDirection:"column" }}>

        {/* رأس */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>📝 النص المفرَّغ</span>
          <div style={{ display:"flex", gap:6 }}>
            {status === "done" && !isEditing && (
              <>
                <button className="btn btn-outline" style={{ padding:"4px 10px", fontSize:11 }} onClick={copyAll}>
                  {copied ? "✅" : "📋"}
                </button>
                <button className="btn btn-outline" style={{ padding:"4px 10px", fontSize:11 }} onClick={() => setIsEditing(true)}>
                  ✏️
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button className="btn btn-primary" style={{ padding:"4px 10px", fontSize:11 }} onClick={saveEdit}>حفظ</button>
                <button className="btn btn-outline" style={{ padding:"4px 10px", fontSize:11 }} onClick={() => setIsEditing(false)}>إلغاء</button>
              </>
            )}
          </div>
        </div>

        {/* حالات التفريغ */}
        {(status === "pending" || status === "processing") && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ fontSize:28, marginBottom:12 }}>⚙️</div>
            <div style={{ fontWeight:600, marginBottom:6 }}>{status === "pending" ? "في الانتظار..." : "جاري التفريغ..."}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>سيظهر النص تلقائياً</div>
            <div style={{ display:"flex", gap:4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", animation:`pulse-ring 1.2s ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {status === "failed" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>❌</div>
            <div style={{ color:"var(--red)", marginBottom:12, fontSize:13 }}>فشل التفريغ</div>
            <button className="btn btn-outline" style={{ fontSize:12 }}
              onClick={() => transcriptAPI.retry(video.id).then(fetchTranscript)}>
              🔄 إعادة المحاولة
            </button>
          </div>
        )}

        {/* وضع التعديل */}
        {status === "done" && isEditing && (
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            style={{ flex:1, resize:"none", lineHeight:1.8, fontSize:13 }} />
        )}

        {/* الجمل المتزامنة مع دعم المتحدثين */}
        {status === "done" && !isEditing && transcript?.segments && (
          <div style={{ flex:1, overflowY:"auto", paddingLeft:2 }}>
            {transcript.segments.map((seg, idx) => {
              const isActive  = idx === activeIdx;
              const spColor   = speakerColor(seg.speaker);
              const prevSpeaker = idx > 0 ? transcript.segments[idx-1].speaker : null;
              const showLabel = seg.speaker && seg.speaker !== prevSpeaker;

              return (
                <div key={idx} ref={(el) => segRefs.current[idx] = el}>
                  {/* اسم المتحدث عند التغيير */}
                  {showLabel && (
                    <div style={{ padding:"8px 12px 2px", fontSize:11, fontWeight:700, color:spColor }}>
                      {seg.speaker}
                    </div>
                  )}
                  <div onClick={() => seekTo(seg.start)}
                    style={{ padding:"8px 12px", borderRadius:8, marginBottom:2, cursor:"pointer",
                      background: isActive ? "#34D39920" : "transparent",
                      border:`1px solid ${isActive ? "#34D39955" : "transparent"}`,
                      transition:"all 0.2s", lineHeight:1.7,
                      borderRight: seg.speaker ? `3px solid ${spColor}` : "3px solid transparent",
                    }}
                  >
                    <span style={{ fontSize:10, color:"var(--text-muted)", display:"block", marginBottom:1 }}>
                      {fmtTime(seg.start)}
                    </span>
                    <span style={{ fontSize:13, color: isActive ? "var(--green)" : "var(--text)", fontWeight: isActive ? 600 : 400 }}>
                      {seg.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* تصدير — محدّث بـ docx */}
        {status === "done" && (
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:12, marginTop:8, flexShrink:0 }}>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:8 }}>تصدير النص</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {[
                { fmt:"txt",  label:".txt",  color:"#34D399" },
                { fmt:"srt",  label:".srt",  color:"#818CF8" },
                { fmt:"docx", label:".docx", color:"#60A5FA" },
                { fmt:"json", label:".json", color:"#F59E0B" },
              ].map(({ fmt, label, color }) => (
                <a key={fmt} href={aiAPI.exportUrl(video.id, fmt)} download
                  style={{ flex:1, minWidth:50, textAlign:"center", padding:"6px 4px", borderRadius:8,
                    border:`1px solid ${color}33`, color, fontSize:12, fontWeight:700,
                    textDecoration:"none", background:`${color}10`,
                  }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
