/* Utilidades compartidas por las funciones de servidor (api/*.js). */
const crypto = require('crypto');

const clip = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

function safeEqual(a, b) {
  const A = Buffer.from(String(a || '')); const B = Buffer.from(String(b || ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  return b && typeof b === 'object' ? b : null;
}

/* Código de acceso para líderes (opcional). Devuelve false y responde 401 si no coincide. */
function checkAccess(req, res) {
  const code = process.env.ACCESS_CODE;
  if (code && !safeEqual(req.headers['x-access-code'], code)) {
    res.status(401).json({ error: 'unauthorized', message: 'Código de acceso incorrecto.' });
    return false;
  }
  return true;
}

/* Llamada a la API de Anthropic. Lanza Error con mensaje seguro para mostrar al usuario. */
async function callClaude({ system, messages, maxTokens }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { const e = new Error('La IA todavía no está configurada. Quien administra la app debe agregar ANTHROPIC_API_KEY en Vercel.'); e.status = 503; throw e; }
  let r, data;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: maxTokens || 600, system, messages })
    });
    data = await r.json().catch(() => null);
  } catch (err) {
    console.error(err);
    const e = new Error('No se pudo contactar a la IA. Intenta de nuevo.'); e.status = 502; throw e;
  }
  if (!r.ok || !data) {
    console.error('Anthropic error', r.status, data && data.error);
    const e = new Error('La IA no respondió. Intenta de nuevo en un momento.'); e.status = 502; throw e;
  }
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

/* Base de datos Redis por REST (Upstash, disponible desde Vercel Marketplace). */
const redisUrl = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const redisConfigured = () => !!(redisUrl() && redisToken());

async function redis(cmd) {
  const r = await fetch(redisUrl(), {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + redisToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.error) throw new Error('redis: ' + ((j && j.error) || r.status));
  return j.result;
}

module.exports = { clip, safeEqual, readBody, checkAccess, callClaude, redis, redisConfigured };
