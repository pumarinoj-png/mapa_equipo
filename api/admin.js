/* Panel de administración (datos). Protegido con ADMIN_CODE.
   GET    /api/admin           -> resumen de todos los líderes y bitácora reciente
   GET    /api/admin?id=XXXX   -> registro completo de un líder (incluye copia si el nivel es "full")
   DELETE /api/admin?id=XXXX   -> elimina el registro de un líder */
const { safeEqual, redis, redisConfigured } = require('../lib/shared');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const code = process.env.ADMIN_CODE;
  if (!code) return res.status(503).json({ message: 'Falta configurar ADMIN_CODE en Vercel.' });
  if (!safeEqual(req.headers['x-admin-code'], code)) return res.status(401).json({ message: 'Código de administración incorrecto.' });
  if (!redisConfigured()) return res.status(503).json({ message: 'La base de datos no está configurada.' });

  const id = new URL(req.url, 'http://localhost').searchParams.get('id');
  if (id && !/^[a-z0-9]{6,40}$/i.test(id)) return res.status(400).json({ message: 'Identificador inválido.' });

  try {
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ message: 'Falta el identificador.' });
      await redis(['DEL', 'mapa:leader:' + id]);
      await redis(['SREM', 'mapa:leaders', id]);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'GET') return res.status(405).json({ message: 'Método no permitido.' });

    if (id) {
      const raw = await redis(['GET', 'mapa:leader:' + id]);
      if (!raw) return res.status(404).json({ message: 'No existe ese registro.' });
      return res.status(200).json(JSON.parse(raw));
    }

    const ids = (await redis(['SMEMBERS', 'mapa:leaders'])) || [];
    const raws = ids.length ? await redis(['MGET', ...ids.map(i => 'mapa:leader:' + i)]) : [];
    const leaders = raws.map(r => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean)
      .map(r => ({ leader: r.leader, level: r.level, updated: r.updated, hasSnapshot: !!r.snapshot, activity: r.activity }))
      .sort((a, b) => b.updated - a.updated);
    const log = ((await redis(['LRANGE', 'mapa:log', 0, 199])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(Boolean);
    return res.status(200).json({ leaders, log });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ message: 'No se pudo leer la base de datos.' });
  }
};
