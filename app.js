/* Mapa de equipo
   App estática. Los datos se guardan en el navegador (localStorage) de cada líder.
   Para cambiar preguntas, listas o textos, edita las constantes de la sección "Contenido". */
(() => {
  'use strict';

  /* =====================================================================
     Contenido (editable)
     ===================================================================== */
  const STORAGE_KEY = 'mapa-equipo-v1';
  const LEGACY_STORAGE_KEYS = ['castano-mapa-equipo-v1']; // versión anterior: se migra sola la primera vez
  const ADMIN_VIEW_ID = new URLSearchParams(location.search).get('admin');
  const READONLY = !!ADMIN_VIEW_ID; // vista de administración: solo lectura, no guarda ni envía nada
  const ADMIN_CODE_KEY = 'mapa-admin-code';

  const SCARF = [
    { k: 'status', name: 'Estatus', short: 'Estatus',
      q: 'Reconocimiento, posición y ser visto como alguien valioso.',
      signs: 'Señales: busca visibilidad, cuida su cargo o su experticia, se incomoda si lo corrigen frente a otros.',
      tip: 'Reconoce sus logros y su experticia (si le importa la visibilidad, hazlo en público). Entrega correcciones en privado.' },
    { k: 'certainty', name: 'Certidumbre', short: 'Certeza',
      q: 'Claridad, previsibilidad y saber qué viene.',
      signs: 'Señales: pregunta por el plan, se estresa con la ambigüedad o con cambios de último minuto.',
      tip: 'Comparte contexto, prioridades y próximos pasos. Anticipa los cambios y reduce las sorpresas.' },
    { k: 'autonomy', name: 'Autonomía', short: 'Autonomía',
      q: 'Control sobre cómo hace su trabajo y capacidad de decidir.',
      signs: 'Señales: rinde con libertad, se frustra con la microgestión o con instrucciones paso a paso.',
      tip: 'Acuerda el qué y deja que decida el cómo. Evita microgestionar y ofrece opciones en lugar de órdenes.' },
    { k: 'relatedness', name: 'Conexión', short: 'Conexión',
      q: 'Pertenencia, confianza y vínculo con el equipo y con su líder.',
      signs: 'Señales: busca conversar, se afecta si se siente excluido, rinde mejor cuando confía en quienes lo rodean.',
      tip: 'Invierte en conversaciones uno a uno, inclúyelo en las dinámicas del equipo y cuida la confianza.' },
    { k: 'fairness', name: 'Justicia', short: 'Justicia',
      q: 'Que las reglas, las cargas de trabajo y el reconocimiento sean justos.',
      signs: 'Señales: compara, reacciona fuerte ante el favoritismo o las excepciones, pide criterios claros.',
      tip: 'Sé transparente con los criterios, las cargas y las decisiones. Explica el porqué de lo que decides.' }
  ];

  const DISC = {
    D: { name: 'Dominante', desc: 'Directo, decidido y orientado a resultados.',
         tip: 'Dale objetivos claros y autonomía. Sé directo, ve al resultado y evita los rodeos.',
         items: ['Toma decisiones rápido y va directo al grano.',
                 'Le atraen los desafíos y se motiva con lograr resultados.',
                 'Cuestiona o confronta abiertamente cuando no está de acuerdo.'] },
    I: { name: 'Influyente', desc: 'Entusiasta, sociable y persuasivo.',
         tip: 'Conecta antes de entrar a la tarea y dale espacio para expresarse. Reconócelo en público y apóyalo con seguimiento de los detalles.',
         items: ['Se expresa con entusiasmo y contagia energía al grupo.',
                 'Se relaciona con facilidad y le gusta persuadir e involucrar a otros.',
                 'Prefiere trabajar con gente y generar ideas en conjunto.'] },
    S: { name: 'Estable', desc: 'Paciente, constante y colaborador.',
         tip: 'Explica los cambios con anticipación y dale tiempo para adaptarse. Reconoce su constancia y pídele su opinión en privado.',
         items: ['Es paciente, constante y confiable en su ritmo de trabajo.',
                 'Escucha, apoya y busca la armonía dentro del equipo.',
                 'Prefiere los cambios graduales y las rutinas estables.'] },
    C: { name: 'Concienzudo', desc: 'Analítico, preciso y orientado a la calidad.',
         tip: 'Entrega información completa y criterios claros. Dale tiempo para analizar y evita presionarlo a decidir sin datos.',
         items: ['Es meticuloso, revisa los detalles y cuida la calidad.',
                 'Se apoya en datos, criterios y procesos antes de decidir.',
                 'Prefiere reglas claras y evita cometer errores.'] }
  };
  const DISC_LETTERS = ['D', 'I', 'S', 'C'];

  const COMPETENCIAS = ['Análisis y datos', 'Creatividad', 'Ejecución y cumplimiento', 'Comunicación', 'Empatía',
    'Liderazgo de otros', 'Atención al detalle', 'Visión estratégica', 'Resolución de problemas', 'Colaboración',
    'Aprendizaje rápido', 'Organización', 'Negociación', 'Adaptabilidad', 'Iniciativa', 'Manejo de la presión'];

  const TAREAS = ['Analizar datos', 'Planificar y organizar', 'Ejecutar y entregar', 'Resolver crisis',
    'Atender clientes', 'Presentar y vender', 'Crear e innovar', 'Coordinar personas',
    'Documentar y estandarizar', 'Capacitar y mentorear', 'Negociar', 'Control de calidad'];

  const MOTIVADORES = ['Reconocimiento', 'Aprendizaje', 'Autonomía', 'Estabilidad', 'Propósito', 'Compensación',
    'Desafío', 'Flexibilidad', 'Pertenencia', 'Crecimiento de carrera'];

  const FEEDBACK = ['Directo y al grano', 'Con datos y ejemplos', 'Cálido y con contexto', 'Por escrito y con tiempo para pensar', 'Aún no lo sé'];
  const TENURE = ['Menos de 6 meses', '6 a 12 meses', '1 a 3 años', 'Más de 3 años'];
  const POTENCIAL = ['Mantener en su rol actual', 'Puede crecer dentro de su rol', 'Listo para mayor alcance'];

  const STEPS = [
    { id: 'base', label: 'Perfil' },
    { id: 'scarf', label: 'SCARF' },
    { id: 'disc', label: 'DISC' },
    { id: 'fort', label: 'Fortalezas' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'gestion', label: 'Gestión' },
    { id: 'extra', label: 'Variables propias' }
  ];
  const CORE_STEPS = 6; // los pasos 1 a 6 cuentan para el avance; las variables propias son opcionales

  const API_URL = '/api/ask';
  const CODE_KEY = 'mapa-access-code';
  const AI_MAX_QUESTIONS = 4;
  const VAR_SUGGESTIONS = ['Orientación al cliente', 'Pensamiento estratégico', 'Manejo de conflictos', 'Vive los valores de la empresa', 'Innovación', 'Trabajo en equipo'];

  /* =====================================================================
     Utilidades
     ===================================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => (w[0] || '').toUpperCase()).join('') || '?';
  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const pct = f => Math.round(f * 100);

  function fill(t, d) {
    for (const k of Object.keys(d)) {
      if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) {
        if (!t[k] || typeof t[k] !== 'object') t[k] = {};
        fill(t[k], d[k]);
      } else if (t[k] === undefined) {
        t[k] = Array.isArray(d[k]) ? [...d[k]] : d[k];
      }
    }
    return t;
  }

  /* =====================================================================
     Datos
     ===================================================================== */
  function blankPerson(name = '', role = '') {
    const scarf = {}; SCARF.forEach(d => { scarf[d.k] = { s: null, now: null, note: '' }; });
    const disc = {}; DISC_LETTERS.forEach(L => [0, 1, 2].forEach(i => { disc[L + i] = null; }));
    return {
      id: uid(), name, role, tenure: '', knows: null, created: Date.now(), updated: Date.now(),
      scarf, disc, custom: {},
      strengths: [], devs: [], strengthNote: '', devNote: '',
      bestTasks: [], bestNote: '', drainNote: '',
      prefs: { structure: null, social: null, horizon: null },
      skill: null, will: null, potential: '', retention: null, motivators: [], feedback: '', action: ''
    };
  }

  const emptyState = () => ({ v: 1, leader: null, people: [], customVars: [], sync: { optIn: false, last: null, error: '' }, advisor: { chat: [], names: false, notes: false } });

  function load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { for (const k of LEGACY_STORAGE_KEYS) { raw = localStorage.getItem(k); if (raw) break; } }
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.people)) {
          s.people = s.people.map(p => fill(p, blankPerson()));
          fill(s, { customVars: [], sync: { optIn: false, last: null, error: '' }, advisor: { chat: [], names: false, notes: false } });
          if (s.leader && !s.leader.id) s.leader.id = uid();
          return s;
        }
      }
    } catch (e) { /* ignorar */ }
    return emptyState();
  }

  let state = READONLY ? emptyState() : load();
  let adminRec = null;
  let currentId = null;
  let saveTimer = null;

  function save() { if (persist()) { flashSaved(); scheduleSync(); } }
  function flashSaved() {
    const el = $('#saved'); if (!el) return;
    el.textContent = 'Guardado'; el.classList.add('show');
    clearTimeout(saveTimer); saveTimer = setTimeout(() => el.classList.remove('show'), 1600);
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }
  const person = id => state.people.find(p => p.id === id);
  const cur = () => person(currentId);
  function touch() { const p = cur(); if (p) p.updated = Date.now(); save(); }

  /* =====================================================================
     Cálculos
     ===================================================================== */
  const STEP_FRAC = [
    p => [p.name.trim(), p.role.trim(), p.tenure, p.knows].filter(Boolean).length / 4,
    p => SCARF.reduce((n, d) => n + (p.scarf[d.k].s != null) + (p.scarf[d.k].now != null), 0) / 10,
    p => Object.values(p.disc).filter(v => v != null).length / 12,
    p => [p.strengths.length, p.devs.length, (p.strengthNote + p.devNote).trim()].filter(Boolean).length / 3,
    p => [p.bestTasks.length, Object.values(p.prefs).every(v => v != null), (p.bestNote + p.drainNote).trim()].filter(Boolean).length / 3,
    p => [p.skill, p.will, p.potential, p.retention, p.motivators.length, p.feedback, p.action.trim()].filter(Boolean).length / 7,
    p => {
      const vs = state.customVars;
      return vs.length ? vs.filter(v => p.custom[v.id] && p.custom[v.id].score != null).length / vs.length : 0;
    }
  ];
  const stepFrac = (p, i) => STEP_FRAC[i](p);
  const progress = p => STEP_FRAC.slice(0, CORE_STEPS).reduce((s, f) => s + f(p), 0) / CORE_STEPS;
  const nextStep = p => { const i = STEP_FRAC.slice(0, CORE_STEPS).findIndex(f => f(p) < 1); return i === -1 ? 0 : i; };
  const getCustom = (p, id) => (p.custom[id] || (p.custom[id] = { chat: [], score: null, summary: '', tip: '', done: false }));
  const firstName = p => (p.name || 'esta persona').trim().split(/\s+/)[0];

  function discOf(p) {
    const sc = {}; let n = 0;
    DISC_LETTERS.forEach(L => {
      const vals = [0, 1, 2].map(i => p.disc[L + i]).filter(v => v != null);
      sc[L] = avg(vals); n += vals.length;
    });
    if (!n) return null;
    const ranked = DISC_LETTERS.filter(L => sc[L] != null).sort((a, b) => sc[b] - sc[a]);
    const primary = ranked[0];
    const second = ranked[1];
    const secondary = second && sc[second] >= 3 && sc[primary] - sc[second] <= 1 ? second : null;
    return { scores: sc, primary, secondary, complete: n === 12, label: primary + (secondary || '') };
  }

  const bucket = v => (v == null ? null : v <= 2 ? 0 : v === 3 ? 1 : 2);

  function scarfAlerts(p) {
    return SCARF.filter(d => p.scarf[d.k].s >= 4 && p.scarf[d.k].now === 'threat');
  }

  function insights() {
    const out = [];
    const ppl = state.people;
    ppl.forEach(p => {
      if (p.retention === 'alto') out.push({ t: 'alert', x: `${p.name} tiene riesgo de fuga alto. Agenda una conversación de carrera pronto.` });
      scarfAlerts(p).forEach(d => out.push({ t: 'alert', x: `${p.name} es muy sensible a ${d.name.toLowerCase()} y hoy lo vive como amenaza.` }));
      if (p.skill >= 4 && p.will != null && p.will <= 2) out.push({ t: 'warn', x: `${p.name} tiene alta habilidad pero baja motivación. Vale la pena entender qué cambió.` });
      if (p.skill != null && p.skill <= 2 && p.will >= 4) out.push({ t: 'info', x: `${p.name} está muy motivado/a pero aún está desarrollando su habilidad. Es buen momento para invertir en capacitación o mentoría.` });
    });
    const withDisc = ppl.map(discOf).filter(Boolean);
    if (withDisc.length >= 3) {
      DISC_LETTERS.forEach(L => {
        if (!withDisc.some(d => d.primary === L)) {
          const gap = { D: 'impulso a decidir y a empujar resultados', I: 'energía para influir y conectar con otros', S: 'constancia y cohesión', C: 'rigurosidad con el detalle y la calidad' }[L];
          out.push({ t: 'warn', x: `Nadie en el equipo tiene estilo ${L} dominante. Podría faltar ${gap}.` });
        }
      });
      const counts = {}; withDisc.forEach(d => { counts[d.primary] = (counts[d.primary] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top[1] / withDisc.length >= 0.6) out.push({ t: 'info', x: `Más del 60% del equipo tiene estilo ${top[0]} dominante. Eso da cohesión, pero también puntos ciegos compartidos.` });
    }
    const tasksAnswered = ppl.filter(p => p.bestTasks.length).length;
    if (tasksAnswered >= 2) {
      const covered = new Set(ppl.flatMap(p => p.bestTasks));
      const missing = TAREAS.filter(t => !covered.has(t));
      if (missing.length) out.push({ t: 'warn', x: `Nadie destaca hoy en: ${missing.slice(0, 4).join(', ').toLowerCase()}${missing.length > 4 ? ' y otras' : ''}.` });
    }
    return out;
  }

  /* =====================================================================
     Componentes de interfaz
     ===================================================================== */
  function rating(path, val, lo, hi) {
    return `<div class="rating-wrap"><div class="rating" role="group">${[1, 2, 3, 4, 5].map(n =>
      `<button type="button" class="rbtn ${val === n ? 'on' : ''}" data-set="${path}" data-val="${n}" data-num="1" aria-pressed="${val === n}">${n}</button>`).join('')}</div>${
      lo ? `<div class="poles"><span>${esc(lo)}</span><span>${esc(hi)}</span></div>` : ''}</div>`;
  }
  function seg(path, val, opts) {
    return `<div class="seg" role="group">${opts.map(([v, l]) =>
      `<button type="button" class="sbtn ${val === v ? 'on' : ''}" data-set="${path}" data-val="${v}" aria-pressed="${val === v}">${l}</button>`).join('')}</div>`;
  }
  function tagGroup(path, options, selected, placeholder) {
    const all = [...options, ...selected.filter(x => !options.includes(x))];
    return `<div class="tags">${all.map(o =>
      `<button type="button" class="tag ${selected.includes(o) ? 'on' : ''}" data-tag="${path}" data-val="${esc(o)}" aria-pressed="${selected.includes(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="addtag"><input type="text" data-addtag="${path}" placeholder="${esc(placeholder || 'Agregar otra…')}" aria-label="${esc(placeholder || 'Agregar otra')}">
      <button type="button" class="btn ghost small" data-addtagbtn="${path}">Agregar</button></div>`;
  }
  function select(path, val, opts, placeholder) {
    return `<select data-path="${path}"><option value="">${esc(placeholder || 'Selecciona…')}</option>${opts.map(o =>
      `<option value="${esc(o)}" ${val === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  }
  function textarea(path, val, placeholder) {
    return `<textarea data-path="${path}" placeholder="${esc(placeholder || '')}">${esc(val)}</textarea>`;
  }

  function radar(values) {
    const cx = 150, cy = 130, R = 82, n = SCARF.length;
    const ang = i => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * (v / 5), cy + Math.sin(ang(i)) * R * (v / 5)];
    const poly = v => SCARF.map((_, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
    const data = SCARF.map((_, i) => pt(i, values[i] || 0).map(x => x.toFixed(1)).join(',')).join(' ');
    const labels = SCARF.map((d, i) => {
      const [x, y] = pt(i, 5.9); const c = Math.cos(ang(i));
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" fill="#2b1b14">${esc(d.short)}${values[i] ? ' ' + values[i] : ''}</text>`;
    }).join('');
    return `<svg class="radar" viewBox="0 0 300 260" role="img" aria-label="Gráfico radar SCARF">
      ${[1, 2, 3, 4, 5].map(v => `<polygon points="${poly(v)}" fill="none" stroke="#dfdbd3" stroke-width="1"/>`).join('')}
      ${SCARF.map((_, i) => { const [x, y] = pt(i, 5); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#dfdbd3"/>`; }).join('')}
      <polygon points="${data}" fill="rgba(122,74,46,.28)" stroke="#7a4a2e" stroke-width="2.5" stroke-linejoin="round"/>
      ${SCARF.map((_, i) => { const [x, y] = pt(i, values[i] || 0); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#55311f"/>`; }).join('')}
      ${labels}</svg>`;
  }

  /* =====================================================================
     Vistas
     ===================================================================== */
  function viewWelcome() {
    return `<section class="welcome">
      <div>
        <h1>Mapea a tu equipo y conócelo mejor, una persona a la vez</h1>
        <p class="lead">Una herramienta para que los líderes ordenen lo que saben de su gente: cómo reacciona, cómo prefiere trabajar, en qué destaca y cómo liderarla mejor.</p>
        <ol class="steps-list">
          <li><b>1</b><span>Agrega a las personas de tu equipo por su nombre.</span></li>
          <li><b>2</b><span>Responde preguntas guiadas sobre cada una: SCARF, estilo DISC, fortalezas, tareas y motivación.</span></li>
          <li><b>3</b><span>Mira el mapa del equipo y las sugerencias de cómo liderar a cada persona.</span></li>
        </ol>
        <p class="privacy" id="priv-main"><strong>Tu información es privada.</strong> Todo queda guardado solo en este navegador, en este dispositivo. Nadie más puede verla, y puedes descargar un respaldo cuando quieras.</p>
      </div>
      <form class="panel" id="welcome-form">
        <h2>Antes de empezar</h2>
        <div class="field"><label for="w-company">Empresa</label><input type="text" id="w-company" required maxlength="120" autocomplete="organization"></div>
        <div class="field"><label for="w-name">Tu nombre</label><input type="text" id="w-name" required autocomplete="name"></div>
        <div class="field"><label for="w-email">Tu correo <span class="hint">Opcional</span></label><input type="text" id="w-email" autocomplete="email"></div>
        <div class="field"><label for="w-team">Nombre de tu equipo o área <span class="hint">Opcional</span></label><input type="text" id="w-team"></div>
        <button class="btn" type="submit">Empezar a mapear</button>
      </form>
    </section>`;
  }

  // Para quienes ya tenían datos de una versión anterior y aún no indican su empresa.
  function viewCompany() {
    return `<section class="welcome"><div><h1>Un dato más antes de seguir</h1><p class="lead">Indica para qué empresa estás usando la herramienta. Tus datos no se pierden.</p></div>
      <form class="panel" id="company-form"><div class="field"><label for="c-company">Empresa</label><input type="text" id="c-company" required maxlength="120" autocomplete="organization"></div>
      <button class="btn" type="submit">Continuar</button></form></section>`;
  }

  function viewTeam() {
    const ppl = state.people;
    const rows = ppl.map(p => {
      const d = discOf(p); const pr = progress(p); const done = pr >= 0.999;
      return `<div class="person-row">
        <div class="avatar ${d ? 'disc-' + d.primary : ''}" aria-hidden="true">${esc(initials(p.name))}</div>
        <div><div class="person-name">${esc(p.name || 'Sin nombre')}</div><div class="person-role">${esc(p.role || 'Sin cargo definido')}</div></div>
        <div>${d ? `<span class="badge ${d.primary}">DISC ${d.label}</span>` : '<span class="muted small">DISC pendiente</span>'}</div>
        <div><div class="meter-label">${done ? 'Perfil completo' : 'Perfil al ' + pct(pr) + '%'}</div><div class="meter"><span style="width:${pct(pr)}%"></span></div></div>
        <div class="btn-row">
          ${READONLY ? '' : `<a class="btn small" href="#/editar/${p.id}/${nextStep(p)}">${pr === 0 ? 'Empezar' : done ? 'Editar' : 'Continuar'}</a>`}
          <a class="btn small ghost" href="#/persona/${p.id}">Ver perfil</a>
          ${READONLY ? '' : `<button class="btn small danger" data-action="delete" data-id="${p.id}" aria-label="Eliminar a ${esc(p.name)}">Eliminar</button>`}
        </div></div>`;
    }).join('');
    return `<div class="page-head"><div><h1>${esc(state.leader.team || 'Mi equipo')}</h1>
        <p>${READONLY ? `Equipo de ${esc(state.leader.name)}. Estás viendo sus respuestas en modo solo lectura.` : `Hola, ${esc(state.leader.name)}. Agrega a cada persona y ve completando su perfil a tu ritmo. Todo se guarda solo.`}</p></div>
        <div class="btn-row">${ppl.length ? '<button class="btn ghost" data-action="export-docx">Descargar informe (Word)</button>' : ''}${ppl.length >= 2 ? '<a class="btn" href="#/mapa">Ver mapa del equipo</a>' : ''}</div></div>
      ${READONLY ? '' : `<form class="panel" id="add-form">
        <h2>Agregar persona</h2>
        <div class="inline-form">
          <div><label for="np-name">Nombre</label><input type="text" id="np-name" required></div>
          <div><label for="np-role">Cargo <span class="hint">Opcional</span></label><input type="text" id="np-role"></div>
          <button class="btn" type="submit">Agregar y empezar</button>
        </div>
      </form>`}
      ${ppl.length ? `<div class="people">${rows}</div>` :
        `<div class="panel empty"><h2>Tu equipo está vacío</h2><p>Escribe el nombre de la primera persona arriba. Te iremos haciendo preguntas sobre ella y el mapa se irá armando solo.</p></div>`}`;
  }

  /* ----- Pasos del formulario ----- */
  function stepBase(p) {
    return `<h2>¿Quién es?</h2><p class="lead">Datos básicos para ubicar a la persona.</p>
      <div class="field"><label for="f-name">Nombre</label><input type="text" id="f-name" data-path="name" value="${esc(p.name)}"></div>
      <div class="field"><label for="f-role">Cargo o rol</label><input type="text" id="f-role" data-path="role" value="${esc(p.role)}"></div>
      <div class="field"><label for="f-tenure">Tiempo trabajando contigo</label>${select('tenure', p.tenure, TENURE).replace('<select', '<select id="f-tenure"')}</div>
      <div class="field"><span class="label">¿Qué tan bien conoces a esta persona?
        <span class="hint">Te ayuda a saber cuánta confianza tener en tus propias respuestas.</span></span>
        ${rating('knows', p.knows, 'La conozco poco', 'La conozco muy bien')}</div>`;
  }

  function stepScarf(p) {
    return `<h2>SCARF: qué la motiva y qué la amenaza</h2>
      <p class="lead">El modelo SCARF describe cinco necesidades sociales. Para cada una, indica qué tan importante es para esta persona y cómo la está viviendo hoy. Responde con lo que has observado, no con lo que supones.</p>
      ${SCARF.map(d => {
        const v = p.scarf[d.k];
        return `<div class="q-card"><h3>${d.name}</h3><p class="signs">${d.q} ${d.signs}</p>
          <div class="q-row">
            <div><div class="label">¿Qué tan importante es para ella?</div>${rating(`scarf.${d.k}.s`, v.s, 'Le da casi igual', 'Es clave para ella')}</div>
            <div><div class="label">Hoy lo vive como</div>${seg(`scarf.${d.k}.now`, v.now, [['threat', 'Amenaza'], ['neutral', 'Neutro'], ['reward', 'Recompensa']])}</div>
          </div>
          <label class="hint" for="n-${d.k}">¿Qué has observado? Opcional</label>
          <textarea id="n-${d.k}" data-path="scarf.${d.k}.note" placeholder="Un ejemplo concreto">${esc(v.note)}</textarea></div>`;
      }).join('')}`;
  }

  function stepDisc(p) {
    const order = [];
    for (let i = 0; i < 3; i++) DISC_LETTERS.forEach(L => order.push([L, i]));
    return `<h2>DISC: cómo se comporta en el trabajo</h2>
      <p class="lead">Piensa en cómo actúa habitualmente, no en cómo reacciona en un día excepcional. Indica qué tanto describe a esta persona cada frase.</p>
      ${order.map(([L, i]) => `<div class="disc-q"><div><strong>${esc(DISC[L].items[i])}</strong></div>
        <div>${rating(`disc.${L}${i}`, p.disc[L + i], 'No la describe', 'La describe muy bien')}</div></div>`).join('')}`;
  }

  function stepFort(p) {
    return `<h2>Fortalezas y áreas de desarrollo</h2>
      <p class="lead">Marca lo que corresponda. Si falta algo, agrégalo con tus propias palabras.</p>
      <div class="field"><span class="label">¿En qué es fuerte?</span>${tagGroup('strengths', COMPETENCIAS, p.strengths, 'Otra fortaleza…')}</div>
      <div class="field"><label for="f-sn">Cuenta una situación en la que brilló <span class="hint">Opcional</span></label>${textarea('strengthNote', p.strengthNote, 'Qué hizo y qué resultado tuvo').replace('<textarea', '<textarea id="f-sn"')}</div>
      <div class="field"><span class="label">¿Qué le cuesta o necesita desarrollar?</span>${tagGroup('devs', COMPETENCIAS, p.devs, 'Otra área…')}</div>
      <div class="field"><label for="f-dn">¿En qué situaciones se traba o necesita apoyo? <span class="hint">Opcional</span></label>${textarea('devNote', p.devNote, 'Describe la situación').replace('<textarea', '<textarea id="f-dn"')}</div>`;
  }

  function stepTareas(p) {
    const pref = (path, v, label, lo, hi) => `<div class="pref"><div class="label">${label}</div>${rating(path, v, lo, hi)}</div>`;
    return `<h2>Tareas y forma de trabajar</h2>
      <p class="lead">Qué le sale mejor, qué le desgasta y en qué condiciones rinde más.</p>
      <div class="field"><span class="label">Tareas en las que rinde mejor</span>${tagGroup('bestTasks', TAREAS, p.bestTasks, 'Otra tarea…')}</div>
      <div class="field"><label for="f-bn">¿Qué hace mejor que nadie en el equipo? <span class="hint">Opcional</span></label>${textarea('bestNote', p.bestNote, '').replace('<textarea', '<textarea id="f-bn"')}</div>
      <div class="field"><label for="f-drain">Tareas que le cuestan o le desgastan <span class="hint">Opcional</span></label>${textarea('drainNote', p.drainNote, '').replace('<textarea', '<textarea id="f-drain"')}</div>
      <h3>Cómo prefiere trabajar</h3>
      ${pref('prefs.structure', p.prefs.structure, 'Estructura', 'Prefiere crear y la ambigüedad', 'Prefiere procesos definidos')}
      ${pref('prefs.social', p.prefs.social, 'Interacción', 'Trabaja mejor sola', 'Trabaja mejor en equipo')}
      ${pref('prefs.horizon', p.prefs.horizon, 'Horizonte', 'Corto plazo y ejecución', 'Largo plazo y estrategia')}`;
  }

  function stepGestion(p) {
    return `<h2>Desempeño, motivación y cómo liderarla</h2>
      <p class="lead">Lo último: dónde está hoy y qué harás con esa información.</p>
      <div class="q-row">
        <div class="field"><span class="label">Habilidad en su rol actual</span>${rating('skill', p.skill, 'Aún aprende', 'Referente')}</div>
        <div class="field"><span class="label">Motivación y compromiso hoy</span>${rating('will', p.will, 'Muy baja', 'Muy alta')}</div>
      </div>
      <div class="field"><label for="f-pot">Potencial de crecimiento</label>${select('potential', p.potential, POTENCIAL).replace('<select', '<select id="f-pot"')}</div>
      <div class="field"><span class="label">Riesgo de que se vaya</span>${seg('retention', p.retention, [['bajo', 'Bajo'], ['medio', 'Medio'], ['alto', 'Alto']])}</div>
      <div class="field"><span class="label">¿Qué la motiva?</span>${tagGroup('motivators', MOTIVADORES, p.motivators, 'Otro motivador…')}</div>
      <div class="field"><label for="f-fb">¿Cómo prefiere recibir feedback?</label>${select('feedback', p.feedback, FEEDBACK).replace('<select', '<select id="f-fb"')}</div>
      <div class="field"><label for="f-act">¿Qué harás distinto con esta persona en los próximos 30 días?</label>${textarea('action', p.action, 'Una o dos acciones concretas').replace('<textarea', '<textarea id="f-act"')}</div>`;
  }
  const aiBusy = new Set();

  function varCard(p, v) {
    const c = getCustom(p, v.id);
    const busy = aiBusy.has(p.id + v.id);
    const fn = esc(firstName(p));
    const users = c.chat.filter(m => m.role === 'user').length;
    const last = c.chat[c.chat.length - 1];
    const dis = busy ? 'disabled' : '';
    let body = '';

    body += c.chat.map(m => `<div class="bubble ${m.role === 'assistant' ? 'ai' : 'me'}"><span class="who">${m.role === 'assistant' ? 'IA' : 'Tú'}</span>${esc(m.text)}</div>`).join('');
    if (busy) body += '<div class="bubble ai"><span class="who">IA</span>Pensando…</div>';

    if (!c.done) {
      if (!c.chat.length) {
        body += `<button type="button" class="btn" data-action="ai-start" data-var="${v.id}" ${dis}>Que la IA me haga preguntas sobre ${fn}</button>`;
      } else if (last.role === 'assistant') {
        body += `<div class="field" style="margin-top:.8rem"><label for="ans-${v.id}">Tu respuesta <span class="hint">Pregunta ${Math.min(users + 1, AI_MAX_QUESTIONS)} de ${AI_MAX_QUESTIONS}. Mientras más concreto el ejemplo, mejor la lectura.</span></label>
          <textarea id="ans-${v.id}" ${dis}></textarea></div>
          <div class="btn-row"><button type="button" class="btn" data-action="ai-answer" data-var="${v.id}" ${dis}>Responder</button>
          ${users ? `<button type="button" class="btn ghost" data-action="ai-finish" data-var="${v.id}" ${dis}>Terminar y ver lectura</button>` : ''}</div>`;
      } else if (!busy) {
        body += `<div class="btn-row" style="margin-top:.8rem"><button type="button" class="btn" data-action="ai-retry" data-var="${v.id}">Reintentar</button></div>`;
      }
    }

    if (c.done) {
      body += `<div class="ai-result"><p><strong>Lectura de la IA.</strong> ${esc(c.summary)}</p>${c.tip ? `<p><strong>Para ti como líder.</strong> ${esc(c.tip)}</p>` : ''}
        <p class="muted small">Es una síntesis de lo que tú observaste, no una evaluación objetiva.</p></div>`;
    }
    if (c.done || c.chat.length === 0 || c.score != null) {
      body += `<div class="field" style="margin-top:1rem"><span class="label">${c.done ? 'Nivel observado (puedes ajustarlo)' : 'Nivel en que está presente, si prefieres calificar directo'}</span>${rating(`custom.${v.id}.score`, c.score, 'Poco presente', 'Muy presente')}</div>`;
    }
    if (c.chat.length) body += `<button type="button" class="btn small ghost" data-action="ai-reset" data-var="${v.id}" ${dis}>Volver a empezar</button>`;

    return `<div class="q-card var-card"><div class="var-head"><div><h3>${esc(v.name)}</h3>${v.desc ? `<p class="signs">${esc(v.desc)}</p>` : ''}</div>
      <button type="button" class="btn small danger" data-action="var-delete" data-id="${v.id}">Quitar variable</button></div>${body}</div>`;
  }

  function stepCustom(p) {
    const fn = esc(firstName(p));
    return `<h2>Tus propias variables</h2>
      <p class="lead">Si hay algo que te importa de tu equipo y no está en las otras secciones, créalo aquí. Una IA te hará preguntas sobre ${fn} para que lo observes con ejemplos concretos y te propondrá una lectura. Las variables que crees se aplican a todo tu equipo, así podrás compararlas en el mapa.</p>
      <p class="privacy small">Para hacer las preguntas se envía a la IA solo el primer nombre, el cargo, la variable y tus respuestas. No se envía el resto del perfil. Evita escribir datos sensibles como salud o vida privada.</p>
      ${state.customVars.map(v => varCard(p, v)).join('')}
      <form class="q-card" id="var-form">
        <h3>${state.customVars.length ? 'Agregar otra variable' : 'Crear una variable'}</h3>
        <div class="field"><label for="v-name">Nombre</label><input type="text" id="v-name" maxlength="80" placeholder="Por ejemplo: Orientación al cliente" required>
          <div class="tags" style="margin-top:.5rem">${VAR_SUGGESTIONS.filter(x => !state.customVars.some(v => v.name === x)).map(x => `<button type="button" class="tag" data-action="var-suggest" data-val="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
        <div class="field"><label for="v-desc">¿Qué significa para ti? <span class="hint">Opcional, pero ayuda a la IA a hacer mejores preguntas.</span></label>
          <textarea id="v-desc" maxlength="600" placeholder="Por ejemplo: que se anticipe a lo que necesita el cliente y no espere a que se lo pidan"></textarea></div>
        <button class="btn" type="submit">Crear variable</button>
      </form>`;
  }

  const STEP_RENDER = [stepBase, stepScarf, stepDisc, stepFort, stepTareas, stepGestion, stepCustom];

  async function callAI(p, varId, final) {
    const v = state.customVars.find(x => x.id === varId); if (!v) return;
    const c = getCustom(p, varId); const key = p.id + varId;
    aiBusy.add(key); if (currentId === p.id) rerenderStep();
    let retry = false;
    try {
      let code = ''; try { code = localStorage.getItem(CODE_KEY) || ''; } catch (e) { /* ignorar */ }
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Code': code },
        body: JSON.stringify({ variable: { name: v.name, desc: v.desc }, person: { firstName: firstName(p), role: p.role }, transcript: c.chat, final: !!final })
      });
      let data = null; try { data = await res.json(); } catch (e) { /* ignorar */ }
      if (res.status === 401) {
        const entered = window.prompt('Ingresa el código de acceso para usar la IA. Te lo entrega quien administra la app.');
        if (entered && entered.trim()) { try { localStorage.setItem(CODE_KEY, entered.trim()); } catch (e) { /* ignorar */ } retry = true; return; }
        throw new Error('Se necesita el código de acceso para usar la IA.');
      }
      if (!res.ok || !data) throw new Error(((data && data.message) || httpErrorMessage(res.status)) + ' Mientras tanto puedes calificar la variable directamente.');
      if (data.type === 'question') c.chat.push({ role: 'assistant', text: data.text });
      else if (data.type === 'result') { c.score = data.score; c.summary = data.summary; c.tip = data.tip; c.done = true; }
      p.updated = Date.now(); save();
    } catch (err) {
      toast(err.message || 'No se pudo contactar a la IA.');
    } finally {
      aiBusy.delete(key);
      if (retry) callAI(p, varId, final);
      else if (currentId === p.id) rerenderStep();
    }
  }

  function viewEdit(p, step) {
    const stepper = STEPS.map((s, i) => `<a href="#/editar/${p.id}/${i}" class="${i === step ? 'current' : ''}" ${i === step ? 'aria-current="step"' : ''}>${s.label}
      <div class="bar"><span data-bar="${i}" style="width:${pct(stepFrac(p, i))}%"></span></div></a>`).join('');
    const last = step === STEPS.length - 1;
    return `<div class="page-head"><div><h1 class="person-title">${esc(p.name || 'Nueva persona')}</h1>
        <p>Responde lo que sepas y salta lo que no. Todo se guarda solo y puedes volver cuando quieras.</p></div>
        <a class="btn ghost" href="#/persona/${p.id}">Ver perfil</a></div>
      <nav class="stepper" aria-label="Pasos">${stepper}</nav>
      <div class="panel" id="step-body">${STEP_RENDER[step](p)}</div>
      <div class="step-foot">
        ${step > 0 ? `<a class="btn ghost" href="#/editar/${p.id}/${step - 1}">Anterior</a>` : '<a class="btn ghost" href="#/equipo">Volver al equipo</a>'}
        ${last ? `<a class="btn" href="#/persona/${p.id}">Terminar y ver perfil</a>` : `<a class="btn" href="#/editar/${p.id}/${step + 1}">Siguiente</a>`}
      </div>`;
  }

  /* ----- Perfil individual ----- */
  function chips(list, cls) { return list.length ? `<div class="chips">${list.map(x => `<span class="chip ${cls || ''}">${esc(x)}</span>`).join('')}</div>` : '<p class="muted small">Sin información todavía.</p>'; }
  const quote = t => (t && t.trim() ? `<div class="note-quote">${esc(t)}</div>` : '');
  const prefText = (v, lo, hi) => (v == null ? 'Sin responder' : v <= 2 ? lo : v === 3 ? 'Intermedio' : hi);

  function viewPerson(p) {
    const d = discOf(p); const pr = progress(p);
    const scarfVals = SCARF.map(x => p.scarf[x.k].s);
    const ranked = SCARF.filter(x => p.scarf[x.k].s != null).sort((a, b) => p.scarf[b.k].s - p.scarf[a.k].s);
    const topScarf = ranked.filter(x => p.scarf[x.k].s >= 4).slice(0, 2);
    const alerts = scarfAlerts(p);
    const nowLabel = { threat: 'Amenaza', neutral: 'Neutro', reward: 'Recompensa' };
    const sub = [p.role, p.tenure].filter(Boolean).join(', ');

    return `<div class="profile-head">
        <div class="avatar lg ${d ? 'disc-' + d.primary : ''}" aria-hidden="true">${esc(initials(p.name))}</div>
        <div><h1>${esc(p.name)}</h1><p class="muted" style="margin:0">${esc(sub || 'Sin cargo definido')}</p></div>
        <div class="profile-actions btn-row">${READONLY ? '' : `<a class="btn" href="#/editar/${p.id}/${nextStep(p)}">Editar</a>`}
          <button class="btn ghost" data-action="export-person-docx" data-id="${p.id}">Descargar en Word</button>
          <button class="btn ghost" data-action="print">Imprimir o guardar PDF</button>
          <a class="btn ghost" href="#/equipo">Volver</a></div>
      </div>
      ${pr < 0.999 ? `<div class="panel no-print"><strong>Perfil al ${pct(pr)}%.</strong> ${READONLY ? '' : `<a href="#/editar/${p.id}/${nextStep(p)}">Completar lo que falta</a>`}</div>` : ''}
      ${alerts.length ? `<ul class="insights" style="margin-bottom:1.25rem">${alerts.map(a => `<li class="alert">Es muy sensible a ${a.name.toLowerCase()} y hoy lo vive como amenaza. Conviene abordarlo pronto.</li>`).join('')}</ul>` : ''}
      <div class="grid-2">
        <section class="panel"><h2>Estilo DISC</h2>
          ${d ? `<p><span class="badge ${d.primary}" style="font-size:1.1rem">${d.label}</span>
              <strong>${DISC[d.primary].name}</strong>${d.secondary ? ` con rasgos ${DISC[d.secondary].name.toLowerCase()}s` : ''}${d.complete ? '' : ' <span class="muted small">(resultado parcial)</span>'}</p>
            ${DISC_LETTERS.map(L => `<div class="bar-row"><span>${L} ${DISC[L].name}</span><div class="bar-track"><div class="bar-fill ${L}" style="width:${d.scores[L] == null ? 0 : (d.scores[L] / 5) * 100}%"></div></div><span>${d.scores[L] == null ? '-' : d.scores[L].toFixed(1)}</span></div>`).join('')}
            <p class="small" style="margin-top:1rem"><strong>Cómo liderarla:</strong> ${esc(DISC[d.primary].tip)}</p>`
          : '<p class="muted">Responde la sección DISC para ver su estilo.</p>'}
        </section>
        <section class="panel"><h2>Perfil SCARF</h2>
          ${scarfVals.some(v => v != null) ? radar(scarfVals) : '<p class="muted">Responde la sección SCARF para ver su perfil.</p>'}
          <div class="small" style="margin-top:.8rem">${SCARF.filter(x => p.scarf[x.k].now).map(x => `<div>${x.name}: <strong>${nowLabel[p.scarf[x.k].now]}</strong>${p.scarf[x.k].note.trim() ? ` <span class="muted">(${esc(p.scarf[x.k].note.trim())})</span>` : ''}</div>`).join('')}</div>
        </section>
      </div>
      ${topScarf.length ? `<section class="panel"><h2>Qué le importa más y cómo apoyarla</h2><ul class="tip-list">${topScarf.map(x => `<li><strong>${x.name}.</strong> ${esc(x.tip)}</li>`).join('')}</ul></section>` : ''}
      <div class="grid-2">
        <section class="panel"><h2>Fortalezas</h2>${chips(p.strengths, 'good')}${quote(p.strengthNote)}
          <h3 style="margin-top:1.2rem">Áreas de desarrollo</h3>${chips(p.devs, 'dev')}${quote(p.devNote)}</section>
        <section class="panel"><h2>Tareas</h2><h3>Rinde mejor en</h3>${chips(p.bestTasks)}${quote(p.bestNote)}
          ${p.drainNote.trim() ? `<h3 style="margin-top:1.2rem">Le desgastan</h3>${quote(p.drainNote)}` : ''}
          <dl class="kv" style="margin-top:1rem">
            <dt>Estructura</dt><dd>${prefText(p.prefs.structure, 'Prefiere crear y la ambigüedad', 'Prefiere procesos definidos')}</dd>
            <dt>Interacción</dt><dd>${prefText(p.prefs.social, 'Trabaja mejor sola', 'Trabaja mejor en equipo')}</dd>
            <dt>Horizonte</dt><dd>${prefText(p.prefs.horizon, 'Corto plazo y ejecución', 'Largo plazo y estrategia')}</dd></dl></section>
      </div>
      ${state.customVars.length ? `<section class="panel"><h2>Variables propias</h2>${state.customVars.map(v => {
        const c = p.custom[v.id];
        if (!c || (c.score == null && !c.summary)) return `<p class="muted">${esc(v.name)}: sin responder todavía.</p>`;
        return `<div style="margin-bottom:1.2rem"><div class="bar-row" style="grid-template-columns:12rem 1fr 2.2rem"><strong>${esc(v.name)}</strong><div class="bar-track"><div class="bar-fill neutral" style="width:${c.score ? (c.score / 5) * 100 : 0}%"></div></div><span>${c.score ?? '-'}</span></div>
          ${c.summary ? `<p class="small" style="margin:.3rem 0">${esc(c.summary)}</p>` : ''}${c.tip ? `<p class="small muted" style="margin:0"><strong>Para ti:</strong> ${esc(c.tip)}</p>` : ''}
          ${c.chat && c.chat.length ? `<details class="qa"><summary>Ver preguntas y respuestas</summary>${c.chat.map(m => `<div class="bubble ${m.role === 'assistant' ? 'ai' : 'me'}"><span class="who">${m.role === 'assistant' ? 'IA' : 'Líder'}</span>${esc(m.text)}</div>`).join('')}</details>` : ''}</div>`;
      }).join('')}</section>` : ''}
      <section class="panel"><h2>Desempeño y gestión</h2>
        <dl class="kv">
          <dt>Habilidad</dt><dd>${p.skill ?? 'Sin responder'}${p.skill ? ' de 5' : ''}</dd>
          <dt>Motivación hoy</dt><dd>${p.will ?? 'Sin responder'}${p.will ? ' de 5' : ''}</dd>
          <dt>Potencial</dt><dd>${esc(p.potential || 'Sin responder')}</dd>
          <dt>Riesgo de fuga</dt><dd>${esc(p.retention ? p.retention[0].toUpperCase() + p.retention.slice(1) : 'Sin responder')}</dd>
          <dt>La motiva</dt><dd>${p.motivators.length ? esc(p.motivators.join(', ')) : 'Sin responder'}</dd>
          <dt>Feedback</dt><dd>${esc(p.feedback || 'Sin responder')}</dd>
          <dt>Próximos 30 días</dt><dd>${p.action.trim() ? esc(p.action) : 'Sin responder'}</dd>
        </dl></section>
      <p class="footnote">Este mapa refleja tu percepción como líder. No es un test psicométrico ni debe usarse para evaluar formalmente a nadie.</p>`;
  }

  /* ----- Mapa del equipo ----- */
  const mapTabs = active => `<nav class="subtabs" aria-label="Vistas del mapa">
    <a href="#/mapa" class="${active === 'mapa' ? 'active' : ''}">Análisis</a>
    <a href="#/sistema" class="${active === 'sistema' ? 'active' : ''}">Sistema solar</a></nav>`;
  const sect = (title, text, inner) => `<section class="panel"><h2>${title}</h2><p class="sect-desc">${text}</p>${inner}</section>`;
  const chipLinks = (list, cls) => list.map(p => `<a class="chip ${cls || ''}" href="#/persona/${p.id}">${esc(p.name)}</a>`).join('');

  function viewMap() {
    const ppl = state.people;
    if (ppl.length < 2) {
      return `<div class="page-head"><h1>Mapa del equipo</h1></div>${mapTabs('mapa')}
        <div class="panel empty"><h2>Aún no hay suficiente para armar el mapa</h2><p>Agrega al menos dos personas y completa algunas secciones de cada una.</p>
        <a class="btn" href="#/equipo">Ir a Mi equipo</a></div>`;
    }

    // SCARF
    const heatRows = ppl.map(p => `<tr><td><a href="#/persona/${p.id}">${esc(p.name)}</a></td>${SCARF.map(d => {
      const v = p.scarf[d.k];
      if (v.s == null) return '<td class="cell empty-cell">-</td>';
      const mark = v.now === 'threat' ? '<span class="mark" title="Hoy lo vive como amenaza">▼</span>' : v.now === 'reward' ? '<span class="mark" title="Hoy lo vive como recompensa">▲</span>' : '';
      return `<td class="cell" style="background:rgba(122,74,46,${(0.12 + 0.17 * v.s).toFixed(2)});color:${v.s >= 4 ? '#fff' : '#2b1b14'}">${v.s}${mark}</td>`;
    }).join('')}</tr>`).join('');
    const avgRow = SCARF.map(d => { const a = avg(ppl.map(p => p.scarf[d.k].s).filter(v => v != null)); return `<td class="cell">${a == null ? '-' : a.toFixed(1)}</td>`; }).join('');
    const scarfHtml = `<div class="scroll-x"><table class="heat"><thead><tr><th>Persona</th>${SCARF.map(d => `<th>${d.name}</th>`).join('')}</tr></thead><tbody>${heatRows}</tbody>
      <tfoot><tr><td>Promedio</td>${avgRow}</tr></tfoot></table></div>
      <div class="legend"><span>▼ Hoy lo vive como amenaza</span><span>▲ Hoy lo vive como recompensa</span></div>`;

    // Variables propias
    const hasCustom = state.customVars.length && ppl.some(p => state.customVars.some(v => p.custom[v.id] && p.custom[v.id].score != null));
    const customHtml = hasCustom ? `<div class="scroll-x"><table class="heat"><thead><tr><th>Persona</th>${state.customVars.map(v => `<th>${esc(v.name)}</th>`).join('')}</tr></thead><tbody>${ppl.map(p => `<tr><td><a href="#/persona/${p.id}">${esc(p.name)}</a></td>${state.customVars.map(v => {
      const sc = p.custom[v.id] && p.custom[v.id].score;
      return sc == null ? '<td class="cell empty-cell">-</td>' : `<td class="cell" style="background:rgba(78,122,58,${(0.12 + 0.17 * sc).toFixed(2)});color:${sc >= 4 ? '#fff' : '#2b1b14'}">${sc}</td>`;
    }).join('')}</tr>`).join('')}</tbody>
      <tfoot><tr><td>Promedio</td>${state.customVars.map(v => { const a = avg(ppl.map(p => p.custom[v.id] && p.custom[v.id].score).filter(x => x != null)); return `<td class="cell">${a == null ? '-' : a.toFixed(1)}</td>`; }).join('')}</tr></tfoot></table></div>` : '';

    // DISC
    const discs = ppl.map(p => ({ p, d: discOf(p) }));
    const discTotal = discs.filter(x => x.d).length || 1;
    const discHtml = DISC_LETTERS.map(L => {
      const who = discs.filter(x => x.d && x.d.primary === L).map(x => x.p);
      return `<div class="dist-row"><div class="bar-row"><span>${L} ${DISC[L].name}</span><div class="bar-track"><div class="bar-fill ${L}" style="width:${(who.length / discTotal) * 100}%"></div></div><span>${who.length}</span></div>
        <div class="chips">${chipLinks(who)}</div></div>`;
    }).join('');
    const noDisc = discs.filter(x => !x.d).length;

    // Habilidad y motivación
    const boxLabels = [
      ['Promesa', 'Alto impulso', 'Estrella'],
      ['En desarrollo', 'Núcleo del equipo', 'Experto estable'],
      ['Requiere decisión', 'Reconectar', 'Experto desmotivado']
    ];
    let nine = '<div class="nb-axis y">Motivación</div>';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const wb = 2 - r;
        const who = ppl.filter(p => bucket(p.skill) === c && bucket(p.will) === wb);
        const cls = c === 2 && wb === 2 ? 'hi' : c === 0 && wb === 0 ? 'lo' : '';
        nine += `<div class="nb-cell ${cls}"><b>${boxLabels[r][c]}</b><div class="chips">${chipLinks(who)}</div></div>`;
      }
    }
    nine += '<div class="nb-axis x">Habilidad en el rol actual</div>';

    // Fortalezas y desarrollo, con las personas bajo cada una
    const whoBy = key => {
      const m = new Map();
      ppl.forEach(p => p[key].forEach(x => { if (!m.has(x)) m.set(x, []); m.get(x).push(p); }));
      return [...m.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'es'));
    };
    const freqList = (list, cls, fill) => list.length ? list.map(([name, who]) => `<div class="freq">
        <div class="bar-row wide"><span>${esc(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${(who.length / ppl.length) * 100}%;background:${fill}"></div></div><span>${who.length}</span></div>
        <div class="chips">${chipLinks(who, cls)}</div></div>`).join('') : '<p class="muted small">Sin información todavía.</p>';

    // Tareas
    const taskSet = [...new Set([...TAREAS, ...ppl.flatMap(p => p.bestTasks)])];
    const anyTasks = ppl.some(p => p.bestTasks.length);
    const cover = taskSet.map(t => {
      const who = ppl.filter(p => p.bestTasks.includes(t));
      return `<div class="cov-row"><span>${esc(t)}</span>${who.length ? `<div class="chips">${chipLinks(who, 'good')}</div>` : '<span class="gap-flag">Sin cobertura</span>'}</div>`;
    }).join('');

    const ins = insights();
    return `<div class="page-head"><div><h1>Mapa del equipo</h1><p>Una vista conjunta de ${ppl.length} personas. Se actualiza a medida que completas los perfiles.</p></div>
        <button class="btn ghost" data-action="print">Imprimir o guardar PDF</button></div>
      ${mapTabs('mapa')}
      ${ins.length ? sect('Lo que más llama la atención', 'Alertas y patrones que se detectan automáticamente al cruzar los datos de todo el equipo.',
        `<ul class="insights">${ins.map(i => `<li class="${i.t === 'alert' ? 'alert' : i.t === 'warn' ? 'warn' : ''}">${esc(i.x)}</li>`).join('')}</ul>`) : ''}
      ${sect('SCARF del equipo', 'SCARF son cinco necesidades sociales: Estatus, Certidumbre, Autonomía, Conexión y Justicia. Cuando una se siente amenazada, la persona reacciona a la defensiva. Aquí ves cuánto le importa cada una a cada persona, de 1 a 5.', scarfHtml)}
      ${hasCustom ? sect('Variables propias', 'Las variables que creaste tú, comparadas entre las personas de tu equipo (de 1 a 5).', customHtml) : ''}
      <div class="grid-2">
        ${sect('Estilos DISC', 'DISC clasifica el estilo de comportamiento en cuatro tipos: Dominante, Influyente, Estable y Concienzudo. Aquí ves cómo se reparte tu equipo según el estilo que más predomina en cada persona.',
          discHtml + (noDisc ? `<p class="muted small">${noDisc} ${noDisc === 1 ? 'persona aún no tiene' : 'personas aún no tienen'} DISC.</p>` : ''))}
        ${sect('Habilidad y motivación', 'Cruza qué tan bien desempeña cada persona su rol con qué tan motivada está hoy. Sirve para decidir a quién potenciar, desarrollar o reconectar.', `<div class="ninebox">${nine}</div>`)}
      </div>
      <div class="grid-2">
        ${sect('Fortalezas más frecuentes', 'Las competencias que más se repiten en tu equipo y quiénes las tienen. Te muestran en qué puedes apoyarte.', freqList(whoBy('strengths'), 'good', 'var(--leaf)'))}
        ${sect('Áreas de desarrollo más frecuentes', 'Las áreas donde más personas necesitan apoyo y quiénes son. Sirven para decidir capacitaciones o apoyos colectivos.', freqList(whoBy('devs'), 'dev', 'var(--warn)'))}
      </div>
      ${sect('Quién destaca en qué tareas', 'Muestra quién rinde mejor en cada tipo de tarea. Te ayuda a repartir el trabajo y a detectar tareas que nadie cubre hoy.',
        anyTasks ? cover : '<p class="muted">Completa la sección Tareas de cada persona para ver la cobertura del equipo.</p>')}`;
  }

  /* ----- Sistema solar ----- */
  // Colores pensados para distinguirse entre sí (incluso con daltonismo) y, además, cada planeta lleva su letra.
  const DISC_COLORS = { D: '#e4572e', I: '#f2b705', S: '#2fa36b', C: '#3d7be0', none: '#8d8d8d' };
  const DISC_INK = { D: '#ffffff', I: '#1d120d', S: '#ffffff', C: '#ffffff', none: '#ffffff' };
  const SYS_FONT = 'Instrument Sans, Arial, Helvetica, sans-serif';
  const hasAlert = p => scarfAlerts(p).length > 0 || p.retention === 'alto';

  function sysCard(p) {
    const d = discOf(p); const key = d ? d.primary : 'none';
    const top = SCARF.filter(x => p.scarf[x.k].s >= 4).sort((a, b) => p.scarf[b.k].s - p.scarf[a.k].s).slice(0, 2);
    const alerts = [...scarfAlerts(p).map(x => `Vive como amenaza: ${x.name.toLowerCase()}`), ...(p.retention === 'alto' ? ['Riesgo de fuga alto'] : [])];
    return `<div class="tip-head"><span class="tip-avatar" style="background:${DISC_COLORS[key]};color:${DISC_INK[key]}">${d ? d.primary : '?'}</span>
        <div><strong>${esc(p.name)}</strong><br><span class="muted small">${esc(p.role || 'Sin cargo definido')}</span></div></div>
      <dl class="kv tip-kv">
        <dt>Estilo DISC</dt><dd>${d ? `${d.label}, ${DISC[d.primary].name}` : 'Sin responder'}</dd>
        <dt>Habilidad</dt><dd>${p.skill ?? '-'} de 5</dd>
        <dt>Motivación</dt><dd>${p.will ?? '-'} de 5</dd>
        <dt>Le importa más</dt><dd>${top.length ? esc(top.map(x => x.name).join(', ')) : 'Sin información'}</dd>
        <dt>Fortalezas</dt><dd>${p.strengths.length ? esc(p.strengths.slice(0, 4).join(', ')) : 'Sin información'}</dd>
        <dt>Alertas</dt><dd>${alerts.length ? esc(alerts.join('. ')) : 'Ninguna por ahora'}</dd></dl>
      <a class="tip-link" href="#/persona/${p.id}">Ver perfil completo</a>`;
  }

  function viewSystem() {
    const ppl = state.people;
    const head = `<div class="page-head"><div><h1>Sistema solar del equipo</h1>
      <p>Tú eres el sol y cada persona es un planeta con su propia órbita. Mientras más cerca del centro, más motivada está hoy. El tamaño muestra su habilidad en el rol, y el color con su letra, su estilo DISC.</p></div>
      <button class="btn ghost" data-action="print">Imprimir o guardar PDF</button></div>${mapTabs('sistema')}`;
    if (!ppl.length) {
      return `${head}<div class="panel empty"><h2>Todavía no hay planetas</h2><p>Agrega personas a tu equipo y completa su motivación y habilidad para verlas aquí.</p><a class="btn" href="#/equipo">Ir a Mi equipo</a></div>`;
    }

    const narrow = !!(window.matchMedia && window.matchMedia('(max-width: 700px)').matches);
    const CX = 400, CY = 400, RMAX = narrow ? 330 : 365;
    const fs = narrow ? 20 : 14;
    const sorted = [...ppl].sort((a, b) => (b.will ?? -1) - (a.will ?? -1));
    const n = sorted.length;
    const base = n > 1 ? 125 : 220;
    const step = n > 1 ? Math.min(85, (RMAX - base) / (n - 1)) : 0;
    const scale = n > 12 ? 0.75 : n > 8 ? 0.88 : 1;

    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const stars = Array.from({ length: 80 }, () => `<circle cx="${(rnd() * 1000 - 100).toFixed(0)}" cy="${(rnd() * 800).toFixed(0)}" r="${(0.4 + rnd() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.2 + rnd() * 0.45).toFixed(2)}"/>`).join('');
    const rings = sorted.map((p, i) => `<circle cx="${CX}" cy="${CY}" r="${(base + i * step).toFixed(1)}" fill="none" stroke="#f3e3c9" stroke-opacity=".2" stroke-dasharray="3 6"/>`).join('');

    const planets = sorted.map((p, i) => {
      const r = base + i * step;
      const th = ((-90 + i * 137.5) * Math.PI) / 180;
      const x = CX + r * Math.cos(th); const y = CY + r * Math.sin(th);
      const d = discOf(p); const key = d ? d.primary : 'none';
      let pr = (9 + (p.skill || 2.5) * 2.6) * scale * (narrow ? 1.35 : 1);
      if (narrow && n > 1) pr = Math.min(pr, Math.max(12, step * 0.5));
      pr = Math.max(12, pr);
      const left = x > 640;
      const lx = (left ? -1 : 1) * (pr + 9);
      const anchor = left ? 'end' : 'start';
      const shown = narrow ? p.name.trim().split(/\s+/)[0] : p.name;
      const label = esc(shown.length > (narrow ? 11 : 20) ? shown.slice(0, narrow ? 10 : 19) + '…' : shown);
      const badge = hasAlert(p) ? `<g pointer-events="none"><circle cx="${(pr * 0.8).toFixed(1)}" cy="${(-pr * 0.8).toFixed(1)}" r="8.5" fill="#d7263d" stroke="#fff" stroke-width="1.8"/>
          <text x="${(pr * 0.8).toFixed(1)}" y="${(-pr * 0.8 + 4.5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="${SYS_FONT}">!</text></g>` : '';
      return `<g class="planet" data-planet="${p.id}" tabindex="0" role="link" aria-label="${esc(p.name)}, ver resumen y perfil" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <circle r="${(pr + 8).toFixed(1)}" fill="transparent"/>
        <circle class="planet-body" r="${pr.toFixed(1)}" fill="${DISC_COLORS[key]}" stroke="#fff" stroke-width="2"/>
        <text text-anchor="middle" y="${(pr * 0.34).toFixed(1)}" font-size="${(pr * 0.95).toFixed(1)}" font-weight="700" fill="${DISC_INK[key]}" font-family="${SYS_FONT}" pointer-events="none">${d ? d.primary : '?'}</text>
        ${badge}
        <text x="${lx.toFixed(1)}" y="5" text-anchor="${anchor}" font-size="${fs}" fill="#1d120d" stroke="#1d120d" stroke-width="4.5" stroke-linejoin="round" font-family="${SYS_FONT}" pointer-events="none">${label}</text>
        <text x="${lx.toFixed(1)}" y="5" text-anchor="${anchor}" font-size="${fs}" fill="#f6ede1" font-family="${SYS_FONT}" pointer-events="none">${label}</text>
      </g>`;
    }).join('');

    const sunTop = esc((state.leader.name || 'Tú').split(/\s+/)[0].slice(0, 12));
    const sunBottom = esc((state.leader.team || state.leader.company || '').slice(0, 16));
    const svg = `<svg id="sys-svg" class="system" viewBox="-100 0 1000 800" role="group" aria-label="Sistema solar del equipo: cada planeta es una persona">
      <defs><radialGradient id="sunGrad" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="#ffe3b0"/><stop offset=".55" stop-color="#d9a05f"/><stop offset="1" stop-color="#8a5532"/></radialGradient>
        <radialGradient id="sunGlow"><stop offset="0" stop-color="#e9b873" stop-opacity=".5"/><stop offset="1" stop-color="#e9b873" stop-opacity="0"/></radialGradient></defs>
      <rect x="-100" width="1000" height="800" fill="#1d120d"/>${stars}
      <circle cx="${CX}" cy="${CY}" r="115" fill="url(#sunGlow)"/>${rings}
      <circle cx="${CX}" cy="${CY}" r="56" fill="url(#sunGrad)"/>
      <text x="${CX}" y="${CY - 1}" text-anchor="middle" font-size="17" font-weight="700" fill="#2b1b14" font-family="${SYS_FONT}">${sunTop}</text>
      <text x="${CX}" y="${CY + 17}" text-anchor="middle" font-size="11" fill="#3e2619" font-family="${SYS_FONT}">${sunBottom}</text>
      ${planets}</svg>`;

    const lg = L => `<span class="lg-item"><span class="lg-dot" style="background:${DISC_COLORS[L]};color:${DISC_INK[L]}">${L === 'none' ? '?' : L}</span>${L === 'none' ? 'Sin DISC' : DISC[L].name}</span>`;
    return `${head}
      <div class="space-wrap"><div class="space">${svg}</div><div class="sys-tip" id="sys-tip" hidden role="status"></div></div>
      <div class="sys-controls no-print"><span class="muted small">Pasa el cursor sobre un planeta (o tócalo en el celular) para ver su resumen. Haz clic para abrir su perfil.</span>
        <button class="btn small" data-action="sys-png">Descargar imagen (PNG)</button></div>
      <div class="sys-legend">
        <div><strong>Color y letra: estilo DISC</strong><div class="lg-row">${['D', 'I', 'S', 'C', 'none'].map(lg).join('')}</div></div>
        <div><strong>Distancia al sol</strong>Más cerca significa más motivación hoy.</div>
        <div><strong>Tamaño</strong>Más grande significa más habilidad en su rol.</div>
        <div><strong><span class="lg-badge">!</span> Alerta</strong>Vive como amenaza algo a lo que es muy sensible, o tiene riesgo de fuga alto.</div>
      </div>`;
  }

  // Descarga el sistema solar como imagen PNG, con leyenda incluida.
  function downloadSystemPng() {
    const svg = $('#sys-svg'); if (!svg) return;
    const W = 2000, VH = 900;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('viewBox', `-100 0 1000 ${VH}`);
    clone.setAttribute('width', W); clone.setAttribute('height', Math.round(W * VH / 1000));
    const t = (x, y, size, fill, txt, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="${SYS_FONT}" ${extra}>${esc(txt)}</text>`;
    const items = ['D', 'I', 'S', 'C', 'none'].map((L, i) => {
      const x = -60 + i * 185;
      return `<circle cx="${x}" cy="838" r="13" fill="${DISC_COLORS[L]}"/>${t(x, 843.5, 14, DISC_INK[L], L === 'none' ? '?' : L, 'text-anchor="middle" font-weight="700"')}${t(x + 20, 843, 15, '#f6ede1', L === 'none' ? 'Sin DISC' : DISC[L].name)}`;
    }).join('');
    const company = [state.leader.company, state.leader.team].filter(Boolean).join(' - ');
    clone.insertAdjacentHTML('beforeend',
      `<rect x="-100" y="800" width="1000" height="${VH - 800}" fill="#1d120d"/>${items}
       ${t(-60, 876, 14, '#d9c9b4', 'Más cerca del sol: más motivación. Más grande: más habilidad en su rol. ! : alerta (amenaza SCARF o riesgo de fuga alto).')}
       ${t(-70, 34, 18, '#f6ede1', company, 'font-weight="700"')}${t(890, 34, 14, '#d9c9b4', new Date().toLocaleDateString('es-CL'), 'text-anchor="end"')}`);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W; c.height = Math.round(W * VH / 1000);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => {
        if (!b) { toast('No se pudo generar la imagen.'); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `sistema-solar-${stamp()}.png`;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('No se pudo generar la imagen.'); };
    img.src = url;
  }

  // Tarjeta que se despliega al pasar el cursor (o tocar) un planeta.
  let tipTimer = null; let tipFor = null; let tipPinned = null;
  function showTip(planetEl) {
    const wrap = $('.space-wrap'); const tip = $('#sys-tip'); if (!wrap || !tip) return;
    const p = person(planetEl.dataset.planet); if (!p) return;
    clearTimeout(tipTimer); tipFor = p.id;
    tip.innerHTML = sysCard(p); tip.hidden = false;
    if (window.matchMedia && window.matchMedia('(max-width: 700px)').matches) return; // en celular la tarjeta queda debajo de la imagen
    const w = wrap.getBoundingClientRect(); const r = planetEl.querySelector('.planet-body').getBoundingClientRect();
    const tw = tip.offsetWidth; const th = tip.offsetHeight;
    let x = r.right - w.left + 12; let y = r.top - w.top + r.height / 2 - th / 2;
    if (x + tw > w.width - 8) x = r.left - w.left - tw - 12;
    if (x < 8) { // pantalla angosta: centrada, arriba o abajo del planeta
      x = Math.max(8, Math.min(w.width - tw - 8, r.left - w.left + r.width / 2 - tw / 2));
      y = (r.top - w.top > th + 16) ? r.top - w.top - th - 10 : r.bottom - w.top + 10;
    }
    y = Math.max(8, Math.min(w.height - th - 8, y));
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip(delay = 200) {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { const t = $('#sys-tip'); if (t) t.hidden = true; tipFor = null; tipPinned = null; }, delay);
  }

  /* ----- Respaldo ----- */
  function syncStatusText() {
    const last = state.sync.last ? new Date(state.sync.last).toLocaleString('es-CL') : 'aún no se ha enviado';
    return `Último envío: ${last}.${state.sync.error ? ' Último error: ' + state.sync.error : ''}`;
  }

  function syncSection() {
    if (!syncCfg.enabled) return '';
    const what = syncCfg.level === 'full'
      ? 'Se envía una copia completa de lo que has ingresado: las personas de tu equipo, todas tus respuestas, tus notas y tus conversaciones con la IA. Administración puede ver esos resultados.'
      : 'Se envía solo un registro de actividad: cuántas personas has mapeado y qué tan completos están sus perfiles. No se envían nombres ni respuestas.';
    return sect('Registro con administración', 'Tu administración puede recibir un registro de lo que trabajas en esta herramienta.',
      `<p>${what}</p>
      ${syncCfg.required
        ? '<p><strong>Este envío es automático y obligatorio.</strong> Se actualiza cada vez que haces cambios.</p>'
        : `<label class="check"><input type="checkbox" data-opt="sync.optIn" ${state.sync.optIn ? 'checked' : ''}> Enviar automáticamente una copia cada vez que haga cambios</label>`}
      <p class="small muted" id="sync-status">${esc(syncStatusText())}</p>
      <button class="btn ghost" data-action="sync-now">Enviar ahora</button>`);
  }

  function viewData() {
    return `<div class="page-head"><div><h1>Respaldo y datos</h1><p>Tu información vive en este navegador. Si cambias de computador, borras el historial o usas otro navegador, no la verás. Descarga un respaldo para llevarla contigo.</p></div></div>
      <section class="panel"><h2>Descargar</h2>
        <p class="sect-desc">Elige según lo que necesites: para leer o compartir, el informe en Word; para volver a cargar tus datos en otro navegador, el respaldo.</p>
        <div class="btn-row"><button class="btn" data-action="export-docx">Informe del equipo (Word)</button>
        <button class="btn ghost" data-action="export-csv">Resumen para Excel (CSV)</button>
        <button class="btn ghost" data-action="export-json">Respaldo para restaurar (JSON)</button></div>
        <p class="small muted" style="margin-top:.8rem">El respaldo JSON no está pensado para leerse: es el formato que la app usa para restaurar tus datos. Sirve solo con la opción "Restaurar un respaldo".</p></section>
      <section class="panel"><h2>Restaurar un respaldo</h2>
        <p class="muted">Esto reemplaza los datos que tengas ahora en este navegador.</p>
        <input type="file" id="import-file" accept="application/json,.json" aria-label="Archivo de respaldo"></section>
      ${syncSection()}
      <section class="panel"><h2>Tus datos</h2>
        <form id="leader-form">
          <div class="grid-2"><div class="field"><label for="l-name">Tu nombre</label><input type="text" id="l-name" value="${esc(state.leader.name)}" required></div>
          <div class="field"><label for="l-email">Tu correo <span class="hint">Opcional. Sirve para que administración sepa quién eres.</span></label><input type="text" id="l-email" value="${esc(state.leader.email || '')}" autocomplete="email"></div></div>
          <div class="field"><label for="l-company">Empresa</label><input type="text" id="l-company" value="${esc(state.leader.company || '')}" required maxlength="120"></div>
          <div class="field"><label for="l-team">Nombre del equipo</label><input type="text" id="l-team" value="${esc(state.leader.team || '')}"></div>
          <button class="btn" type="submit">Guardar</button></form></section>
      <section class="panel"><h2>Salir y borrar mi mapa</h2><p class="muted">Elimina a todas las personas y tus datos de este navegador y te lleva al inicio. No se puede deshacer.</p>
        <button class="btn danger" data-action="wipe">Salir y borrar mi mapa</button></section>`;
  }

  /* =====================================================================
     Exportar / importar
     ===================================================================== */
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  function toCsv() {
    const head = ['Nombre', 'Cargo', 'Tiempo', 'DISC', 'D', 'I', 'S', 'C',
      ...SCARF.map(d => 'SCARF ' + d.name), ...SCARF.map(d => 'Hoy ' + d.name),
      'Fortalezas', 'Desarrollo', 'Tareas fuertes', 'Habilidad', 'Motivacion', 'Potencial', 'Riesgo de fuga', 'Motivadores', 'Feedback', 'Accion 30 dias',
      ...state.customVars.flatMap(v => ['Var: ' + v.name, 'Lectura: ' + v.name])];
    const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = state.people.map(p => {
      const d = discOf(p);
      return [p.name, p.role, p.tenure, d ? d.label : '', ...DISC_LETTERS.map(L => (d && d.scores[L] != null ? d.scores[L].toFixed(1) : '')),
        ...SCARF.map(x => p.scarf[x.k].s ?? ''), ...SCARF.map(x => p.scarf[x.k].now ?? ''),
        p.strengths.join(', '), p.devs.join(', '), p.bestTasks.join(', '), p.skill ?? '', p.will ?? '', p.potential, p.retention ?? '',
        p.motivators.join(', '), p.feedback, p.action,
        ...state.customVars.flatMap(v => [(p.custom[v.id] && p.custom[v.id].score) ?? '', (p.custom[v.id] && p.custom[v.id].summary) || ''])].map(cell).join(';');
    });
    return '\ufeff' + [head.map(cell).join(';'), ...rows].join('\r\n');
  }

  /* =====================================================================
     Informe en Word (.docx), generado en el navegador sin librerías externas
     ===================================================================== */
  const xmlEsc = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wRun = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}${o.size ? `<w:sz w:val="${o.size}"/>` : ''}</w:rPr><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r>`;
  const wPara = (inner, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ''}${o.keepNext ? '<w:keepNext/>' : ''}${o.after != null ? `<w:spacing w:after="${o.after}"/>` : ''}${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : ''}</w:pPr>${inner}</w:p>`;
  const wH = (t, lvl) => wPara(wRun(t), { style: 'Heading' + lvl, keepNext: true });
  const wKv = (label, value) => {
    const has = value != null && String(value).trim() !== '';
    return wPara(wRun(label + ': ', { b: true }) + wRun(has ? value : 'Sin responder', has ? {} : { color: '888888', i: true }), { after: 80 });
  };
  const wBullet = t => wPara(wRun('•  ') + wRun(t), { ind: 360, hang: 220, after: 40 });
  const wBreak = () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const wTable = (rows, widths) => `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${
    rows.map((r, ri) => `<w:tr>${r.map((c, ci) => `<w:tc><w:tcPr><w:tcW w:w="${widths[ci]}" w:type="dxa"/>${ri === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="EBE5DA"/>' : ''}</w:tcPr>${wPara(wRun(c, ri === 0 ? { b: true } : {}), { after: 0 })}</w:tc>`).join('')}</w:tr>`).join('')
  }</w:tbl>${wPara('', { after: 120 })}`;

  const DOCX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-CL"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:b/><w:color w:val="2B1B14"/><w:sz w:val="48"/><w:szCs w:val="48"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="2B1B14"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="7A4A2E"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:left w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:right w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`;

  const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  // Un .docx es un zip de archivos XML. Este zip mínimo guarda sin comprimir, lo que Word acepta sin problema.
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

  const NOW = { threat: 'Amenaza', neutral: 'Neutro', reward: 'Recompensa' };

  function personXml(p) {
    const out = [];
    const d = discOf(p);
    const list = a => (a.length ? a.join(', ') : '');
    out.push(wH(`${p.name}${p.role ? ', ' + p.role : ''}`, 1));
    if (p.tenure) out.push(wKv('Tiempo trabajando con el líder', p.tenure));
    out.push(wKv('Estilo DISC', d ? `${d.label}, ${DISC[d.primary].name}${d.complete ? '' : ' (resultado parcial)'}. Puntajes: ${DISC_LETTERS.filter(L => d.scores[L] != null).map(L => `${L} ${d.scores[L].toFixed(1)}`).join(', ')}` : ''));
    if (d) out.push(wKv('Cómo liderarla', DISC[d.primary].tip));
    out.push(wH('SCARF', 2));
    out.push(wTable([['Necesidad', 'Importancia (1 a 5)', 'Hoy lo vive como'], ...SCARF.map(x => [x.name, p.scarf[x.k].s ?? 'Sin responder', NOW[p.scarf[x.k].now] || 'Sin responder'])], [3600, 3186, 3186]));
    SCARF.filter(x => p.scarf[x.k].note.trim()).forEach(x => out.push(wKv(`Observación sobre ${x.name.toLowerCase()}`, p.scarf[x.k].note.trim())));
    out.push(wH('Fortalezas y desarrollo', 2));
    out.push(wKv('Fortalezas', list(p.strengths))); if (p.strengthNote.trim()) out.push(wKv('Situación en la que brilló', p.strengthNote.trim()));
    out.push(wKv('Áreas de desarrollo', list(p.devs))); if (p.devNote.trim()) out.push(wKv('Cuándo se traba o necesita apoyo', p.devNote.trim()));
    out.push(wH('Tareas y forma de trabajar', 2));
    out.push(wKv('Rinde mejor en', list(p.bestTasks))); if (p.bestNote.trim()) out.push(wKv('Qué hace mejor que nadie', p.bestNote.trim()));
    if (p.drainNote.trim()) out.push(wKv('Tareas que le desgastan', p.drainNote.trim()));
    out.push(wKv('Estructura', prefText(p.prefs.structure, 'Prefiere crear y la ambigüedad', 'Prefiere procesos definidos').replace('Sin responder', '')));
    out.push(wKv('Interacción', prefText(p.prefs.social, 'Trabaja mejor sola', 'Trabaja mejor en equipo').replace('Sin responder', '')));
    out.push(wKv('Horizonte', prefText(p.prefs.horizon, 'Corto plazo y ejecución', 'Largo plazo y estrategia').replace('Sin responder', '')));
    out.push(wH('Desempeño y gestión', 2));
    out.push(wKv('Habilidad en su rol', p.skill ? `${p.skill} de 5` : ''));
    out.push(wKv('Motivación hoy', p.will ? `${p.will} de 5` : ''));
    out.push(wKv('Potencial', p.potential));
    out.push(wKv('Riesgo de fuga', p.retention ? p.retention[0].toUpperCase() + p.retention.slice(1) : ''));
    out.push(wKv('Qué la motiva', list(p.motivators)));
    out.push(wKv('Feedback preferido', p.feedback));
    out.push(wKv('Qué hará el líder en los próximos 30 días', p.action.trim()));
    const cv = state.customVars.filter(v => p.custom[v.id] && (p.custom[v.id].score != null || p.custom[v.id].summary));
    if (cv.length) {
      out.push(wH('Variables propias', 2));
      cv.forEach(v => {
        const c = p.custom[v.id];
        out.push(wKv(v.name, `${c.score != null ? c.score + ' de 5. ' : ''}${c.summary || ''}`.trim()));
        if (c.tip) out.push(wKv('Recomendación', c.tip));
        (c.chat || []).forEach(m => out.push(wPara(wRun(m.role === 'assistant' ? 'Pregunta: ' : 'Respuesta del líder: ', { b: true, size: 20 }) + wRun(m.text, { size: 20, i: m.role === 'assistant' }), { ind: 360, after: 40 })));
      });
    }
    return out.join('');
  }

  function reportBody(people, team) {
    const out = [];
    const l = state.leader;
    out.push(wPara(wRun(team ? 'Informe del equipo' : people[0].name), { style: 'Title' }));
    out.push(wKv('Empresa y equipo', [l.company, l.team].filter(Boolean).join(', ')));
    out.push(wKv('Líder', l.name));
    out.push(wKv('Fecha', new Date().toLocaleDateString('es-CL')));
    if (team) {
      const ppl = state.people;
      out.push(wKv('Personas mapeadas', String(ppl.length)));
      out.push(wKv('Avance promedio de los perfiles', `${pct(avg(ppl.map(progress)))}%`));
      const ins = insights();
      if (ins.length) { out.push(wH('Lo que más llama la atención', 1)); ins.forEach(i => out.push(wBullet(i.x))); }
      out.push(wH('Estilos DISC del equipo', 1));
      DISC_LETTERS.forEach(L => out.push(wKv(`${L} ${DISC[L].name}`, ppl.filter(p => { const d = discOf(p); return d && d.primary === L; }).map(p => p.name).join(', ') || 'Nadie')));
      [['Fortalezas más frecuentes', 'strengths'], ['Áreas de desarrollo más frecuentes', 'devs']].forEach(([title, key]) => {
        const m = new Map(); ppl.forEach(p => p[key].forEach(x => m.set(x, [...(m.get(x) || []), p.name])));
        const rows = [...m.entries()].sort((a, b) => b[1].length - a[1].length);
        if (rows.length) { out.push(wH(title, 1)); rows.forEach(([n, who]) => out.push(wBullet(`${n} (${who.length}): ${who.join(', ')}`))); }
      });
    }
    people.forEach((p, i) => { if (team || i > 0) out.push(wBreak()); out.push(personXml(p)); });
    out.push(wPara(wRun('Este informe refleja la percepción del líder. No es un test psicométrico validado ni debe usarse para evaluar formalmente, contratar, sancionar o despedir.', { i: true, size: 18, color: '666666' }), { after: 0 }));
    return out.join('');
  }

  function downloadReport(personId) {
    const people = personId ? [person(personId)].filter(Boolean) : state.people;
    if (!people.length) { toast('Todavía no hay personas para el informe.'); return; }
    const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const files = [
      { name: '[Content_Types].xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
      { name: '_rels/.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
      { name: 'word/_rels/document.xml.rels', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'word/styles.xml', text: DOCX_STYLES },
      { name: 'word/document.xml', text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${NS}"><w:body>${reportBody(people, !personId)}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>` }
    ];
    const blob = makeZip(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const slug = people[0].name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'persona';
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = personId ? `perfil-${slug}-${stamp()}.docx` : `informe-equipo-${stamp()}.docx`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Informe descargado.');
  }

  /* =====================================================================
     Servicios en la nube: llamadas a la API, registro con administración y asesor IA
     ===================================================================== */
  const getCode = () => { try { return localStorage.getItem(CODE_KEY) || ''; } catch (e) { return ''; } };
  const setCode = c => { try { localStorage.setItem(CODE_KEY, c); } catch (e) { /* ignorar */ } };

  // Mensaje útil cuando el servidor no responde con el JSON esperado (por ejemplo, una página de error de Vercel).
  function httpErrorMessage(status) {
    if (status === 404) return 'No se encontró la función en el servidor (error 404). Avisa a quien administra la app: deben estar las carpetas api y lib en el repositorio, y volver a desplegar.';
    if (status === 504 || status === 408) return `La IA tardó demasiado en responder (error ${status}). Intenta de nuevo con una pregunta más corta.`;
    if (status >= 500) return `La función falló en el servidor (error ${status}). Avisa a quien administra la app: puede ver el detalle en Vercel, en Logs.`;
    return `El servicio respondió con un error (${status}).`;
  }

  async function apiPost(url, payload, opts = {}, retried = false) {
    let res;
    const reqBody = JSON.stringify(payload);
    try { res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Code': getCode() }, body: reqBody, keepalive: !!opts.keepalive && reqBody.length < 60000 }); }
    catch (e) { throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'); }
    let data = null; try { data = await res.json(); } catch (e) { /* ignorar */ }
    if (res.status === 401 && opts.interactive && !retried) {
      const entered = window.prompt('Ingresa el código de acceso. Te lo entrega quien administra la app.');
      if (entered && entered.trim()) { setCode(entered.trim()); return apiPost(url, payload, opts, true); }
      throw new Error('Se necesita el código de acceso.');
    }
    if (res.status === 401) throw new Error('Falta el código de acceso. Envía una copia manualmente para ingresarlo.');
    if (!res.ok || !data) throw new Error((data && data.message) || httpErrorMessage(res.status));
    return data;
  }

  /* ----- Registro con administración ----- */
  let syncCfg = { enabled: false, level: 'activity', required: false, needsCode: false };
  let syncTimer = null;
  const syncActive = () => !READONLY && syncCfg.enabled && !!state.leader && (syncCfg.required || state.sync.optIn);

  function persist() {
    if (READONLY) return false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
    catch (e) { toast('No se pudo guardar en este navegador. Descarga un respaldo en la sección Respaldo.'); return false; }
  }
  // Tras un envío solo se actualiza la marca de tiempo, sin reescribir el resto: así una pestaña con datos
  // desactualizados no pisa los cambios hechos en otra, ni "revive" datos borrados al salir.
  function persistSyncMeta() {
    if (READONLY) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
      const cur = JSON.parse(raw); cur.sync = state.sync; localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
    } catch (e) { /* ignorar */ }
  }
  function scheduleSync(delay = 8000) {
    if (!syncActive()) return;
    clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncTimer = null; doSync(false); }, delay);
  }

  function buildActivity() {
    const full = syncCfg.level === 'full';
    const ppl = state.people;
    return {
      people: ppl.length,
      avgProgress: ppl.length ? pct(avg(ppl.map(progress))) : 0,
      customVars: state.customVars.length,
      aiConversations: ppl.reduce((n, p) => n + Object.values(p.custom).filter(c => c.chat && c.chat.length).length, 0),
      advisorMessages: state.advisor.chat.filter(m => m.role === 'user').length,
      lastChange: ppl.reduce((m, p) => Math.max(m, p.updated || 0), 0),
      peopleDetail: ppl.map((p, i) => {
        const d = discOf(p);
        const base = { alias: 'Persona ' + (i + 1), progress: pct(progress(p)), disc: d ? d.label : '' };
        return full ? { ...base, name: p.name, role: p.role, skill: p.skill, will: p.will, retention: p.retention, potential: p.potential, strengths: p.strengths, devs: p.devs, updated: p.updated } : base;
      })
    };
  }

  async function doSync(manual, keepalive) {
    if (READONLY || !state.leader || !syncCfg.enabled) return false;
    if (!manual && !syncActive()) return false;
    const { sync, ...snap } = state;
    const payload = { leader: { id: state.leader.id, name: state.leader.name, email: state.leader.email || '', company: state.leader.company || '', team: state.leader.team || '' }, activity: buildActivity() };
    if (syncCfg.level === 'full') payload.snapshot = snap;
    try {
      await apiPost('/api/sync', payload, { interactive: !!manual, keepalive: !!keepalive });
      state.sync.last = Date.now(); state.sync.error = ''; persistSyncMeta(); updateSyncUi();
      if (manual) toast('Copia enviada a administración.');
      return true;
    } catch (e) {
      state.sync.error = e.message; persistSyncMeta(); updateSyncUi();
      if (manual) toast(e.message);
      return false;
    }
  }

  function updateSyncUi() {
    const st = $('#sync-status'); if (st) st.textContent = syncStatusText();
    const pm = $('#priv-main');
    if (pm) {
      const what = syncCfg.level === 'full' ? 'una copia completa de lo que ingreses (las personas de tu equipo, tus respuestas y tus conversaciones con la IA)' : 'un registro de actividad (sin nombres ni respuestas)';
      pm.innerHTML = !syncCfg.enabled
        ? '<strong>Tu información es privada.</strong> Todo queda guardado solo en este navegador, en este dispositivo. Nadie más puede verla, y puedes descargar un respaldo cuando quieras.'
        : syncCfg.required
          ? `<strong>Importante antes de empezar.</strong> Tu información se guarda en este navegador y, además, tu administración recibe ${what}, de forma automática. Si tienes dudas, consúltalo antes de ingresar datos de tu equipo.`
          : `<strong>Tu información es privada.</strong> Todo queda guardado en este navegador. Más adelante podrás elegir si compartes ${what} con administración.`;
    }
  }

  async function loadSyncCfg() {
    try {
      const r = await fetch('/api/sync');
      if (r.ok) { const j = await r.json(); if (j && typeof j.enabled === 'boolean') syncCfg = { ...syncCfg, ...j }; }
    } catch (e) { /* sin servidor: la app funciona igual */ }
    updateSyncUi(); scheduleSync(2000);
  }

  /* ----- Asesor IA ----- */
  let advBusy = false;
  const ADV_PROMPTS = [
    '¿A quién debería prestarle atención primero y por qué?',
    '¿Cómo reparto las tareas del próximo trimestre según las fortalezas de cada uno?',
    '¿Qué riesgos ves en la composición de mi equipo?',
    'Ayúdame a preparar una reunión de equipo considerando los estilos DISC.',
    'Dame un plan de 30 días para mejorar la motivación del equipo.'
  ];
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const aliasOf = i => 'Persona ' + (i + 1);

  // Si el líder no envía nombres reales, se reemplazan por alias antes de salir del navegador.
  function scrub(text) {
    let t = String(text || '');
    if (state.advisor.names) return t;
    const swap = (name, alias) => {
      if (!name || name.length < 3) return;
      t = t.replace(new RegExp('(?<![\\p{L}\\p{N}])' + escRe(name) + '(?![\\p{L}\\p{N}])', 'giu'), alias);
    };
    state.people.forEach((p, i) => swap(p.name.trim(), aliasOf(i)));
    state.people.forEach((p, i) => swap(firstName(p), aliasOf(i)));
    return t;
  }
  function unalias(text) {
    if (state.advisor.names) return text;
    return String(text || '').replace(/Persona (\d+)/g, (m, n) => (state.people[n - 1] ? state.people[n - 1].name : m));
  }

  function buildTeamSummary() {
    const names = state.advisor.names; const notes = state.advisor.notes;
    const nowTxt = { threat: 'amenaza', neutral: 'neutro', reward: 'recompensa' };
    const out = [`Equipo de ${state.people.length} personas${state.leader.team ? ' (' + scrub(state.leader.team) + ')' : ''}.`];
    state.people.forEach((p, i) => {
      const label = names ? p.name : aliasOf(i);
      const d = discOf(p);
      const L = [];
      L.push(`## ${label}${p.role ? ' (cargo: ' + p.role + ')' : ''}`);
      if (p.tenure) L.push(`- Tiempo trabajando con el líder: ${p.tenure}. Cuánto la conoce el líder: ${p.knows ?? 's/d'} de 5.`);
      if (d) L.push(`- DISC: ${d.label} (${DISC_LETTERS.filter(x => d.scores[x] != null).map(x => x + ' ' + d.scores[x].toFixed(1)).join(', ')})`);
      const sc = SCARF.filter(x => p.scarf[x.k].s != null).map(x => `${x.name} ${p.scarf[x.k].s}${p.scarf[x.k].now ? ' (hoy: ' + nowTxt[p.scarf[x.k].now] + ')' : ''}`);
      if (sc.length) L.push(`- SCARF, importancia de 1 a 5: ${sc.join(', ')}`);
      if (p.strengths.length) L.push(`- Fortalezas: ${p.strengths.join(', ')}`);
      if (p.devs.length) L.push(`- Áreas de desarrollo: ${p.devs.join(', ')}`);
      if (p.bestTasks.length) L.push(`- Rinde mejor en: ${p.bestTasks.join(', ')}`);
      const pf = p.prefs; if (pf.structure || pf.social || pf.horizon) L.push(`- Prefiere (1 a 5): estructura ${pf.structure ?? 's/d'} (5 = procesos definidos), interacción ${pf.social ?? 's/d'} (5 = en equipo), horizonte ${pf.horizon ?? 's/d'} (5 = largo plazo)`);
      L.push(`- Habilidad ${p.skill ?? 's/d'} de 5, motivación ${p.will ?? 's/d'} de 5${p.potential ? ', potencial: ' + p.potential : ''}${p.retention ? ', riesgo de fuga: ' + p.retention : ''}`);
      if (p.motivators.length) L.push(`- La motiva: ${p.motivators.join(', ')}`);
      if (p.feedback) L.push(`- Feedback preferido: ${p.feedback}`);
      state.customVars.forEach(v => { const c = p.custom[v.id]; if (c && c.score != null) L.push(`- Variable "${v.name}": ${c.score} de 5${c.summary ? '. ' + c.summary : ''}`); });
      if (notes) {
        const nt = [p.strengthNote, p.devNote, p.bestNote, p.drainNote, p.action].map(x => (x || '').trim()).filter(Boolean).map(scrub);
        if (nt.length) L.push(`- Notas del líder: ${nt.join(' | ')}`);
      }
      out.push(L.join('\n'));
    });
    return out.join('\n\n');
  }

  function md(text) {
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    let html = ''; let list = false;
    esc(text).split('\n').forEach(line => {
      const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      const h = line.match(/^\s*#{1,6}\s+(.*)$/);
      if (li) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(li[1])}</li>`; }
      else { if (list) { html += '</ul>'; list = false; } if (h) html += `<p><strong>${inline(h[1])}</strong></p>`; else if (line.trim()) html += `<p>${inline(line)}</p>`; }
    });
    return html + (list ? '</ul>' : '');
  }

  function viewAdvisor() {
    const ppl = state.people; const ad = state.advisor;
    const head = `<div class="page-head"><div><h1>Asesor IA</h1><p>Pregúntale a la IA cómo gestionar a tu equipo. Responde a partir de los datos que ya ingresaste sobre cada persona, así que mientras más completos estén los perfiles, mejores serán sus consejos.</p></div></div>`;
    if (!ppl.length) return `${head}<div class="panel empty"><h2>Primero necesitas a tu equipo</h2><p>Agrega personas y completa sus perfiles. Después podrás pedirle consejos a la IA.</p><a class="btn" href="#/equipo">Ir a Mi equipo</a></div>`;
    const bubbles = ad.chat.map(m => m.role === 'assistant'
      ? `<div class="bubble ai"><span class="who">Asesor IA</span><div class="md">${md(m.text)}</div></div>`
      : `<div class="bubble me"><span class="who">Tú</span>${esc(m.text)}</div>`).join('') + (advBusy ? '<div class="bubble ai"><span class="who">Asesor IA</span>Analizando a tu equipo…</div>' : '');
    if (READONLY) {
      return `<div class="page-head"><div><h1>Conversaciones con el asesor IA</h1><p>Lo que este líder le preguntó al asesor y lo que respondió. Modo solo lectura.</p></div></div>
        <section class="panel">${bubbles || '<p class="muted">Este líder aún no usa el asesor.</p>'}</section>`;
    }
    return `${head}
      <section class="panel"><h2>Qué se envía a la IA</h2>
        <p class="sect-desc">Para aconsejarte, la IA recibe un resumen de los perfiles de tu equipo (DISC, SCARF, fortalezas, tareas, motivación y variables propias). Tú decides cuánto compartir.</p>
        <label class="check"><input type="checkbox" data-opt="adv.names" ${ad.names ? 'checked' : ''}> Enviar nombres reales. Si no lo marcas, la IA ve “Persona 1”, “Persona 2”… y yo los traduzco al mostrarte la respuesta.</label>
        <label class="check"><input type="checkbox" data-opt="adv.notes" ${ad.notes ? 'checked' : ''}> Incluir mis notas escritas. Pueden contener detalles sensibles, así que revisa antes de activarlo.</label>
        <p class="small muted">Datos disponibles: ${ppl.length} ${ppl.length === 1 ? 'persona' : 'personas'}, perfiles completos en promedio al ${pct(avg(ppl.map(progress)))}%.</p></section>
      <section class="panel"><h2>Conversación</h2>
        <div class="chat">${bubbles || '<p class="muted">Haz una pregunta o elige una de estas:</p>'}</div>
        ${ad.chat.length ? '' : `<div class="tags">${ADV_PROMPTS.map(x => `<button type="button" class="tag" data-action="adv-prompt" data-val="${esc(x)}">${esc(x)}</button>`).join('')}</div>`}
        <div class="field" style="margin-top:1rem"><label for="adv-input">Tu pregunta</label><textarea id="adv-input" ${advBusy ? 'disabled' : ''} placeholder="Por ejemplo: ¿cómo debería conversar con la persona que tiene riesgo de fuga alto?"></textarea></div>
        <div class="btn-row"><button type="button" class="btn" data-action="adv-send" ${advBusy ? 'disabled' : ''}>Preguntar</button>
          ${ad.chat.length ? '<button type="button" class="btn ghost" data-action="adv-clear">Borrar conversación</button>' : ''}</div>
        <p class="footnote">Los consejos se basan en tu percepción y no reemplazan una conversación con la persona ni la opinión de RR.HH.</p></section>`;
  }

  async function sendAdvice(text) {
    if (advBusy) return;
    const ad = state.advisor;
    ad.chat.push({ role: 'user', text }); advBusy = true; save();
    const redraw = () => { if (location.hash.startsWith('#/asesor')) { app.innerHTML = viewAdvisor(); } };
    redraw();
    try {
      const transcript = ad.chat.slice(-8).map(m => ({ role: m.role, text: scrub(m.text) }));
      const data = await apiPost('/api/advise', { team: buildTeamSummary(), transcript }, { interactive: true });
      ad.chat.push({ role: 'assistant', text: unalias(data.text) });
      ad.chat = ad.chat.slice(-20);
      advBusy = false; save(); redraw();
    } catch (err) {
      ad.chat.pop(); advBusy = false; save(); redraw();
      const ta = $('#adv-input'); if (ta) ta.value = text;
      toast(err.message || 'No se pudo contactar a la IA.');
    }
  }

  /* =====================================================================
     Router
     ===================================================================== */
  const app = $('#app');

  function adminBanner() {
    const l = state.leader || {}; const rec = adminRec || {};
    return `<div class="admin-banner no-print"><div><strong>Vista de administración, solo lectura.</strong> ${esc(l.name || '')}${l.email ? ', ' + esc(l.email) : ''}${l.company ? '. Empresa: ' + esc(l.company) : ''}${rec.updated ? '. Último envío: ' + new Date(rec.updated).toLocaleString('es-CL') : ''}</div>
      <a class="btn small ghost" href="/admin.html">Volver al panel</a></div>`;
  }

  function updateBrand() {
    const c = $('#brand-company'); if (c) c.textContent = (state.leader && state.leader.company) || '';
    const x = $('#btn-exit'); if (x) x.hidden = !(state.leader && !READONLY);
    document.title = state.leader && state.leader.company ? `Mapa de equipo - ${state.leader.company}` : 'Mapa de equipo';
  }

  function render() {
    const hash = location.hash.replace(/^#\/?/, '');
    let [view, a, b] = hash.split('/');
    if (READONLY && state.leader) { if (view === 'editar') view = 'persona'; if (view === 'datos') view = 'equipo'; }
    currentId = null;
    let html = '';
    let nav = '';

    if (!state.leader) {
      html = viewWelcome();
    } else if (!READONLY && !state.leader.company) {
      html = viewCompany();
    } else if (view === 'editar' && person(a)) {
      currentId = a; nav = 'equipo';
      html = viewEdit(person(a), Math.min(Math.max(parseInt(b, 10) || 0, 0), STEPS.length - 1));
    } else if (view === 'persona' && person(a)) {
      nav = 'equipo'; html = viewPerson(person(a));
    } else if (view === 'mapa') {
      nav = 'mapa'; html = viewMap();
    } else if (view === 'sistema') {
      nav = 'mapa'; html = viewSystem();
    } else if (view === 'asesor') {
      nav = 'asesor'; html = viewAdvisor();
    } else if (view === 'datos') {
      nav = 'datos'; html = viewData();
    } else {
      nav = 'equipo'; html = viewTeam();
    }
    app.innerHTML = (READONLY && state.leader ? adminBanner() : '') + html;
    $$('#nav a').forEach(l => { l.classList.toggle('active', l.dataset.nav === nav); l.hidden = READONLY && l.dataset.nav === 'datos'; });
    $('#nav').style.visibility = state.leader && (READONLY || state.leader.company) ? 'visible' : 'hidden';
    window.scrollTo(0, 0);
    updateBrand();
    updateSyncUi();
  }

  /* ----- Diálogo, salir y vista de administración ----- */
  function askDialog({ title, text, actions }) {
    return new Promise(resolve => {
      if (!window.HTMLDialogElement || typeof HTMLDialogElement.prototype.showModal !== 'function') {
        resolve(window.confirm(`${title}\n\n${text}`) ? actions[0].id : 'cancel'); return;
      }
      const dlg = document.createElement('dialog'); dlg.className = 'dlg';
      dlg.innerHTML = `<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btn-row">${actions.map(a =>
        `<button type="button" class="btn ${a.kind === 'primary' ? '' : a.kind === 'danger' ? 'danger-solid' : 'ghost'}" data-dlg="${a.id}">${esc(a.label)}</button>`).join('')}</div>`;
      dlg.addEventListener('click', e => { const b = e.target.closest('[data-dlg]'); if (b) dlg.close(b.dataset.dlg); });
      dlg.addEventListener('close', () => { const v = dlg.returnValue || 'cancel'; dlg.remove(); resolve(v); });
      document.body.appendChild(dlg); dlg.showModal();
    });
  }

  function downloadBackup() { download(`respaldo-mapa-equipo-${stamp()}.json`, JSON.stringify(state, null, 2), 'application/json'); }

  async function exitAndWipe() {
    if (READONLY) return;
    const hasData = state.people.length > 0;
    const sent = syncCfg.enabled && state.sync.last;
    const choice = await askDialog({
      title: 'Salir y borrar mi mapa',
      text: `Se borrarán de este navegador las personas de tu equipo, sus perfiles, tus notas y tus conversaciones con la IA. Esta acción no se puede deshacer.${sent ? ' La copia que ya se envió a administración se mantiene allí.' : ''}`,
      actions: hasData
        ? [{ id: 'backup', label: 'Descargar respaldo y salir', kind: 'primary' }, { id: 'wipe', label: 'Salir sin respaldo', kind: 'danger' }, { id: 'cancel', label: 'Cancelar', kind: 'ghost' }]
        : [{ id: 'wipe', label: 'Salir', kind: 'danger' }, { id: 'cancel', label: 'Cancelar', kind: 'ghost' }]
    });
    if (choice === 'cancel' || !choice) return;
    if (choice === 'backup') downloadBackup();
    if (syncActive()) { try { await doSync(false); } catch (e) { /* ignorar */ } } // último envío antes de borrar
    clearTimeout(syncTimer);
    state = emptyState();
    persist();
    try { [STORAGE_KEY, CODE_KEY, ...LEGACY_STORAGE_KEYS].forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignorar */ }
    location.hash = '#/equipo'; render();
    toast('Listo. Tu mapa se borró de este navegador.');
  }

  async function bootAdminView() {
    document.body.classList.add('readonly');
    const msg = (t, extra = '') => { app.innerHTML = `<div class="panel empty"><h2>${esc(t)}</h2>${extra}<a class="btn" href="/admin.html">Volver al panel</a></div>`; };
    msg('Cargando resultados…');
    let code = ''; try { code = sessionStorage.getItem(ADMIN_CODE_KEY) || ''; } catch (e) { /* ignorar */ }
    if (!code) { code = (window.prompt('Código de administración') || '').trim(); try { sessionStorage.setItem(ADMIN_CODE_KEY, code); } catch (e) { /* ignorar */ } }
    try {
      const res = await fetch('/api/admin?id=' + encodeURIComponent(ADMIN_VIEW_ID), { headers: { 'X-Admin-Code': code } });
      const rec = await res.json().catch(() => null);
      if (!res.ok || !rec) throw new Error((rec && rec.message) || 'No se pudo cargar el registro.');
      if (!rec.snapshot) { msg('Este líder no tiene respuestas guardadas', '<p>Solo se guarda su registro de actividad. Para ver resultados, configura SYNC_LEVEL=full en Vercel y pídele que envíe de nuevo su copia.</p>'); return; }
      const snap = rec.snapshot;
      snap.people = (snap.people || []).map(p => fill(p, blankPerson()));
      fill(snap, { customVars: [], advisor: { chat: [], names: false, notes: false } });
      adminRec = rec;
      state = { ...emptyState(), ...snap, leader: { ...(snap.leader || {}), ...rec.leader }, sync: emptyState().sync };
      render();
    } catch (e) { msg('No se pudieron cargar los resultados', `<p>${esc(e.message)}</p>`); }
  }

  function updateProgress() {
    const p = cur(); if (!p) return;
    $$('[data-bar]').forEach(el => { el.style.width = pct(stepFrac(p, Number(el.dataset.bar))) + '%'; });
  }

  function rerenderStep(focusSel) {
    const p = cur(); if (!p) return;
    const step = Math.min(Math.max(parseInt(location.hash.split('/')[3], 10) || 0, 0), STEPS.length - 1);
    const y = window.scrollY;
    $('#step-body').innerHTML = STEP_RENDER[step](p);
    window.scrollTo(0, y);
    updateProgress();
    if (focusSel) { const el = $(focusSel); if (el) el.focus(); }
  }

  /* =====================================================================
     Eventos
     ===================================================================== */
  document.addEventListener('click', e => {
    const planet = e.target.closest('[data-planet]');
    if (planet) {
      const id = planet.dataset.planet;
      if (lastPointer === 'touch') { if (tipPinned === id) location.hash = '#/persona/' + id; else { tipPinned = id; showTip(planet); } }
      else location.hash = '#/persona/' + id;
      return;
    }
    if (tipPinned && !e.target.closest('#sys-tip')) hideTip(0);
    const setBtn = e.target.closest('[data-set]');
    if (setBtn) {
      const p = cur(); if (!p) return;
      const path = setBtn.dataset.set;
      const v = setBtn.dataset.num ? Number(setBtn.dataset.val) : setBtn.dataset.val;
      const nv = getP(p, path) === v ? null : v;
      setP(p, path, nv);
      Array.from(setBtn.parentElement.querySelectorAll('[data-set]')).forEach(b => {
        const on = nv !== null && b === setBtn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      });
      touch(); updateProgress(); return;
    }
    const tagBtn = e.target.closest('[data-tag]');
    if (tagBtn) {
      const p = cur(); if (!p) return;
      const arr = getP(p, tagBtn.dataset.tag); const v = tagBtn.dataset.val;
      const i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1);
      const on = i === -1; tagBtn.classList.toggle('on', on); tagBtn.setAttribute('aria-pressed', String(on));
      touch(); updateProgress(); return;
    }
    const addBtn = e.target.closest('[data-addtagbtn]');
    if (addBtn) { addTag(addBtn.dataset.addtagbtn); return; }

    const act = e.target.closest('[data-action]');
    if (!act) return;
    const a = act.dataset.action;
    if (a === 'print') window.print();
    else if (a.startsWith('ai-') || a === 'var-delete' || a === 'var-suggest') handleVarAction(act, a);
    else if (a === 'sys-png') downloadSystemPng();
    else if (a === 'export-docx') downloadReport();
    else if (a === 'export-person-docx') downloadReport(act.dataset.id);
    else if (a === 'exit') exitAndWipe();
    else if (a === 'adv-prompt') { const ta = $('#adv-input'); if (ta) { ta.value = act.dataset.val; ta.focus(); } }
    else if (a === 'adv-send') {
      const ta = $('#adv-input'); const text = ta ? ta.value.trim() : '';
      if (!text) { toast('Escribe tu pregunta antes de enviarla.'); return; }
      sendAdvice(text);
    }
    else if (a === 'adv-clear') { if (confirm('¿Borrar toda la conversación con el asesor?')) { state.advisor.chat = []; save(); app.innerHTML = viewAdvisor(); } }
    else if (a === 'sync-now') doSync(true);
    else if (a === 'delete') {
      const p = person(act.dataset.id);
      if (p && confirm(`¿Eliminar a ${p.name || 'esta persona'} y todo su perfil? No se puede deshacer.`)) {
        state.people = state.people.filter(x => x.id !== p.id); save(); render();
      }
    } else if (a === 'export-json') {
      downloadBackup();
      toast('Respaldo descargado.');
    } else if (a === 'export-csv') {
      download(`resumen-equipo-${stamp()}.csv`, toCsv(), 'text/csv;charset=utf-8');
      toast('Resumen descargado.');
    } else if (a === 'wipe') {
      exitAndWipe();
    }
  });

  function handleVarAction(act, a) {
    if (a === 'var-suggest') { const i = $('#v-name'); if (i) { i.value = act.dataset.val; i.focus(); } return; }
    if (a === 'var-delete') {
      const v = state.customVars.find(x => x.id === act.dataset.id);
      if (v && confirm(`¿Quitar la variable "${v.name}" de todo tu equipo? Se borrarán las respuestas de todas las personas.`)) {
        state.customVars = state.customVars.filter(x => x.id !== v.id);
        state.people.forEach(p => { delete p.custom[v.id]; });
        save(); rerenderStep();
      }
      return;
    }
    const p = cur(); if (!p) return;
    const id = act.dataset.var; const c = getCustom(p, id);
    if (a === 'ai-start' || a === 'ai-retry') {
      callAI(p, id, c.chat.filter(m => m.role === 'user').length >= AI_MAX_QUESTIONS);
    } else if (a === 'ai-answer') {
      const ta = $('#ans-' + id); const text = ta ? ta.value.trim() : '';
      if (!text) { toast('Escribe tu respuesta antes de continuar.'); return; }
      c.chat.push({ role: 'user', text }); save();
      callAI(p, id, c.chat.filter(m => m.role === 'user').length >= AI_MAX_QUESTIONS);
    } else if (a === 'ai-finish') {
      const ta = $('#ans-' + id); const text = ta ? ta.value.trim() : '';
      if (text) { c.chat.push({ role: 'user', text }); save(); }
      callAI(p, id, true);
    } else if (a === 'ai-reset') {
      if (confirm('Se borrarán las preguntas y la lectura de esta variable para esta persona. ¿Continuar?')) {
        p.custom[id] = { chat: [], score: null, summary: '', tip: '', done: false }; save(); rerenderStep();
      }
    }
  }

  function addTag(path) {
    const p = cur(); const input = $(`[data-addtag="${path}"]`);
    if (!p || !input) return;
    const v = input.value.trim(); if (!v) return;
    const arr = getP(p, path);
    if (!arr.some(x => x.toLowerCase() === v.toLowerCase())) arr.push(v);
    touch(); rerenderStep(`[data-addtag="${path}"]`);
  }

  let lastPointer = '';
  document.addEventListener('pointerdown', e => { lastPointer = e.pointerType || ''; });
  document.addEventListener('mouseover', e => {
    const pl = e.target.closest && e.target.closest('[data-planet]');
    if (pl) { showTip(pl); return; }
    if (e.target.closest && e.target.closest('#sys-tip')) clearTimeout(tipTimer);
  });
  document.addEventListener('mouseout', e => {
    const from = e.target.closest && e.target.closest('[data-planet], #sys-tip'); if (!from) return;
    const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-planet], #sys-tip') : null;
    if (to || tipPinned) return;
    hideTip();
  });
  document.addEventListener('focusin', e => { const pl = e.target.closest && e.target.closest('[data-planet]'); if (pl) showTip(pl); });
  document.addEventListener('focusout', e => { const pl = e.target.closest && e.target.closest('[data-planet]'); if (pl) hideTip(); });

  document.addEventListener('keydown', e => {
    const pl = e.target.closest && e.target.closest('[data-planet]');
    if (pl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.hash = '#/persona/' + pl.dataset.planet; return; }
    const input = e.target.closest && e.target.closest('[data-addtag]');
    if (input && e.key === 'Enter') { e.preventDefault(); addTag(input.dataset.addtag); }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path) return;
    const p = cur(); if (!p) return;
    setP(p, el.dataset.path, el.value);
    if (el.dataset.path === 'name') { const t = $('.person-title'); if (t) t.textContent = el.value || 'Nueva persona'; }
    touch(); updateProgress();
  });

  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'welcome-form') {
      const name = $('#w-name').value.trim(); const company = $('#w-company').value.trim();
      if (!name || !company) { toast('Indica tu empresa y tu nombre para empezar.'); return; }
      state.leader = { id: uid(), name, email: $('#w-email').value.trim(), company, team: $('#w-team').value.trim() };
      save(); location.hash = '#/equipo'; render();
      if (syncCfg.required) doSync(true);
    } else if (f.id === 'add-form') {
      const name = $('#np-name').value.trim(); if (!name) return;
      const p = blankPerson(name, $('#np-role').value.trim());
      state.people.push(p); save();
      location.hash = `#/editar/${p.id}/1`;
    } else if (f.id === 'company-form') {
      const company = $('#c-company').value.trim(); if (!company) return;
      state.leader.company = company; save(); render();
    } else if (f.id === 'var-form') {
      const name = $('#v-name').value.trim(); if (!name) return;
      if (state.customVars.some(v => v.name.toLowerCase() === name.toLowerCase())) { toast('Ya existe una variable con ese nombre.'); return; }
      state.customVars.push({ id: uid(), name, desc: $('#v-desc').value.trim() });
      save(); rerenderStep(); toast('Variable creada.');
    } else if (f.id === 'leader-form') {
      state.leader = { ...state.leader, name: $('#l-name').value.trim(), email: $('#l-email').value.trim(), company: $('#l-company').value.trim(), team: $('#l-team').value.trim() };
      save(); toast('Datos guardados.');
    }
  });

  document.addEventListener('change', e => {
    const opt = e.target.dataset && e.target.dataset.opt;
    if (opt) {
      if (opt === 'adv.names') state.advisor.names = e.target.checked;
      else if (opt === 'adv.notes') state.advisor.notes = e.target.checked;
      else if (opt === 'sync.optIn') { state.sync.optIn = e.target.checked; if (e.target.checked) { if (syncCfg.needsCode && !getCode()) doSync(true); else scheduleSync(500); } }
      save(); return;
    }
    if (e.target.id !== 'import-file' || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const s = JSON.parse(reader.result);
        if (!s || !Array.isArray(s.people)) throw new Error('formato');
        if (!confirm('Esto reemplazará los datos actuales de este navegador. ¿Continuar?')) return;
        s.people = s.people.map(p => fill(p, blankPerson()));
        const lead = s.leader || state.leader;
        const adv = s.advisor && Array.isArray(s.advisor.chat) ? fill(s.advisor, { names: false, notes: false }) : state.advisor;
        state = { ...emptyState(), leader: lead ? { ...lead, id: (state.leader && state.leader.id) || lead.id || uid() } : null,
          people: s.people, customVars: Array.isArray(s.customVars) ? s.customVars : [], advisor: adv, sync: state.sync };
        save(); toast('Respaldo restaurado.'); location.hash = '#/equipo'; render();
      } catch (err) { toast('Ese archivo no parece un respaldo válido de esta aplicación.'); }
    };
    reader.readAsText(e.target.files[0]);
  });

  window.addEventListener('hashchange', render);
  // Si el líder cambia de pestaña o cierra la app con cambios pendientes, se envían de inmediato.
  const flushSync = () => { if (syncTimer && syncActive()) { clearTimeout(syncTimer); syncTimer = null; doSync(false, true); } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSync(); });
  window.addEventListener('pagehide', flushSync);
  if (READONLY) bootAdminView();
  else { render(); loadSyncCfg(); }
})();
