(function () {
  const SUPABASE_URL = "https://mnwwvpuxrzostrplfgmq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_sXXlF9GsNcVYnr2BxABAwg_T-BV19qJ";
  const sb =
    window.VaultForgeAuth && window.VaultForgeAuth.supabase
      ? window.VaultForgeAuth.supabase
      : window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const style = document.createElement("style");
  style.textContent = `
  .vf-contact-admin-btn{
    position:fixed;right:18px;bottom:18px;z-index:9998;
    border:none;cursor:pointer;border-radius:999px;
    padding:14px 18px;font-weight:800;
    background:linear-gradient(135deg,#f0c96a,#b7852d);color:#111;
    box-shadow:0 18px 38px rgba(0,0,0,.28)
  }
  .vf-contact-admin-modal{
    position:fixed;inset:0;background:rgba(2,6,14,.74);
    display:none;align-items:center;justify-content:center;
    padding:18px;z-index:9999
  }
  .vf-contact-admin-modal.show{display:flex}
  .vf-contact-admin-card{
    width:min(680px,100%);border-radius:26px;padding:22px;
    border:1px solid rgba(255,255,255,.10);
    background:linear-gradient(180deg,#0c1832,#091327);
    color:#f7f8fc;font-family:Arial,Helvetica,sans-serif;
    box-shadow:0 30px 90px rgba(0,0,0,.42)
  }
  .vf-contact-admin-head{
    display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px
  }
  .vf-contact-admin-head h3{margin:0 0 6px;font-size:1.4rem}
  .vf-contact-admin-head p{margin:0;color:#a6b2d1;line-height:1.55}
  .vf-contact-admin-close{
    width:46px;height:46px;border-radius:14px;cursor:pointer;
    border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff
  }
  .vf-contact-admin-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .vf-contact-admin-card label{
    display:block;font-size:12px;letter-spacing:.10em;text-transform:uppercase;
    color:#a6b2d1;font-weight:700;margin:0 0 7px
  }
  .vf-contact-admin-card input,.vf-contact-admin-card textarea{
    width:100%;padding:13px 14px;border-radius:14px;
    border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;outline:none
  }
  .vf-contact-admin-card textarea{min-height:140px;resize:vertical}
  .vf-contact-admin-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
  .vf-contact-admin-send,.vf-contact-admin-cancel{
    border:none;cursor:pointer;border-radius:16px;padding:13px 18px;min-height:50px;font-weight:800
  }
  .vf-contact-admin-send{background:linear-gradient(135deg,#1dd48a,#10a96d);color:#fff}
  .vf-contact-admin-cancel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.10);color:#fff}
  .vf-contact-admin-status{
    margin-top:12px;padding:11px 13px;border-radius:13px;background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.10);font-size:13px;color:#d6e4ff
  }
  .vf-contact-admin-status.ok{color:#aaf2ce}
  .vf-contact-admin-status.err{color:#ffc3cc}
  @media(max-width:760px){.vf-contact-admin-row2{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <button type="button" class="vf-contact-admin-btn" id="vfContactAdminBtn">Contact Admin</button>
    <div class="vf-contact-admin-modal" id="vfContactAdminModal">
      <div class="vf-contact-admin-card">
        <div class="vf-contact-admin-head">
          <div>
            <h3>Contact Admin</h3>
            <p>Send a message directly from the member area. This saves into your VaultForge admin inbox.</p>
          </div>
          <button type="button" class="vf-contact-admin-close" id="vfContactAdminClose">×</button>
        </div>

        <div class="vf-contact-admin-row2">
          <div>
            <label for="vfAdminName">Name</label>
            <input id="vfAdminName" placeholder="Your name">
          </div>
          <div>
            <label for="vfAdminEmail">Email</label>
            <input id="vfAdminEmail" placeholder="you@email.com">
          </div>
        </div>

        <div style="margin-top:12px">
          <label for="vfAdminSubject">Subject</label>
          <input id="vfAdminSubject" placeholder="What do you need help with?">
        </div>

        <div style="margin-top:12px">
          <label for="vfAdminMessage">Message</label>
          <textarea id="vfAdminMessage" placeholder="Tell admin what happened, what page you were on, and what you need."></textarea>
        </div>

        <div class="vf-contact-admin-actions">
          <button type="button" class="vf-contact-admin-send" id="vfAdminSend">Send Message</button>
          <button type="button" class="vf-contact-admin-cancel" id="vfAdminCancel">Cancel</button>
        </div>

        <div class="vf-contact-admin-status" id="vfAdminStatus">Ready.</div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const btn = document.getElementById("vfContactAdminBtn");
  const modal = document.getElementById("vfContactAdminModal");
  const closeBtn = document.getElementById("vfContactAdminClose");
  const cancelBtn = document.getElementById("vfAdminCancel");
  const sendBtn = document.getElementById("vfAdminSend");
  const statusEl = document.getElementById("vfAdminStatus");

  function setStatus(msg, kind) {
    statusEl.className = "vf-contact-admin-status" + (kind ? " " + kind : "");
    statusEl.textContent = msg;
  }
  function openModal() { modal.classList.add("show"); }
  function closeModal() { modal.classList.remove("show"); }

  btn.onclick = openModal;
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  async function preloadUser() {
    try {
      const session = window.VaultForgeAuth && window.VaultForgeAuth.getSession
        ? await window.VaultForgeAuth.getSession()
        : (await sb.auth.getSession()).data.session;
      const user = session?.user;
      if (user) {
        const emailEl = document.getElementById("vfAdminEmail");
        if (!emailEl.value) emailEl.value = user.email || "";
        try {
          const prof = await sb.from("member_profiles").select("full_name").eq("user_id", user.id).maybeSingle();
          if (!prof.error && prof.data?.full_name) {
            const nameEl = document.getElementById("vfAdminName");
            if (!nameEl.value) nameEl.value = prof.data.full_name;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
  preloadUser();

  sendBtn.onclick = async () => {
    try {
      setStatus("Sending...");
      const session = window.VaultForgeAuth && window.VaultForgeAuth.getSession
        ? await window.VaultForgeAuth.getSession()
        : (await sb.auth.getSession()).data.session;
      const user = session?.user || null;

      const name = document.getElementById("vfAdminName").value.trim();
      const email = document.getElementById("vfAdminEmail").value.trim();
      const subject = document.getElementById("vfAdminSubject").value.trim();
      const message = document.getElementById("vfAdminMessage").value.trim();

      if (!name || !email || !subject || !message) {
        setStatus("Name, email, subject, and message are required.", "err");
        return;
      }

      const payload = {
        user_id: user ? user.id : null,
        name,
        email,
        subject,
        message,
        page_source: window.location.pathname
      };

      const resp = await sb.from("admin_messages").insert([payload]).select().single();
      if (resp.error) throw resp.error;

      setStatus("Message sent to admin.", "ok");
      document.getElementById("vfAdminSubject").value = "";
      document.getElementById("vfAdminMessage").value = "";
      setTimeout(closeModal, 700);
    } catch (e) {
      setStatus((e && e.message) ? e.message : "Send failed.", "err");
    }
  };

  window.VaultForgeAdminContact = {
    open: openModal,
    close: closeModal
  };
})();
