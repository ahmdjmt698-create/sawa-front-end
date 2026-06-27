// ── صفحة التسجيل ────────────────────────────────────
import { useNavigate } from "react-router-dom";
import Recorder from "../components/Recorder";

export function RecordPage() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>تسجيل جديد 🎙️</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          اضبط الإعدادات ثم اضغط "ابدأ التسجيل" — سيطلب المتصفح إذن مشاركة الشاشة
        </p>
      </div>
      <Recorder onUploadDone={(video) => navigate(`/watch/${video.id}`)} />
    </div>
  );
}


// ── صفحة المشاهدة ───────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { videosAPI } from "../api/client";
import VideoPlayer from "../components/VideoPlayer";

export function WatchPage() {
  const { id }               = useParams();
  const [searchParams]       = useSearchParams();
  const startTime            = parseFloat(searchParams.get("t") || "0");
  const [video,  setVideo]   = useState(null);
  const [error,  setError]   = useState("");
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    videosAPI.getVideo(id)
      .then(setVideo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div className="spin" style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--green)", borderRadius: "50%", margin: "0 auto" }} />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
      <h2 style={{ marginBottom: 8 }}>لم يُعثر على الفيديو</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>{error}</p>
      <Link to="/dashboard" className="btn btn-outline">العودة للوحة التحكم</Link>
    </div>
  );

  const mediaUrl = `http://127.0.0.1:8000/media/${video.file_path.split("/").pop()}`;

  // انتقل للوقت المحدد من البحث
  const onVideoLoad = (e) => {
    if (startTime > 0) {
      e.target.currentTime = startTime;
      e.target.play().catch(() => {});
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        ← العودة
      </Link>
      <VideoPlayer video={video} mediaUrl={mediaUrl} />
    </div>
  );
}


// ── صفحة المشاركة العامة (بدون تسجيل دخول) ──────────
export function SharePage() {
  const { token }            = useParams();
  const [video,  setVideo]   = useState(null);
  const [error,  setError]   = useState("");
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    videosAPI.getByToken(token)
      .then(setVideo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px" }}>
      <div className="spin" style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTopColor: "var(--green)", borderRadius: "50%", margin: "0 auto" }} />
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
      <h2>الرابط غير صحيح</h2>
      <p style={{ color: "var(--text-muted)" }}>{error}</p>
    </div>
  );

  const mediaUrl = `http://127.0.0.1:8000/media/${video.file_path.split("/").pop()}`;

  // انتقل للوقت المحدد من البحث
  const onVideoLoad = (e) => {
    if (startTime > 0) {
      e.target.currentTime = startTime;
      e.target.play().catch(() => {});
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
      {/* شعار صغير */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: "none", fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #34D399, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          سوى
        </Link>
        <Link to="/auth" className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
          أنشئ تسجيلك الخاص مجاناً
        </Link>
      </div>
      <VideoPlayer video={video} mediaUrl={mediaUrl} />
    </div>
  );
}
