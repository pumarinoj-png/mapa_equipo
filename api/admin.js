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

  /* ----- Planilla Excel (.xlsx), generada en el navegador sin librerías externas ----- */
  const xml = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function makeZip(files, mime) {
    const enc = new TextEncoder(); const chunks = []; const central = []; let offset = 0;
    const d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(f => {
      const name = enc.encode(f.name); const data = enc.encode(f.text); const crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      chunks.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((n, c) => n + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: mime });
  }

  const colName = i => { let s = ''; let n = i + 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

  function sheetXml(rows, widths) {
    const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
      if (v === null || v === undefined || v === '') return '';
      const ref = colName(ci) + (ri + 1); const st = ri === 0 ? 1 : 2;
      if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}" s="${st}"><v>${v}</v></c>`;
      return `<c r="${ref}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
    }).join('')}</row>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${colName(rows[0].length - 1)}${Math.max(rows.length, 1)}"/></worksheet>`;
  }

  function xlsxBlob(sheets) { // sheets: [{ name, rows, widths }]
    const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const files = [
      { name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
      { name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${MAIN}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEBE5DA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
      ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(s.rows, s.widths) }))
    ];
    return makeZip(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  const SCARF_COLS = [['status', 'Estatus'], ['certainty', 'Certidumbre'], ['autonomy', 'Autonomía'], ['relatedness', 'Conexión'], ['fairness', 'Justicia']];
  const NOW = { threat: 'Amenaza', neutral: 'Neutro', reward: 'Recompensa' };
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : '');

  function discOf(p) {
    const sc = {}; let n = 0;
    ['D', 'I', 'S', 'C'].forEach(L => {
      const v = [0, 1, 2].map(i => (p.disc || {})[L + i]).filter(x => x != null);
      sc[L] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; n += v.length;
    });
    if (!n) return null;
    const r = ['D', 'I', 'S', 'C'].filter(L => sc[L] != null).sort((a, b) => sc[b] - sc[a]);
    const second = r[1];
    return { sc, label: r[0] + (second && sc[second] >= 3 && sc[r[0]] - sc[second] <= 1 ? second : '') };
  }

  async function downloadPlanilla() {
    const L = data.leaders.filter(l => !filter || companyOf(l) === filter);
    if (!L.length) { toast('No hay líderes para la planilla.'); return; }
    toast('Preparando la planilla…');
    const recs = new Map(); let failed = 0;
    const withCopy = L.filter(l => l.hasSnapshot);
    for (let i = 0; i < withCopy.length; i += 5) {
      await Promise.all(withCopy.slice(i, i + 5).map(async l => { try { recs.set(l.leader.id, await api('?id=' + encodeURIComponent(l.leader.id))); } catch (e) { failed++; } }));
    }

    const leaderRows = [['Empresa', 'Líder', 'Correo', 'Equipo', 'Personas mapeadas', 'Avance promedio %', 'Conversaciones IA', 'Consultas al asesor', 'Último envío', 'Nivel del registro']];
    L.forEach(l => leaderRows.push([l.leader.company, l.leader.name, l.leader.email, l.leader.team, l.activity.people, l.activity.avgProgress, l.activity.aiConversations || 0, l.activity.advisorMessages || 0, fmt(l.updated), l.level === 'full' ? 'Completo' : 'Solo actividad']));

    const head = ['Empresa', 'Líder', 'Correo del líder', 'Equipo', 'Persona', 'Cargo', 'Tiempo con el líder', 'Avance del perfil %', 'Estilo DISC', 'D', 'I', 'S', 'C',
      ...SCARF_COLS.map(c => 'SCARF ' + c[1] + ' (1-5)'), ...SCARF_COLS.map(c => 'Hoy: ' + c[1]),
      'Fortalezas', 'Áreas de desarrollo', 'Rinde mejor en', 'Habilidad (1-5)', 'Motivación (1-5)', 'Potencial', 'Riesgo de fuga', 'Qué la motiva', 'Feedback preferido', 'Acción próximos 30 días', 'Notas del líder', 'Variables propias', 'Última actualización'];
    const peopleRows = [head];
    L.forEach(l => {
      const rec = recs.get(l.leader.id); const snap = rec && rec.snapshot; if (!snap) return;
      const vars = snap.customVars || [];
      (snap.people || []).forEach((p, i) => {
        const d = discOf(p); const sc = p.scarf || {};
        const notes = [p.strengthNote, p.devNote, p.bestNote, p.drainNote].map(x => (x || '').trim()).filter(Boolean).join(' | ');
        const custom = vars.map(v => { const c = (p.custom || {})[v.id]; return c && (c.score != null || c.summary) ? `${v.name}: ${c.score != null ? c.score + '/5' : ''}${c.summary ? ' - ' + c.summary : ''}` : ''; }).filter(Boolean).join(' | ');
        peopleRows.push([l.leader.company, l.leader.name, l.leader.email, l.leader.team, p.name, p.role, p.tenure, (l.activity.peopleDetail[i] || {}).progress ?? '', d ? d.label : '',
          ...['D', 'I', 'S', 'C'].map(k => (d && d.sc[k] != null ? Math.round(d.sc[k] * 10) / 10 : '')),
          ...SCARF_COLS.map(c => (sc[c[0]] || {}).s ?? ''), ...SCARF_COLS.map(c => NOW[(sc[c[0]] || {}).now] || ''),
          (p.strengths || []).join(', '), (p.devs || []).join(', '), (p.bestTasks || []).join(', '), p.skill ?? '', p.will ?? '', p.potential, cap(p.retention), (p.motivators || []).join(', '), p.feedback, p.action, notes, custom, fmt(p.updated)]);
      });
    });

    const blob = xlsxBlob([
      { name: 'Personas', rows: peopleRows, widths: [18, 20, 24, 16, 20, 20, 16, 10, 9, 6, 6, 6, 6, 11, 11, 11, 11, 11, 13, 13, 13, 13, 13, 30, 30, 30, 10, 10, 22, 12, 28, 28, 40, 40, 40, 16] },
      { name: 'Líderes', rows: leaderRows, widths: [18, 22, 26, 18, 12, 12, 12, 12, 18, 16] }
    ]);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `planilla-${filter ? filter.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : 'todas-las-empresas'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    const sinCopia = L.length - withCopy.length;
    toast(`Planilla descargada: ${peopleRows.length - 1} personas de ${recs.size} líderes.${sinCopia ? ` ${sinCopia} líder(es) sin copia completa quedan solo en la hoja Líderes.` : ''}${failed ? ` No se pudieron leer ${failed}.` : ''}`);
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
        <div class="btn-row"><button class="btn" data-a="xlsx">Descargar planilla (Excel)</button><button class="btn ghost" data-a="csv">Lista de líderes (CSV)</button><button class="btn ghost" data-a="refresh">Actualizar</button></div></div>
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
      else if (a === 'xlsx') await downloadPlanilla();
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
