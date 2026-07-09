/**
 * API Client — يعمل في التطوير والإنتاج
 */

// في الإنتاج: VITE_API_URL = رابط Render
// في التطوير: فارغ (الـ proxy في vite.config.js يتولى الأمر)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

function getToken() {
  return localStorage.getItem("sawa_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body, isFormData = false) {
  const headers = { ...authHeaders() };
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "خطأ غير متوقع" }));
    throw new Error(err.detail || "فشل الطلب");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (name, email, password) =>
    request("POST", "/auth/register", { name, email, password }),

  login: async (email, password) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || "فشل");
    return res.json();
  },

  me: () => request("GET", "/auth/me"),
};

// ── Videos ───────────────────────────────────────────
export const videosAPI = {
  upload: (file, title, dialect = "ar", onProgress) => {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("dialect", dialect);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/videos/upload`);
      const token = getToken();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 201) resolve(JSON.parse(xhr.responseText));
        else {
          try { reject(new Error(JSON.parse(xhr.responseText).detail || "فشل")); }
          catch { reject(new Error("فشل الرفع")); }
        }
      };
      xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
      xhr.send(form);
    });
  },

  getMyVideos: ()    => request("GET", "/videos/my"),
  getVideo:    (id)  => request("GET", `/videos/${id}`),
  getByToken:  (tok) => request("GET", `/videos/share/${tok}`),
  deleteVideo: (id)  => request("DELETE", `/videos/${id}`),

  // روابط البث الآمنة — تمر عبر التحقق من الصلاحيات على الخادم
  streamUrl:       (videoId)  => `${API_BASE}/videos/${videoId}/stream`,
  shareStreamUrl:  (token)    => `${API_BASE}/videos/share/${token}/stream`,
};

// ── Transcripts ───────────────────────────────────────
export const transcriptAPI = {
  get:    (videoId)       => request("GET",   `/transcripts/${videoId}`),
  edit:   (videoId, data) => request("PATCH", `/transcripts/${videoId}`, data),
  retry:  (videoId)       => request("POST",  `/transcripts/${videoId}/retry`),
  export: (videoId, fmt)  => `${API_BASE}/transcripts/${videoId}/export?fmt=${fmt}`,
};

// ── AI Features ───────────────────────────────────────
export const aiAPI = {
  translate:  (videoId)             => request("POST", `/transcripts/${videoId}/translate`),
  summarize:  (videoId)             => request("POST", `/transcripts/${videoId}/summarize`),
  diarize:    (videoId, n)          => request("POST", `/transcripts/${videoId}/diarize${n?`?num_speakers=${n}`:""}`),
  exportUrl:  (videoId, fmt)        => `${API_BASE}/transcripts/${videoId}/export?fmt=${fmt}`,
};

// ── Payments ──────────────────────────────────────────
export const paymentsAPI = {
  getPlans:  ()     => request("GET",  "/payments/plans"),
  getStatus: ()     => request("GET",  "/payments/status"),
  create:    (plan) => request("POST", "/payments/create", { plan }),
  demo:      (plan) => request("POST", `/payments/demo-activate/${plan}`),
};

// ── Search ────────────────────────────────────────────
export const searchAPI = {
  search:  (q)    => request("GET", `/search?q=${encodeURIComponent(q)}`),
  suggest: (q)    => request("GET", `/search/suggest?q=${encodeURIComponent(q)}`),
};
