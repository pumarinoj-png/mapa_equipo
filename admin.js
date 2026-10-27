/* Panel de administración: muestra el registro que envían los líderes (ver api/sync.js y api/admin.js).
   "Ver resultados" abre la app en modo solo lectura (index.html?admin=ID) con las respuestas del líder. */
(() => {
  'use strict';
  const KEY = 'mapa-admin-code'; // misma clave que usa app.js en la vista de solo lectura
  const root = document.getElementById('admin');
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = t => (t ? new Date(t).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '-');
  const getCode = () => { try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const usage = a => (a.aiConversations || 0) + (a.advisorMessages || 0);
  const companyOf = l => l.leader.company || 'Sin empresa';
  let data = null;
  let filter = '';

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  async function api(path, method = 'GET') {
    const res = await fetch('/api/admin' + path, { method, headers: { 'X-Admin-Code': getCode() } });
    let j = null; try { j = await res.json(); } catch (e) { /* ignorar */ }
    if (!res.ok) { const e = new Error((j && j.message) || 'No se pudo conectar con el servidor.'); e.status = res.status; throw e; }
    return j;
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function loginView(msg) {
    root.innerHTML = `<div class="page-head"><div><h1>Registro de líderes</h1><p>Aquí ves lo que cada líder ha trabajado en la herramienta, por empresa. Ingresa el código de administración que configuraste en Vercel.</p></div></div>
      <form class="panel" id="login"><div class="field"><label for="code">Código de administración</label><input type="password" id="code" autocomplete="current-password" required style="max-width:22rem;font:inherit;padding:.6rem .75rem;border:1px solid #c9c3b8;border-radius:10px"></div>
      ${msg ? `<p style="color:var(--danger)">${esc(msg)}</p>` : ''}<button class="btn" type="submit">Entrar</button></form>`;
  }

  async function load() {
    try { data = await api(''); render(); }
    catch (e) {
      if (e.status === 401) { try { sessionStorage.removeItem(KEY); } catch (x) { /* ignorar */ } loginView('Código incorrecto.'); }
      else loginView(e.message);
    }
  }

  function render() {
    const companies = [...new Set(data.leaders.map(companyOf))].sort((a, b) => a.localeCompare(b, 'es'));
    if (filter && !companies.includes(filter)) filter = '';
    const L = data.leaders.filter(l => !filter || companyOf(l) === filter);
    const people = L.reduce((n, l) => n + (l.activity.people || 0), 0);
    const avg = L.length ? Math.round(L.reduce((n, l) => n + (l.activity.avgProgress || 0), 0) / L.length) : 0;
    const ai = L.reduce((n, l) => n + usage(l.activity), 0);

    const byCompany = companies.map(c => {
      const ls = data.leaders.filter(l => companyOf(l) === c);
      return { c, n: ls.length, people: ls.reduce((n, l) => n + (l.activity.people || 0), 0), avg: Math.round(ls.reduce((n, l) => n + (l.activity.avgProgress || 0), 0) / ls.length) };
    });

    root.innerHTML = `<div class="page-head"><div><h1>Registro de líderes</h1><p>Lo que cada líder ha enviado desde la herramienta. Con el nivel completo puedes ver sus respuestas y resultados.</p></div>
        <div class="btn-row"><button class="btn ghost" data-a="csv">Descargar resumen (CSV)</button><button class="btn ghost" data-a="refresh">Actualizar</button></div></div>
      <section class="panel"><div class="field" style="max-width:22rem"><label for="f-company">Empresa</label>
        <select id="f-company"><option value="">Todas (${companies.length})</option>${companies.map(c => `<option ${c === filter ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="stat-row"><div><strong>${L.length}</strong>líderes</div><div><strong>${people}</strong>personas mapeadas</div><div><strong>${avg}%</strong>avance promedio</div><div><strong>${ai}</strong>usos de la IA</div></div>
        ${L.length ? `<div class="scroll-x"><table class="data-table"><thead><tr><th>Líder</th><th>Empresa</th><th>Equipo</th><th>Personas</th><th>Avance</th><th>Usos de IA</th><th>Último envío</th><th></th></tr></thead><tbody>
        ${L.map(l => `<tr><td><strong>${esc(l.leader.name)}</strong><br><span class="muted small">${esc(l.leader.email)}</span></td><td>${esc(l.leader.company)}</td><td>${esc(l.leader.team)}</td><td>${l.activity.people}</td><td>${l.activity.avgProgress}%</td>
          <td>${usage(l.activity)}</td><td>${fmt(l.updated)}</td>
          <td><div class="btn-row">${l.hasSnapshot ? `<button class="btn small" data-a="results" data-id="${esc(l.leader.id)}">Ver resultados</button>` : ''}<button class="btn small ghost" data-a="open" data-id="${esc(l.leader.id)}">Resumen</button></div></td></tr>`).join('')}</tbody></table></div>`
          : '<p class="muted">Todavía no hay líderes que hayan enviado su registro.</p>'}</section>
      ${companies.length > 1 && !filter ? `<section class="panel"><h2>Por empresa</h2><div class="scroll-x"><table class="data-table"><thead><tr><th>Empresa</th><th>Líderes</th><th>Personas mapeadas</th><th>Avance promedio</th></tr></thead><tbody>
        ${byCompany.map(r => `<tr><td><strong>${esc(r.c)}</strong></td><td>${r.n}</td><td>${r.people}</td><td>${r.avg}%</td></tr>`).join('')}</tbody></table></div></section>` : ''}
      <div id="detail"></div>
      <section class="panel"><h2>Bitácora reciente</h2><p class="sect-desc">Cada vez que un líder envía cambios (personas, avance o uso de la IA) queda una línea.</p>
        ${data.log.length ? `<div class="scroll-x"><table class="data-table"><thead><tr><th>Fecha</th><th>Líder</th><th>Empresa</th><th>Equipo</th><th>Personas</th><th>Avance</th><th>Usos de IA</th></tr></thead><tbody>
        ${data.log.filter(x => !filter || (x.company || 'Sin empresa') === filter).map(x => `<tr><td>${fmt(x.t)}</td><td>${esc(x.name)}</td><td>${esc(x.company)}</td><td>${esc(x.team)}</td><td>${x.people}</td><td>${x.avg}%</td><td>${(x.ai || 0) + (x.adv || 0)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Sin movimientos todavía.</p>'}</section>`;
  }

  function detail(id) {
    const l = data.leaders.find(x => x.leader.id === id); if (!l) return;
    const full = l.level === 'full';
    const rows = (l.activity.peopleDetail || []).map(p => full
      ? `<tr><td><strong>${esc(p.name)}</strong><br><span class="muted small">${esc(p.role)}</span></td><td>${esc(p.disc) || '-'}</td><td>${p.progress}%</td><td>${p.skill ?? '-'} / ${p.will ?? '-'}</td><td>${esc(p.retention) || '-'}</td><td>${esc((p.strengths || []).join(', '))}</td><td>${esc((p.devs || []).join(', '))}</td></tr>`
      : `<tr><td>${esc(p.alias)}</td><td>${esc(p.disc) || '-'}</td><td>${p.progress}%</td></tr>`).join('');
    $('#detail').innerHTML = `<section class="panel"><h2>${esc(l.leader.name)}${l.leader.company ? ', ' + esc(l.leader.company) : ''}${l.leader.team ? ' (' + esc(l.leader.team) + ')' : ''}</h2>
      <p class="sect-desc">${full ? 'Resumen rápido. Para ver todas las respuestas, perfiles, mapa y conversaciones usa "Ver resultados". Habilidad y motivación se muestran como habilidad / motivación, de 1 a 5.' : 'Nivel de actividad: solo ves el avance por persona, sin nombres ni respuestas.'}</p>
      <div class="scroll-x"><table class="data-table"><thead><tr>${full ? '<th>Persona</th><th>DISC</th><th>Avance</th><th>Hab. / mot.</th><th>Riesgo de fuga</th><th>Fortalezas</th><th>Desarrollo</th>' : '<th>Persona</th><th>DISC</th><th>Avance</th>'}</tr></thead><tbody>${rows || '<tr><td colspan="7" class="muted">Sin personas.</td></tr>'}</tbody></table></div>
      <div class="btn-row" style="margin-top:1rem">${l.hasSnapshot ? `<button class="btn" data-a="results" data-id="${esc(id)}">Ver resultados</button><button class="btn ghost" data-a="json" data-id="${esc(id)}">Descargar copia (JSON)</button>` : ''}
        <button class="btn danger" data-a="del" data-id="${esc(id)}">Eliminar este registro</button></div></section>`;
    $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('submit', e => {
    if (e.target.id !== 'login') return;
    e.preventDefault();
    try { sessionStorage.setItem(KEY, $('#code').value.trim()); } catch (x) { /* ignorar */ }
    load();
  });

  document.addEventListener('change', e => { if (e.target.id === 'f-company') { filter = e.target.value; render(); } });

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a; const id = b.dataset.id;
    try {
      if (a === 'refresh') await load();
      else if (a === 'open') detail(id);
      else if (a === 'results') location.href = '/index.html?admin=' + encodeURIComponent(id);
      else if (a === 'json') { const rec = await api('?id=' + encodeURIComponent(id)); download(`mapa-${(rec.leader.name || id).replace(/\s+/g, '-')}.json`, JSON.stringify(rec.snapshot || rec, null, 2), 'application/json'); }
      else if (a === 'del') {
        if (confirm('Se eliminará el registro de este líder del servidor. Su copia local no se afecta. ¿Continuar?')) { await api('?id=' + encodeURIComponent(id), 'DELETE'); toast('Registro eliminado.'); await load(); }
      } else if (a === 'csv') {
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = ['Empresa', 'Líder', 'Correo', 'Equipo', 'Personas', 'Avance %', 'Conversaciones IA', 'Consultas asesor', 'Último envío'];
        const rows = data.leaders.filter(l => !filter || companyOf(l) === filter).map(l => [l.leader.company, l.leader.name, l.leader.email, l.leader.team, l.activity.people, l.activity.avgProgress, l.activity.aiConversations, l.activity.advisorMessages, fmt(l.updated)].map(cell).join(';'));
        download('registro-lideres.csv', '\ufeff' + [head.map(cell).join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
      }
    } catch (err) { toast(err.message); }
  });

  if (getCode()) load(); else loginView('');
})();
