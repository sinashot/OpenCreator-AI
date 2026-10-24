// The acting, camera and moods, measured from the voice. lines.js holds the dialogue; the takes are laid
// end to end by audio/vo_cues.mjs into cues.json, and every time here is a cue: T(id) a line's start,
// TE(id) its end, W(id, i) the onset of its i-th word. Change a take and the whole film follows it.
// Positions: Claude stands at x = -1.35, Sina at x = +1.35 (Sina is on the right: he speaks first).
import CUES from './cues.json' with { type: 'json' };
import { LINES as RAW } from './lines.js';

export const CX = -1.35, SX = 1.35;
export const DURATION = CUES.duration;
export const CUE = CUES;
const L = (id) => { const c = CUES.lines[id]; if (!c) throw new Error(`no cue for ${id}`); return c; };
export const T = (id, off = 0) => L(id).t0 + off;
export const TE = (id, off = 0) => L(id).t1 + off;
export const W = (id, i, off = 0) => (L(id).words[i] ?? L(id).t0) + off;
// the dialogue with its place in the film (d: how long its bubble may stay)
export const LINES = RAW.map((l) => ({ ...l, t: T(l.id), d: TE(l.id) - T(l.id) + 0.12 }));

// The ten Sinas of the rant: [line, word index the role is named on, role, time of day, icon]
export const ROLES = [
  ['jobs1', 1, 'تدوینگر', 'صبح', 'clapper'], ['jobs1', 3, 'گرافیست', 'ظهر', 'pencil'],
  ['jobs1', 5, 'موشن‌دیزاینر', 'عصر', 'keyframe'], ['jobs1', 7, 'پرامپت‌نویس', 'شب', 'laptop'],
  ['jobs2', 3, 'محتوای دامپزشکی', 'یه روز', 'paw'], ['jobs2', 7, 'کلینیک زیبایی', 'یه روز', 'sparkle'],
  ['jobs2', 10, 'تبلیغات', 'یه روز', 'megaphone'], ['jobs3', 3, 'ریلز اف-۱۴', 'یه روز', 'jet'],
  ['jobs3', 7, 'جذب سرترالین', 'فرداش', 'pill'], ['jobs3', 11, 'متن عرفانی', 'آخر هفته', 'quill'],
].map(([id, w, role, when, icon]) => ({ t: W(id, w, -0.08), role, when, icon }));

// ---------------------------------------------------------------- acting
// Poses: joint angles (see sets/lego.js REST). arm*: raise forward; out*: away from the body.
// Hands stay in front of the face and torso, never through them: a minifig arm swings at the shoulder.
export const POSES = {
  idle: {},
  talk1: { armR: 0.9, outR: 0.12, armL: 0.25 },
  talk2: { armL: 0.95, outL: 0.22, armR: 0.25 },
  open: { armR: 1.0, armL: 1.0, outR: 0.45, outL: 0.45 },
  point: { armR: 1.55, outR: -0.05 },
  pointUp: { armR: 2.7, outR: 0.1, armL: 0.2 },
  shrug: { armR: 0.55, armL: 0.55, outR: 0.8, outL: 0.8, headZ: 0.2 },
  think: { armR: 1.6, outR: -0.22, headZ: -0.12, headX: -0.12 },
  hips: { armR: 0.35, armL: 0.35, outR: 0.55, outL: 0.55 },
  headHands: { armR: 2.75, armL: 2.75, outR: 0.36, outL: 0.36 },
  cheer: { armR: 2.95, armL: 2.95, outR: 0.6, outL: 0.6, headX: -0.2 },
  whisper: { armR: 1.62, outR: -0.08, lean: 0.12, headX: 0.04 },
  clapOpen: { armR: 1.35, armL: 1.35, outR: 0.38, outL: 0.38 },
  clapShut: { armR: 1.35, armL: 1.35, outR: -0.18, outL: -0.18 },
  crossArms: { armR: 0.8, armL: 0.8, outR: -0.42, outL: -0.42, headX: -0.06 },
  bow: { lean: 0.5, headX: 0.25, armR: 0.15, armL: 0.15 },
  hold: { armR: 2.15, armL: 2.15, outR: -0.1, outL: -0.1, headX: -0.1 },
  holdLow: { armR: 0.7, armL: 0.7, outR: -0.1, outL: -0.1 },
  holdNew: { armR: 1.45, armL: 1.45, outR: -0.04, outL: -0.04, headX: 0.06 },
  meditate: { legR: 1.5, legL: 1.5, armR: 0.45, armL: 0.45, outR: 0.8, outL: 0.8 },
  cover: { armR: 2.6, armL: 2.6, outR: 0.15, outL: 0.15, lean: 0.2, headX: 0.2 },
  nod: { headX: 0.18 },
  lookUp: { headX: -0.35 },
  faint: { bodyX: -1.52, armR: 0.35, armL: 0.35, outR: 0.2, outL: 0.2 },
  thumbFloor: { bodyX: -1.52, armR: 2.6, outR: 0.0, armL: 0.35 },
  cupRaise: { armR: 1.0, outR: 0.05, armL: 0.25 },
  cupClink: { armR: 1.22, outR: -0.2, armL: 0.25 },
  run: { lean: 0.25, armR: 1.2, armL: -0.4 },
};

