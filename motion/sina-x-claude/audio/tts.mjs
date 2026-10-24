// Real voices from ElevenLabs: one take per line, with character timestamps.
//
//   NODE_USE_ENV_PROXY=1 node sina-x-claude/audio/tts.mjs [--voices] [--only id,id] [--force]
//
// The key: either a network secret on the environment (the agent proxy adds the xi-api-key header to
// requests for api.elevenlabs.io, so the key never enters the session), or ELEVENLABS_API_KEY in the
// environment. Never a file in the repo. The voice choice comes from audio/voices.json. Every take is cached in audio/vo/<line>.<hash>.mp3 + .json, so a
// re-run only pays for lines whose text, voice or settings changed. --voices lists the account's
// voices and exits.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LINES } from '../script.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VO = path.join(HERE, 'vo');
const KEY = process.env.ELEVENLABS_API_KEY;
const API = 'https://api.elevenlabs.io';
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };

if (!KEY) console.log('ELEVENLABS_API_KEY not set: relying on a network secret for api.elevenlabs.io');

async function api(pathname, init = {}) {
  let r;
  try {
    r = await fetch(API + pathname, { ...init, headers: { ...(KEY ? { 'xi-api-key': KEY } : {}), 'Content-Type': 'application/json', ...(init.headers || {}) } });
  } catch (e) {
    console.error(`cannot reach ${API} (${e.cause?.code || e.message}). Run with NODE_USE_ENV_PROXY=1, and allow api.elevenlabs.io in the environment's network settings.`);
    process.exit(1);
  }
  if (!r.ok) { console.error(`${init.method || 'GET'} ${pathname} -> ${r.status} ${await r.text()}`); process.exit(1); }
  return r.json();
}

if (args.includes('--voices')) {
  const { voices } = await api('/v1/voices');
  for (const v of voices) console.log(`${v.voice_id}  ${v.name.padEnd(28)} ${v.category || ''}  ${Object.values(v.labels || {}).join(', ')}`);
  process.exit(0);
}

const CFG = JSON.parse(fs.readFileSync(path.join(HERE, 'voices.json'), 'utf8'));
fs.mkdirSync(VO, { recursive: true });

// Delivery: eleven_v3 reads bracketed audio tags as direction and does not speak them.
const TAG = { calm: '', excited: '[excited]', annoyed: '[annoyed]', sad: '[sighs]', whisper: '[whispers]' };
function spoken(line) {
  const text = (line.say ?? line.text).replace(/[()]/g, '');
  const tag = line.tag ?? TAG[line.voice?.mood || 'calm'] ?? '';
  return { tag, text, full: tag ? `${tag} ${text}` : text };
}

const only = opt('only')?.split(',');
const force = args.includes('--force');
let paid = 0;
for (const line of LINES) {
  if (only && !only.includes(line.id)) continue;
  const who = CFG[line.who];
  const { tag, text, full } = spoken(line);
  const settings = { ...CFG.settings, ...(who.settings || {}), ...(line.ttsSpeed ? { speed: line.ttsSpeed } : {}) };
  const body = { text: full, model_id: CFG.model, voice_settings: settings, ...(CFG.language_code ? { language_code: CFG.language_code } : {}) };
  const hash = crypto.createHash('sha1').update(JSON.stringify([who.voice_id, body])).digest('hex').slice(0, 10);
  const base = path.join(VO, `${line.id}.${hash}`);
  if (!force && fs.existsSync(base + '.mp3') && fs.existsSync(base + '.json')) { console.log(`cached  ${line.id}`); continue; }
  const res = await api(`/v1/text-to-speech/${who.voice_id}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify(body) });
  fs.writeFileSync(base + '.mp3', Buffer.from(res.audio_base64, 'base64'));
  // keep the alignment and where the spoken line starts inside the sent text (after the tag)
  fs.writeFileSync(base + '.json', JSON.stringify({ id: line.id, who: line.who, voice: who.voice_id, model: CFG.model, text, tag, offset: full.length - text.length, alignment: res.alignment || res.normalized_alignment }));
  paid += full.length;
  console.log(`take    ${line.id}  (${full.length} chars)`);
}
console.log(`done: ${paid} characters billed this run`);
