import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const [params]               = useSearchParams();
  const [mode, setMode]        = useState(params.get("mode") === "register" ? "register" : "login");
  const [name, setName]        = useState("");
  const [email, setEmail]      = useState("");
  const [password, setPassword]= useState("");
  const [error, setError]      = useState("");
  const [loading, setLoading]  = useState(false);

  const { login, register } = useAuth();
  const navigate            = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("يرجى إدخال اسمك"); setLoading(false); return; }
        await register(name, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* شعار */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: "none", fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg, #34D399, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            سوى
          </Link>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
            {mode === "login" ? "مرحباً بعودتك 👋" : "انضم إلى سوى مجاناً 🎙️"}
          </p>
        </div>

        {/* بطاقة الفورم */}
        <div className="card fade-in">
          {/* مبدّل Login / Register */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[["login", "تسجيل الدخول"], ["register", "حساب جديد"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, cursor: "pointer", background: mode === m ? "var(--bg-card)" : "transparent", color: mode === m ? "var(--text)" : "var(--text-muted)", transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <label>الاسم الكامل</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="أحمد محمد" required />
              </div>
            )}
            <div>
              <label>البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
            </div>
            <div>
              <label>كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" minLength={6} required />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "#F8717115", border: "1px solid #F8717133", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="spin" style={{ width: 16, height: 16, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />
                  جاري...
                </span>
              ) : mode === "login" ? "دخول →" : "إنشاء الحساب →"}
            </button>
          </form>
        </div>

        {mode === "login" && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>
            ليس لديك حساب؟{" "}
            <button onClick={() => setMode("register")}
              style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600 }}>
              سجّل مجاناً
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