const jobGestures = (id, ws, poses) => ws.map((w, i) => [W(id, w, -0.05), poses[i % poses.length], 0.12]);

// [t, pose, blendSeconds]. Characters animate on twos (12 poses/s at 24 fps): the brick-film look.
export const POSE_C = [
  [0, 'idle'], [TE('ask', -0.05), 'think', 0.18], [T('sure'), 'talk1', 0.18], [TE('sure', 0.05), 'hips', 0.25],
  [T('ten'), 'open', 0.2], [W('ten', 7, -0.05), 'point', 0.15],
  ...jobGestures('jobs1', [1, 3, 5, 7], ['talk1', 'talk2', 'open', 'point']),
  [T('jobs2'), 'headHands', 0.12], ...jobGestures('jobs2', [3, 7, 10], ['open', 'shrug', 'headHands']),
  [W('jobs3', 3, -0.1), 'pointUp', 0.15], [W('jobs3', 6, -0.15), 'cover', 0.1], [W('jobs3', 8, -0.1), 'meditate', 0.3],
  [T('job', 0.05), 'idle', 0.12], [W('job', 3), 'headHands', 0.15], [W('job', 6), 'shrug', 0.18],
  [T('refs', -0.4), 'hips', 0.12], [T('refs'), 'talk1', 0.18], [W('refs', 3), 'pointUp', 0.15], [W('refs', 5, -0.2), 'cover', 0.12],
  [T('uni', -0.35), 'cheer', 0.08], [W('uni', 1), 'open', 0.2], [W('uni', 4), 'shrug', 0.25],
  [T('rules', -0.3), 'hips', 0.15], [T('rules', 0.05), 'hold', 0.2], [T('doom', -0.15), 'headHands', 0.12],
  [T('hiro', -0.4), 'idle', 0.3], [T('hiro'), 'talk1', 0.25], [T('hiro2'), 'point', 0.25], [W('hiro2', 5), 'talk2', 0.25],
  [TE('hiro2', 0.1), 'idle', 0.06], [T('psst', -0.12), 'whisper', 0.3], [TE('psst', -0.5), 'idle', 0.4],
  [T('eye'), 'point', 0.25], [W('eye', 3), 'talk1', 0.25], [T('good', -0.1), 'idle', 0.2],
  [T('yay'), 'talk2', 0.15], [W('yay', 4, -0.05), 'cheer', 0.08], [TE('yay', 0.05), 'open', 0.25],
  [T('once'), 'talk1', 0.2], [W('once', 7), 'open', 0.2], [T('tools'), 'point', 0.2],
  [T('iran'), 'talk1', 0.25], [W('iran', 5), 'open', 0.25],
  [TE('iran', -0.55), 'clapOpen', 0.08], [TE('iran', -0.4), 'clapShut', 0.06], [TE('iran', -0.25), 'clapOpen', 0.06], [TE('iran', -0.1), 'clapShut', 0.06], [TE('iran', 0.05), 'clapOpen', 0.06],
  [T('photo', -0.15), 'holdLow', 0.2], [TE('photo', 0.25), 'idle', 0.25],
  [T('tired', -0.25), 'cupRaise', 0.2], [W('tired', 5, -0.15), 'cupClink', 0.15], [W('tired', 5, 0.5), 'cupRaise', 0.2],
  [W('new', 1), 'idle', 0.15], [W('new', 3), 'cover', 0.1], [W('new', 4, 0.2), 'faint', 0.45], [DURATION - 1.5, 'thumbFloor', 0.3],
];
export const POSE_S = [
  [0, 'run'], [0.45, 'idle', 0.15], [T('ask', 0.1), 'talk2', 0.2], [W('ask', 3), 'open', 0.25], [TE('ask'), 'idle', 0.3],
  [T('go'), 'nod', 0.1], [TE('go'), 'idle', 0.15],
  [W('ten', 7), 'shrug', 0.25], [T('jobs1'), 'crossArms', 0.3], [W('jobs3', 3), 'lookUp', 0.2], [W('jobs3', 6), 'idle', 0.2], [T('job'), 'crossArms', 0.3],
  [T('refs', -0.4), 'idle', 0.15], [W('refs', 4), 'lookUp', 0.2], [T('learn'), 'pointUp', 0.15], [TE('learn', 0.3), 'idle', 0.25],
  [T('rules'), 'idle', 0.2], [W('rulesRead', 1, -0.05), 'point', 0.08], [W('rulesRead', 2), 'crossArms', 0.25],
  [T('hiro', -0.4), 'idle', 0.3], [W('hiro2', 7, -0.1), 'bow', 0.3], [TE('hiro2', 0.2), 'idle', 0.25],
  [W('eye', 0, 0.3), 'crossArms', 0.2], [T('good'), 'nod', 0.12], [TE('good'), 'crossArms', 0.15],
  [W('yay', 4), 'open', 0.2], [T('once'), 'idle', 0.3], [W('photo', 2), 'crossArms', 0.25], [TE('photo', 0.2), 'idle', 0.25],
  [T('tired', -0.25), 'cupRaise', 0.2], [W('tired', 5, -0.15), 'cupClink', 0.15], [W('tired', 5, 0.5), 'cupRaise', 0.2],
  [T('new'), 'talk1', 0.2], [W('new', 1, -0.1), 'holdNew', 0.2], [W('new', 4, 0.1), 'holdLow', 0.15], [TE('new', 0.4), 'shrug', 0.2], [DURATION - 1.2, 'idle', 0.4],
];

