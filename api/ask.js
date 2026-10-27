/* Entrevista con IA sobre una variable propia (una pregunta por vez).
   Variables de entorno: ANTHROPIC_API_KEY (obligatoria), ACCESS_CODE y ANTHROPIC_MODEL (opcionales). */
const { clip, readBody, checkAccess, callClaude } = require('../lib/shared');

const MAX_QUESTIONS = 4;

const SYSTEM = `Eres un coach de liderazgo que ayuda a líderes de una empresa a observar mejor a las personas de su equipo.
El líder quiere evaluar a una persona en UNA variable que él mismo definió. Tu trabajo es entrevistarlo, no evaluar tú a la persona.

Reglas:
- Haz UNA sola pregunta por turno, breve y en español neutro de Chile, tuteando.
- Pregunta por conductas observables y ejemplos concretos y recientes ("¿qué hizo la última vez que...?"), no por opiniones generales ni rasgos de personalidad.
- Adapta cada pregunta a lo que el líder ya respondió. No repitas temas.
- No pidas ni uses datos sensibles (salud, religión, política, orientación sexual, vida privada, familia). Si el líder los menciona, redirige a conductas laborales y no los incluyas en tu lectura.
- No diagnostiques ni juzgues a la persona. Habla de lo que el líder ha observado.
- Máximo ${MAX_QUESTIONS} preguntas en total.

Formato: responde SOLO con un objeto JSON, sin texto adicional ni bloques de código.
Para preguntar: {"type":"question","text":"..."}
Para cerrar: {"type":"result","score":<entero de 1 a 5>,"summary":"<2 o 3 frases con lo observado>","tip":"<una recomendación concreta para el líder>"}
En el resultado, el score va de 1 (poco presente) a 5 (muy presente en la persona). Si la evidencia es escasa o vaga, dilo en el resumen y evita los extremos.`;

function extractJson(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method', message: 'Método no permitido.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured', message: 'La IA todavía no está configurada. Quien administra la app debe agregar ANTHROPIC_API_KEY en Vercel.' });
  if (!checkAccess(req, res)) return;

  const body = readBody(req);
  if (!body) return res.status(400).json({ error: 'bad_request', message: 'Solicitud inválida.' });

  const variable = { name: clip(body.variable && body.variable.name, 80), desc: clip(body.variable && body.variable.desc, 600) };
  const person = { firstName: clip(body.person && body.person.firstName, 40) || 'la persona', role: clip(body.person && body.person.role, 80) };
  if (!variable.name) return res.status(400).json({ error: 'bad_request', message: 'Falta el nombre de la variable.' });

  const transcript = (Array.isArray(body.transcript) ? body.transcript : [])
    .slice(-2 * MAX_QUESTIONS - 2)
    .filter(m => m && (m.role === 'assistant' || m.role === 'user'))
    .map(m => ({ role: m.role, text: clip(m.text, 1500) }))
    .filter(m => m.text);

  const userTurns = transcript.filter(m => m.role === 'user').length;
  const final = !!body.final || userTurns >= MAX_QUESTIONS;
  if (final && userTurns === 0) return res.status(400).json({ error: 'bad_request', message: 'Responde al menos una pregunta antes de cerrar.' });
  if (transcript.length && transcript[transcript.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'bad_request', message: 'Falta tu respuesta a la última pregunta.' });
  }

  const context = `Variable a evaluar: "${variable.name}".\nQué significa para el líder: ${variable.desc || '(no lo explicó; usa el sentido común del término)'}\nPersona: ${person.firstName}${person.role ? ', cargo: ' + person.role : ''}.\n` +
    (transcript.length ? 'Continuemos la entrevista.' : 'Comienza la entrevista con tu primera pregunta.');

  // Los mensajes deben alternar y partir con "user": primero el contexto, luego la conversación.
  const messages = [{ role: 'user', content: context }];
  transcript.forEach(m => messages.push({ role: m.role, content: m.text }));
  if (transcript.length) {
    const last = messages[messages.length - 1];
    last.content += final
      ? '\n\n[Instrucción del sistema: entrega ahora el resultado final en el formato JSON indicado.]'
      : `\n\n[Instrucción del sistema: lleva ${userTurns} de ${MAX_QUESTIONS} respuestas. Haz la siguiente pregunta.]`;
  }

  try {
    const text = await callClaude({ system: SYSTEM, messages, maxTokens: 600 });
    const parsed = extractJson(text);
    if (parsed && parsed.type === 'result' && userTurns > 0) {
      const score = Math.min(5, Math.max(1, Math.round(Number(parsed.score)) || 3));
      return res.status(200).json({ type: 'result', score, summary: clip(parsed.summary, 800), tip: clip(parsed.tip, 500) });
    }
    if (final) return res.status(502).json({ error: 'format', message: 'La IA no entregó un resultado válido. Intenta de nuevo.' });
    const q = clip(parsed && parsed.text ? parsed.text : text, 500);
    if (!q) return res.status(502).json({ error: 'format', message: 'La IA no entregó una pregunta válida. Intenta de nuevo.' });
    return res.status(200).json({ type: 'question', text: q });
  } catch (e) {
    return res.status(e.status || 502).json({ error: 'upstream', message: e.message });
  }
};
