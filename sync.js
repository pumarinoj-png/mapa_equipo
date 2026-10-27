/* Registro para administración: guarda una copia (o solo la actividad) del mapa de cada líder.
   GET  -> configuración pública (si está habilitado, nivel y si es obligatorio).
   POST -> guarda la copia del líder.

   Variables de entorno:
   - KV_REST_API_URL y KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN): base de datos Redis. Sin ellas, el registro queda deshabilitado.
   - SYNC_LEVEL     "full" (por defecto: copia completa, para que administración vea los resultados) o "activity" (solo actividad, sin nombres ni respuestas).
   - SYNC_REQUIRED  "true" para que el envío sea automático y obligatorio.
   - ACCESS_CODE    código compartido con los líderes (opcional). */
const { clip, readBody, checkAccess, redis, redisConfigured } = require('../lib/shared');

const MAX_SNAPSHOT = 900000;
const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v)) || 0));
const nullableNum = (v, max) => (v == null ? null : num(v, max));
const strs = (a, n) => (Array.isArray(a) ? a.slice(0, 30).map(x => clip(x, n)).filter(Boolean) : []);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const level = process.env.SYNC_LEVEL === 'activity' ? 'activity' : 'full';
  const cfg = { enabled: redisConfigured(), level, required: process.env.SYNC_REQUIRED === 'true', needsCode: !!process.env.ACCESS_CODE };

  if (req.method === 'GET') return res.status(200).json(cfg);
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método no permitido.' });
  if (!cfg.enabled) return res.status(503).json({ message: 'El registro con administración no está habilitado.' });
  if (!checkAccess(req, res)) return;

  const body = readBody(req);
  const l = body && body.leader;
  if (!l || !/^[a-z0-9]{6,40}$/i.test(String(l.id || ''))) return res.status(400).json({ message: 'Solicitud inválida.' });
  const full = level === 'full';

  const a = body.activity || {};
  const activity = {
    people: num(a.people, 500), avgProgress: num(a.avgProgress, 100), customVars: num(a.customVars, 50),
    aiConversations: num(a.aiConversations, 5000), advisorMessages: num(a.advisorMessages, 5000), lastChange: num(a.lastChange, 9e15),
    peopleDetail: (Array.isArray(a.peopleDetail) ? a.peopleDetail : []).slice(0, 80).map(p => {
      const base = { alias: clip(p.alias, 20), progress: num(p.progress, 100), disc: clip(p.disc, 2) };
      return full ? { ...base, name: clip(p.name, 80), role: clip(p.role, 80), skill: nullableNum(p.skill, 5), will: nullableNum(p.will, 5),
        retention: clip(p.retention, 10), potential: clip(p.potential, 60), strengths: strs(p.strengths, 60), devs: strs(p.devs, 60), updated: num(p.updated, 9e15) } : base;
    })
  };

  let snapshot = null;
  if (full && body.snapshot) {
    if (JSON.stringify(body.snapshot).length > MAX_SNAPSHOT) return res.status(413).json({ message: 'El mapa es demasiado grande para enviarlo.' });
    snapshot = body.snapshot;
  }

  const id = String(l.id);
  const key = 'mapa:leader:' + id;
  const leader = { id, name: clip(l.name, 80), email: clip(l.email, 120), company: clip(l.company, 120), team: clip(l.team, 120) };

  try {
    let prev = null;
    try { prev = JSON.parse(await redis(['GET', key])); } catch (e) { /* primera vez */ }
    const rec = { leader, activity, snapshot, level, updated: Date.now() };
    await redis(['SET', key, JSON.stringify(rec)]);
    await redis(['SADD', 'mapa:leaders', id]);

    const changed = !prev || !prev.activity || ['lastChange', 'people', 'aiConversations', 'advisorMessages', 'customVars'].some(k => prev.activity[k] !== activity[k]);
    if (changed) {
      await redis(['LPUSH', 'mapa:log', JSON.stringify({ t: rec.updated, id, name: leader.name, company: leader.company, team: leader.team, people: activity.people, avg: activity.avgProgress, ai: activity.aiConversations, adv: activity.advisorMessages })]);
      await redis(['LTRIM', 'mapa:log', 0, 999]);
    }
    return res.status(200).json({ ok: true, updated: rec.updated });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ message: 'No se pudo guardar la copia. Intenta de nuevo.' });
  }
};