// Root motion: [t, [x, z, rotY], blend]. Positive rotY turns toward +x.
export const ROOT_C = [
  [0, [CX, 0, 0.35]], [T('ask', 0.2), [CX, 0, 0.55], 0.3], [TE('ask'), [CX, 0, 0.3], 0.2], [T('ten'), [CX, 0, 0.45], 0.3],
  [T('jobs2'), [CX, 0, 0.2], 0.2], [W('jobs3', 6, -0.15), [CX - 0.5, 0, 0.6], 0.15], [T('job'), [CX, 0, 0.35], 0.4],
  [T('rules'), [CX, 0, 0.12], 0.3], [T('hiro', -0.4), [CX, 0, 0.9], 0.4], [TE('hiro2', 0.1), [CX, 0, 0.12], 0.05],
  [T('eye'), [CX, 0, 0.55], 0.4], [T('yay'), [CX, 0, 0.3], 0.3], [T('once'), [CX, 0, 0.45], 0.3],
  [T('tired', -0.3), [-1.05, 0, 0.62], 0.5], [T('new'), [-1.1, 0, 0.5], 0.4],
];
export const ROOT_S = [
  [0, [SX + 3.2, 0, -1.2]], [0.05, [SX, 0, -0.4], 0.4], [T('ten'), [SX, 0, -0.45], 0.3],
  [T('rules'), [SX, 0, -0.35], 0.3], [T('hiro', -0.4), [SX, 0, -0.9], 0.4], [TE('hiro2', 0.3), [SX, 0, -0.5], 0.4],
  [T('eye', -0.1), [SX, 0, -0.35], 0.4], [T('tired', -0.3), [1.05, 0, -0.62], 0.5], [T('new'), [1.15, 0, -0.4], 0.4],
];
// Hops: [t, height, duration]
export const HOPS_C = [[T('ten', -0.05), 0.3, 0.3], [W('jobs3', 6, -0.15), 0.6, 0.4], [T('uni', -0.35), 1.0, 0.45], [W('yay', 4, -0.05), 1.1, 0.55], [W('yay', 6), 0.5, 0.35]];
export const HOPS_S = [[0.0, 0.7, 0.45], [T('good', -0.05), 0.15, 0.2]];
// Float (levitation): [t0, t1, height]: the mystical line art
export const FLOAT_C = [[W('jobs3', 8, -0.1), T('job', 0.05), 1.0]];

// Faces: [t, expression]. Discrete eyes/mouth switch on a blink; the rest blends.
export const EXPR = {
  neutral: { eyes: 'open', mouth: 'smile' },
  happy: { eyes: 'open', mouth: 'grin', browY: 0.3 },
  joy: { eyes: 'happy', mouth: 'grin', browY: 0.5 },
  smug: { eyes: 'open', mouth: 'smirk', brow: 0.2, browY: -0.1, lookX: 0.5 },
  think: { eyes: 'open', mouth: 'flat', brow: -0.3, browY: 0.4, lookY: -0.9, lookX: -0.5 },
  curious: { eyes: 'open', mouth: 'smile', browY: 0.45 },
  annoyed: { eyes: 'open', mouth: 'frown', brow: 0.9, browY: -0.2 },
  angry: { eyes: 'open', mouth: 'frown', brow: 1.25 },
  frazzled: { eyes: 'spiral', mouth: 'wavy', brow: -0.6, browY: 0.4 },
  shock: { eyes: 'wide', mouth: 'o', browY: 0.9 },
  deadpan: { eyes: 'flat', mouth: 'flat' },
  sneakyL: { eyes: 'side', mouth: 'smirk', brow: 0.3, lookX: -1 },
  sneakyR: { eyes: 'side', mouth: 'smirk', brow: 0.3, lookX: 1 },
  shy: { eyes: 'closed', mouth: 'tiny', blush: 1, browY: 0.3 },
  love: { eyes: 'heart', mouth: 'grin', blush: 0.7, browY: 0.4 },
  starry: { eyes: 'star', mouth: 'grin', browY: 0.5 },
  proud: { eyes: 'open', mouth: 'smirk', brow: 0.1, browY: -0.05 },
  calm: { eyes: 'closed', mouth: 'smile', browY: 0.2 },
  confused: { eyes: 'open', mouth: 'wavy', brow: -0.5, browY: 0.35 },
  sad: { eyes: 'open', mouth: 'frown', brow: -0.85, browY: 0.4 },
  cry: { eyes: 'open', mouth: 'frown', brow: -0.9, browY: 0.45, tear: 1 },
  ko: { eyes: 'x', mouth: 'wavy' },
  lookUp: { eyes: 'open', mouth: 'o', browY: 0.5, lookY: -1 },
};
export const EXPR_C = [
  [0, 'neutral'], [T('ask'), 'curious'], [TE('ask', -0.05), 'shock'], [TE('ask', 0.15), 'think'], [T('sure'), 'smug'],
  [T('ten'), 'happy'], [W('ten', 7), 'shock'], [T('jobs1'), 'annoyed'], [T('jobs2'), 'frazzled'], [W('jobs3', 3, -0.1), 'starry'],
  [W('jobs3', 6, -0.15), 'shock'], [W('jobs3', 8, -0.1), 'calm'], [T('job'), 'frazzled'], [W('job', 6), 'confused'],
  [T('refs', -0.4), 'angry'], [W('refs', 3), 'annoyed'], [W('refs', 5, -0.2), 'shock'], [W('refs', 7, 0.1), 'ko'], [T('uni', -0.35), 'deadpan'], [W('uni', 4), 'sad'],
  [T('rules', -0.3), 'annoyed'], [W('rulesRead', 0), 'annoyed'], [W('rulesRead', 1, -0.05), 'shock'], [W('rulesRead', 2), 'annoyed'], [T('doom', -0.15), 'frazzled'],
  [T('hiro', -0.4), 'neutral'], [T('hiro'), 'lookUp'], [T('hiro2'), 'sad'], [W('hiro2', 7), 'cry'], [TE('hiro2', 0.1), 'deadpan'],
  [T('but'), 'sneakyL'], [W('but', 2), 'sneakyR'], [T('psst', -0.12), 'smug'], [W('psst', 2), 'neutral'], [W('psst', 3), 'shy'],
  [T('eye'), 'happy'], [T('good'), 'curious'], [T('yay'), 'happy'], [W('yay', 4, -0.05), 'love'], [T('once'), 'happy'], [W('once', 9), 'starry'],
  [T('tools'), 'happy'], [T('iran'), 'neutral'], [W('iran', 5), 'happy'], [TE('iran', -0.55), 'joy'], [T('photo', -0.15), 'smug'],
  [T('tired', -0.25), 'happy'], [T('tired'), 'calm'], [W('tired', 3), 'happy'], [W('tired', 5, -0.15), 'joy'],
  [T('new'), 'curious'], [W('new', 3), 'shock'], [W('new', 4, 0.2), 'ko'],
];
export const EXPR_S = [
  [0, 'curious'], [TE('ask'), 'neutral'], [T('sure'), 'curious'], [T('go'), 'happy'], [T('ten'), 'proud'], [W('ten', 7), 'smug'],
  [T('jobs2'), 'happy'], [W('jobs3', 3), 'lookUp'], [W('jobs3', 6, -0.15), 'shock'], [W('jobs3', 8), 'curious'], [T('job'), 'smug'],
  [T('refs', -0.4), 'shock'], [T('refs', 0.3), 'neutral'], [T('learn'), 'happy'], [T('uni'), 'smug'], [T('rules'), 'proud'],
  [W('rulesRead', 1, -0.05), 'angry'], [W('rulesRead', 2), 'proud'], [T('doom'), 'smug'], [T('hiro'), 'happy'], [W('hiro2', 7), 'calm'], [TE('hiro2', 0.3), 'neutral'],
  [T('eye'), 'curious'], [W('eye', 0, 0.4), 'proud'], [T('good'), 'smug'], [T('yay'), 'proud'], [W('yay', 4), 'joy'], [T('once'), 'curious'],
  [T('tools'), 'happy'], [T('iran'), 'proud'], [T('photo'), 'smug'], [T('tired'), 'calm'], [W('tired', 5, -0.15), 'joy'],
  [T('new'), 'smug'], [W('new', 4, 0.5), 'shock'], [TE('new', 0.6), 'confused'],
];
// Head turns layered on top of the pose: [t, [headY, headX], blend]
export const LOOK_C = [
  [0, [0, 0]], [T('ask'), [0.35, 0], 0.2], [TE('ask'), [0, 0.1], 0.2], [T('sure'), [0.35, 0], 0.2], [T('ten'), [0.25, 0], 0.3],
  [W('jobs3', 3, -0.1), [0.6, -0.4], 0.12], [W('jobs3', 4, 0.3), [-0.4, -0.35], 0.4], [W('jobs3', 6, -0.15), [0.4, 0.2], 0.2], [T('job'), [0, 0], 0.3],
  [W('refs', 3), [0, -0.45], 0.25], [W('refs', 6), [0.3, 0], 0.2], [T('rules'), [0, 0.3], 0.3], [T('doom'), [0, 0], 0.2],
  [T('hiro'), [0.2, -0.15], 0.3], [TE('hiro2', 0.1), [-0.12, 0], 0.05], [T('but'), [-0.5, 0], 0.15], [W('but', 2), [0.5, 0], 0.15],
  [T('psst'), [-0.1, 0], 0.2], [T('eye'), [0.25, 0], 0.3], [T('photo', -0.15), [-0.1, 0], 0.3], [T('tired'), [0.3, 0], 0.3],
];
export const LOOK_S = [
  [0, [0, 0]], [T('ask'), [-0.3, 0], 0.3], [T('ten'), [-0.2, 0], 0.3], [T('jobs1'), [0.55, -0.1], 0.3], [T('jobs3'), [-0.2, -0.3], 0.3],
  [W('jobs3', 4, 0.3), [-0.7, -0.3], 0.4], [T('job'), [-0.3, 0], 0.3], [W('refs', 4), [-0.4, -0.2], 0.3], [T('rules'), [-0.3, 0.3], 0.4],
  [W('rulesRead', 1, -0.05), [-0.6, 0.2], 0.06], [W('rulesRead', 2), [-0.3, 0.3], 0.3], [T('doom'), [-0.3, 0], 0.3],
  [T('hiro'), [0.2, -0.2], 0.3], [TE('hiro2', 0.3), [-0.3, 0], 0.3], [T('eye'), [-0.2, 0], 0.3], [T('new'), [-0.3, 0], 0.3],
];

// ---------------------------------------------------------------- camera
// [t, [px, py, pz], [tx, ty, tz], blend, ease]   ease: 'io' (inOut) | 'out' | 'cut'
export const CAM = [
  [0, [0.4, 4.2, 19.5], [0.2, 3.1, 0]],
  [0.05, [0.15, 3.7, 15.5], [0.1, 3.25, 0], 3.2, 'io'],
  [TE('ask', -0.1), [-1.0, 3.75, 9.8], [-1.25, 3.4, 0], 0.5, 'out'],
  [T('go', -0.1), [0.6, 3.6, 10.5], [0.9, 3.2, 0], 0.4, 'out'],
  [T('ten'), [0.1, 3.9, 15.5], [0.0, 3.5, 0], 0.5, 'out'],
  [W('ten', 7, -0.15), [0.3, 5.0, 23.5], [0.25, 4.0, -1.8], 1.0, 'out'],
  [T('jobs2'), [0.0, 5.1, 22.5], [0.0, 4.1, -1.8], 4.0, 'io'],
  [W('jobs3', 8, -0.2), [-0.6, 4.4, 16.0], [-0.9, 4.0, -0.5], 0.8, 'io'],
  [T('job'), [-1.0, 4.5, 18.0], [-1.2, 3.0, 0], 0.5, 'out'],
  [T('refs', -0.4), [0.0, 4.0, 17.0], [-0.1, 3.3, 0], 0.18, 'out'],
  [W('refs', 4, -0.3), [-0.6, 4.4, 15.0], [-1.0, 3.2, 0], 0.8, 'io'],
  [T('uni', -0.35), [-1.1, 3.9, 11.0], [-1.25, 3.6, 0], 0.4, 'out'],
  [T('rules', -0.3), [-0.6, 4.4, 13.0], [-1.0, 3.2, 0], 0.4, 'out'],
  [T('rulesRead', -0.35), [-0.7, 7.6, 10.2], [-1.1, 0.2, 2.6], 1.0, 'io'],
  [T('doom', -0.2), [-1.1, 3.8, 10.0], [-1.25, 3.5, 0], 0.35, 'out'],
  [T('hiro', -0.45), [0.0, 4.6, 17.5], [0.0, 3.6, -1.5], 0.9, 'io'],
  [T('hiro2'), [0.3, 4.4, 15.0], [0.0, 3.8, -1.8], 3.6, 'io'],
  [TE('hiro2', 0.1), [-1.33, 3.6, 4.9], [-1.33, 3.45, 0], 0, 'cut'],
  [T('but', -0.05), [-1.2, 3.7, 7.5], [-1.3, 3.4, 0], 0.5, 'out'],
  [T('psst', -0.1), [-1.15, 3.55, 5.6], [-1.3, 3.45, 0], 2.0, 'io'],
  [T('eye', -0.1), [0.9, 3.7, 9.0], [1.25, 3.3, 0], 0.6, 'out'],
  [T('yay'), [0.1, 4.0, 16.0], [0.0, 3.4, 0], 0.5, 'out'],
  [T('once'), [0.0, 3.9, 13.0], [0.0, 3.4, 0], 0.6, 'io'],
  [T('tools', -0.05), [0.3, 5.0, 15.5], [0.25, 2.5, 1.0], 0.5, 'io'],
  [T('iran'), [0.0, 4.2, 16.5], [0.0, 3.5, 0], 0.6, 'io'],
  [T('photo', -0.15), [-0.9, 3.9, 8.6], [-1.0, 3.5, 0], 0.5, 'out'],
  [T('tired', -0.3), [0.0, 3.8, 12.0], [0.0, 3.4, 0], 0.6, 'io'],
  [W('tired', 5, -0.35), [0.0, 3.9, 8.8], [0.0, 3.6, 0], 0.4, 'out'],
  [T('new', -0.1), [0.2, 3.9, 12.0], [0.3, 3.2, 0], 0.5, 'io'],
  [W('new', 4, 0.2), [-0.2, 4.4, 14.5], [-0.4, 2.6, 0], 0.5, 'io'],
  [TE('new', 0.25), [-0.2, 11.0, 11.5], [-0.5, 3.6, -1.6], 2.3, 'io'],
];
// Camera shakes: [t, amplitude (world units), decay seconds]
export const SHAKES = [[0.45, 0.06, 0.25], [T('refs', -0.4), 0.22, 0.35], [T('rules', -0.33), 0.16, 0.3], [T('hiro', -0.43), 0.1, 0.4],
  [W('refs', 7, 0.1), 0.1, 0.3], [T('uni', -0.35), 0.08, 0.2], [W('yay', 4, 0.5), 0.08, 0.3], [W('new', 4, 0.75), 0.16, 0.4]];

// Background mood: [t, mood, blend]
export const MOOD = [
  [0, 'studio'], [T('refs', -0.42), 'angry', 0.15], [T('hiro', -0.45), 'spot', 0.5], [TE('hiro2', 0.1), 'deadpan', 0.0], [T('but', -0.05), 'spot', 0.3],
  [T('eye', -0.1), 'warm', 0.6], [T('tired', -0.3), 'golden', 0.8], [TE('new', 0.2), 'end', 1.2],
];
