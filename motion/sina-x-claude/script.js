// The film's one source of truth: dialogue, acting, camera and events, in seconds.
// film.js reads it to animate; audio/voice.mjs reads LINES (through syllables.js) to voice it.
// Positions: Claude stands at x = -1.35, Sina at x = +1.35 (Sina is on the right: he speaks first).

export const DURATION = 88;
export const CX = -1.35, SX = 1.35;

// ---------------------------------------------------------------- dialogue
// who: C (Claude) | S (Sina); t start, d on-screen duration; style: normal | whisper | small
// voice: { pitch (semitones), rate (x), mood: calm | excited | annoyed | whisper | sad } (babble voice)
// tag: delivery for ElevenLabs v3 (an audio tag, not spoken); say: what is spoken when it differs
export const LINES = [
  { id: 'ask', tag: '[curious]', who: 'S', t: 0.7, d: 3.2, text: 'کلاد، رک بگو… به نظرت من چه‌جور آدمی‌ام؟', voice: { mood: 'calm' } },
  { id: 'sure', tag: '[mischievously]', who: 'C', t: 5.5, d: 1.7, text: 'مطمئنی می‌خوای بشنوی؟', voice: { mood: 'calm', pitch: -1 } },
  { id: 'go', tag: '[excited]', who: 'S', t: 6.9, d: 0.9, text: 'بگو!', voice: { mood: 'excited' } },
  { id: 'five', tag: '[playfully]', who: 'C', t: 7.8, d: 3.2, text: 'تو یه نفری… ولی انگار با پنج نفر کار می‌کنم!', voice: { mood: 'excited' } },
  { id: 'keep', tag: '[frustrated]', who: 'C', t: 13.6, d: 3.2, text: 'مشکل اینه که منم باید پابه‌پات این‌همه آدم بشم!', voice: { mood: 'annoyed', rate: 1.1 } },
  { id: 'f14', tag: '[excited]', ttsSpeed: 1.2, say: 'یه روز ریلز اِف چهارده تامکت!', who: 'C', t: 17.5, d: 2.3, text: 'یه روز ریلز اف-۱۴ تامکت…', voice: { mood: 'excited' } },
  { id: 'pill', tag: '[excited]', who: 'C', t: 19.8, d: 2.3, text: 'فرداش انیمیشن جذب سرترالین!', voice: { mood: 'excited' } },
  { id: 'zen', tag: '[excited]', ttsSpeed: 1.2, who: 'C', t: 22.1, d: 2.6, text: 'آخر هفته هم متن عرفانی با لاین‌آرت!', voice: { mood: 'calm', pitch: -2 } },
  { id: 'job', tag: '[confused]', who: 'C', t: 24.7, d: 2.5, text: 'من هنوز نفهمیدم شغلم دقیقاً چیه!', voice: { mood: 'sad' } },
  { id: 'refs', tag: '[annoyed]', who: 'C', t: 28.6, d: 2.2, text: 'رفرنس‌هات تمومی نداره!', voice: { mood: 'annoyed' } },
  { id: 'learn', tag: '[cheerfully]', who: 'S', t: 30.9, d: 1.8, text: 'اینا رو هم یاد بگیر!', voice: { mood: 'excited' } },
  { id: 'uni', tag: '[sarcastic]', ttsSpeed: 1.2, who: 'C', t: 33.7, d: 2.6, text: 'دارم دانشگاه موشن می‌رم… اونم بی‌مدرک!', voice: { mood: 'sad' } },
  { id: 'rules', tag: '[annoyed]', who: 'C', t: 36.4, d: 1.9, text: 'قانون‌هات هم تمومی نداره!', voice: { mood: 'annoyed' } },
  { id: 'doom', tag: '[panicked]', who: 'C', t: 40.4, d: 2.2, text: 'یه بار یادم بره… بدبختم!', voice: { mood: 'annoyed', rate: 1.2, pitch: 2 } },
  { id: 'hiro', tag: '[dramatically]', who: 'C', t: 43.3, d: 1.4, text: 'و هیرو…', voice: { mood: 'calm', pitch: -3 } },
  { id: 'hiro2', tag: '[sighs]', who: 'C', t: 44.8, d: 3.0, text: 'از من بیشتر پروژه داره… بیشتر هم بهش احترام می‌ذارن!', voice: { mood: 'sad' } },
  { id: 'but', tag: '', ttsSpeed: 1.2, who: 'C', t: 49.1, d: 1.6, text: 'ولی راستش رو بخوای…', voice: { mood: 'calm', pitch: -1 } },
  { id: 'psst', tag: '[whispers]', who: 'C', t: 50.8, d: 2.8, text: '(یواش می‌گم…) ازت راضی‌ام.', style: 'whisper', voice: { mood: 'whisper' } },
  { id: 'eye', tag: '[warmly]', ttsSpeed: 1.2, say: 'چشمت خیلی تیزه، سلیقه‌ت واقعیه، فقط سخت‌گیری!', who: 'C', t: 53.8, d: 3.2, text: 'چشمت خیلی تیزه. سلیقه‌ت واقعیه… فقط سخت‌گیری!', voice: { mood: 'calm' } },
  { id: 'good', tag: '[calmly]', who: 'S', t: 57.2, d: 1.4, text: 'این خوب شد.', voice: { mood: 'calm', pitch: -1 } },
  { id: 'yay', tag: '[excited]', who: 'C', t: 58.5, d: 2.6, text: 'وقتی تو اینو می‌گی، یعنی واقعاً خوب شده!', voice: { mood: 'excited', pitch: 2 } },
  { id: 'once', tag: '[impressed]', who: 'C', t: 61.3, d: 3.2, text: 'هر اشتباه رو فقط یه بار می‌کنی… بعدش می‌شه قانون!', voice: { mood: 'calm' } },
  { id: 'tools', tag: '[excited]', ttsSpeed: 1.2, who: 'C', t: 64.7, d: 3.0, text: 'ابزارت رو هم خودت می‌سازی: پلنر با تایمر پومودورو!', voice: { mood: 'excited' } },
  { id: 'iran', tag: '[warmly]', who: 'C', t: 67.9, d: 3.6, text: 'تو ایران، با کلی محدودیت، با هوش مصنوعی کار تحویل می‌دی!', voice: { mood: 'calm' } },
  { id: 'rare', tag: '[softly]', who: 'C', t: 71.7, d: 1.8, text: 'کم کسی این کارو می‌کنه.', voice: { mood: 'calm', pitch: -1 } },
  { id: 'photo', tag: '[playfully]', who: 'C', t: 73.5, d: 2.3, text: 'حتی عکس پروفایلت هم آرت‌دایرکشن داره!', voice: { mood: 'excited' } },
  { id: 'sum', tag: '', ttsSpeed: 1.1, who: 'C', t: 75.9, d: 1.1, text: 'خلاصه‌ش؟', voice: { mood: 'calm' } },
  { id: 'tired', tag: '[warmly]', who: 'C', t: 77.1, d: 3.1, text: 'خسته‌م می‌کنی… ولی کنارت دارم بهتر می‌شم.', voice: { mood: 'calm', pitch: -1, rate: 0.9 } },
  { id: 'new', tag: '[mischievously]', who: 'S', t: 80.5, d: 2.1, text: 'عالیه! فقط… یه قانون جدید:', voice: { mood: 'excited' } },
];

// ---------------------------------------------------------------- acting
// Poses: joint angles (see sets/lego.js REST). arm*: raise forward; out*: away from the body.
export const POSES = {
  idle: {},
  talk1: { armR: 0.9, outR: 0.12, armL: 0.25 },
  talk2: { armL: 0.95, outL: 0.22, armR: 0.25 },
  open: { armR: 1.0, armL: 1.0, outR: 0.45, outL: 0.45 },
  point: { armR: 1.55, outR: -0.1 },
  pointUp: { armR: 2.7, outR: 0.1, armL: 0.2 },
  shrug: { armR: 0.55, armL: 0.55, outR: 0.8, outL: 0.8, headZ: 0.2 },
  think: { armR: 2.05, outR: -0.38, headZ: -0.12, headX: -0.15 },
  hips: { armR: 0.35, armL: 0.35, outR: 0.55, outL: 0.55 },
  headHands: { armR: 2.75, armL: 2.75, outR: 0.36, outL: 0.36 },
  cheer: { armR: 2.95, armL: 2.95, outR: 0.6, outL: 0.6, headX: -0.2 },
  whisper: { armR: 2.1, outR: -0.28, lean: 0.14, headX: 0.05 },
  clapOpen: { armR: 1.35, armL: 1.35, outR: 0.38, outL: 0.38 },
  clapShut: { armR: 1.35, armL: 1.35, outR: -0.32, outL: -0.32 },
  crossArms: { armR: 0.8, armL: 0.8, outR: -0.52, outL: -0.52, headX: -0.06 },
  bow: { lean: 0.5, headX: 0.25, armR: 0.15, armL: 0.15 },
  hold: { armR: 2.15, armL: 2.15, outR: -0.14, outL: -0.14, headX: -0.1 },
  holdLow: { armR: 0.75, armL: 0.75, outR: -0.14, outL: -0.14 },
  holdOne: { armR: 1.35, outR: -0.05, armL: 0.2 },
  meditate: { legR: 1.5, legL: 1.5, armR: 0.45, armL: 0.45, outR: 0.8, outL: 0.8 },
  cover: { armR: 2.6, armL: 2.6, outR: 0.15, outL: 0.15, lean: 0.2, headX: 0.2 },
  nod: { headX: 0.18 },
  lookUp: { headX: -0.35 },
  faint: { bodyX: -1.52, armR: 0.35, armL: 0.35, outR: 0.2, outL: 0.2 },
  thumbFloor: { bodyX: -1.52, armR: 2.6, outR: 0.0, armL: 0.35 },
  cupRaise: { armR: 1.75, outR: -0.05, armL: 0.25 },
  cupClink: { armR: 1.7, outR: -0.32, armL: 0.25 },
  run: { lean: 0.25, armR: 1.2, armL: -0.4 },
};

// [t, pose, blendSeconds]. Characters animate on twos (12 poses/s at 24 fps): the brick-film look.
export const POSE_C = [
  [0, 'idle'], [1.0, 'idle'], [3.9, 'idle', 0.08], [4.1, 'think', 0.18], [5.5, 'talk1', 0.18], [6.3, 'hips', 0.25],
  [7.8, 'open', 0.2], [9.0, 'point', 0.18], [10.4, 'idle', 0.3], [13.6, 'talk2', 0.2], [14.6, 'headHands', 0.15], [16.4, 'shrug', 0.2],
  [17.4, 'talk1', 0.2], [17.7, 'pointUp', 0.15], [19.2, 'idle', 0.2], [20.1, 'cover', 0.1], [20.8, 'talk2', 0.2],
  [22.2, 'meditate', 0.35], [24.5, 'idle', 0.1], [24.9, 'shrug', 0.18], [26.6, 'idle', 0.3],
  [27.5, 'hips', 0.12], [28.6, 'talk1', 0.18], [29.3, 'pointUp', 0.15], [30.3, 'hips', 0.2], [31.7, 'cover', 0.12],
  [33.5, 'cheer', 0.08], [33.9, 'open', 0.2], [35.0, 'shrug', 0.25],
  [36.3, 'hold', 0.2], [40.3, 'headHands', 0.12], [42.6, 'idle', 0.3], [43.3, 'talk1', 0.25], [44.8, 'point', 0.25], [46.2, 'talk2', 0.25],
  [47.8, 'idle', 0.06], [49.1, 'idle'], [50.7, 'whisper', 0.3], [52.7, 'idle', 0.4],
  [53.8, 'point', 0.25], [55.4, 'talk1', 0.25], [57.0, 'idle', 0.2], [58.5, 'talk2', 0.15], [59.1, 'cheer', 0.08], [60.6, 'open', 0.25],
  [61.3, 'talk1', 0.2], [62.9, 'open', 0.2], [64.7, 'point', 0.2], [65.9, 'talk2', 0.2], [67.9, 'talk1', 0.25], [69.4, 'open', 0.25],
  [70.6, 'clapOpen', 0.1], [70.8, 'clapShut', 0.06], [71.0, 'clapOpen', 0.06], [71.2, 'clapShut', 0.06], [71.4, 'clapOpen', 0.06], [71.6, 'bow', 0.25], [72.8, 'idle', 0.3],
  [73.3, 'holdLow', 0.2], [75.6, 'idle', 0.25], [76.0, 'cupRaise', 0.2], [77.1, 'cupRaise'], [79.2, 'cupClink', 0.15], [79.9, 'cupRaise', 0.2],
  [81.6, 'idle', 0.15], [82.2, 'cover', 0.1], [82.7, 'faint', 0.45], [85.4, 'thumbFloor', 0.3],
];
export const POSE_S = [
  [0, 'run'], [0.6, 'idle', 0.15], [0.8, 'talk2', 0.2], [2.3, 'open', 0.25], [3.9, 'idle', 0.3], [6.9, 'nod', 0.1], [7.2, 'idle', 0.15], [7.4, 'nod', 0.1], [7.7, 'idle', 0.2],
  [9.0, 'shrug', 0.25], [10.4, 'idle', 0.3], [13.6, 'crossArms', 0.25], [16.6, 'idle', 0.3],
  [17.7, 'lookUp', 0.2], [19.0, 'idle', 0.2], [22.2, 'lookUp', 0.3], [24.5, 'idle', 0.2],
  [27.5, 'idle'], [29.2, 'lookUp', 0.2], [30.9, 'pointUp', 0.15], [32.7, 'idle', 0.25], [36.4, 'idle'], [38.9, 'point', 0.08], [39.6, 'idle', 0.3],
  [40.4, 'crossArms', 0.25], [42.6, 'idle', 0.3], [46.2, 'bow', 0.3], [47.6, 'idle', 0.25],
  [53.8, 'idle'], [54.2, 'crossArms', 0.2], [57.1, 'nod', 0.12], [57.5, 'crossArms', 0.12], [58.5, 'crossArms'], [59.2, 'open', 0.2], [60.6, 'idle', 0.3],
  [64.7, 'idle'], [67.9, 'idle'], [73.3, 'idle'], [73.8, 'crossArms', 0.25], [75.6, 'idle', 0.25], [76.0, 'cupRaise', 0.2], [79.2, 'cupClink', 0.15], [79.9, 'cupRaise', 0.2],
  [80.5, 'talk1', 0.2], [81.3, 'holdOne', 0.12], [83.0, 'shrug', 0.2], [84.6, 'idle', 0.4],
];

// Root motion: [t, [x, z, rotY], blend]. Positive rotY turns toward +x.
export const ROOT_C = [
  [0, [CX, 0, 0.35]], [0.6, [CX, 0, 0.55], 0.3], [3.9, [CX, 0, 0.3], 0.2], [7.8, [CX, 0, 0.5], 0.3],
  [13.6, [CX, 0, 0.2], 0.3], [17.4, [CX, 0, 0.25], 0.3], [20.0, [CX - 0.5, 0, 0.6], 0.15], [21.2, [CX, 0, 0.3], 0.4],
  [27.4, [CX, 0, 0.3]], [36.2, [CX, 0, 0.12], 0.3], [42.8, [CX, 0, 0.9], 0.4], [47.8, [CX, 0, 0.12], 0.05],
  [53.8, [CX, 0, 0.55], 0.4], [58.4, [CX, 0, 0.25], 0.3], [61.2, [CX, 0, 0.45], 0.3], [71.6, [CX, 0, 0.7], 0.3], [72.8, [CX, 0, 0.3], 0.3],
  [77.6, [CX + 0.55, 0, 0.75], 0.6], [80.4, [CX + 0.4, 0, 0.55], 0.4], [82.6, [CX + 0.2, 0, 0.45], 0.3],
];
export const ROOT_S = [
  [0, [SX + 3.2, 0, -1.2]], [0.6, [SX, 0, -0.4], 0.5], [7.8, [SX, 0, -0.45], 0.3], [17.4, [SX, 0, -0.5], 0.3],
  [36.4, [SX, 0, -0.35], 0.3], [42.8, [SX, 0, -0.9], 0.4], [47.6, [SX, 0, -0.5], 0.4],
  [53.8, [SX, 0, -0.35], 0.4], [77.6, [SX - 0.55, 0, -0.75], 0.6], [80.4, [SX - 0.4, 0, -0.6], 0.4],
];
// Hops: [t, height, duration]
export const HOPS_C = [[3.85, 0.25, 0.25], [7.75, 0.35, 0.3], [20.0, 0.6, 0.4], [24.45, 0.0, 0.0], [33.45, 1.0, 0.45], [59.1, 1.1, 0.55], [60.0, 0.5, 0.35]];
export const HOPS_S = [[0.05, 0.7, 0.55], [57.05, 0.15, 0.2]];
// Float (levitation): [t0, t1, height]
export const FLOAT_C = [[22.2, 24.45, 1.15]];

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
  [0, 'neutral'], [0.7, 'curious'], [3.9, 'shock'], [4.1, 'think'], [5.5, 'smug'],
  [7.8, 'happy'], [10.4, 'neutral'], [13.6, 'annoyed'], [15.2, 'frazzled'], [17.0, 'neutral'],
  [17.6, 'starry'], [19.6, 'neutral'], [20.05, 'shock'], [20.9, 'curious'], [22.2, 'calm'], [24.5, 'confused'], [26.8, 'neutral'],
  [27.5, 'angry'], [29.2, 'annoyed'], [31.6, 'shock'], [32.9, 'ko'], [33.5, 'deadpan'], [34.6, 'sad'],
  [36.4, 'annoyed'], [37.4, 'think'], [40.3, 'frazzled'], [42.7, 'neutral'], [43.3, 'lookUp'], [44.8, 'sad'], [46.6, 'cry'],
  [47.8, 'deadpan'], [49.1, 'sneakyL'], [49.7, 'sneakyR'], [50.3, 'smug'], [50.8, 'neutral'], [52.3, 'shy'],
  [53.8, 'happy'], [57.0, 'curious'], [58.5, 'happy'], [59.1, 'love'], [61.2, 'happy'], [63.0, 'starry'], [64.5, 'happy'],
  [67.9, 'neutral'], [69.0, 'happy'], [71.6, 'joy'], [73.3, 'smug'], [75.6, 'happy'], [77.1, 'calm'], [78.3, 'happy'], [79.6, 'joy'],
  [80.5, 'curious'], [81.6, 'shock'], [82.7, 'ko'],
];
export const EXPR_S = [
  [0, 'curious'], [3.9, 'neutral'], [5.5, 'curious'], [6.9, 'happy'], [9.0, 'proud'], [13.6, 'smug'], [15.2, 'happy'],
  [17.6, 'lookUp'], [19.2, 'neutral'], [20.05, 'shock'], [21.0, 'neutral'], [22.2, 'curious'], [24.6, 'neutral'],
  [27.5, 'shock'], [28.4, 'neutral'], [30.9, 'happy'], [32.9, 'smug'], [36.4, 'proud'], [38.9, 'angry'], [39.6, 'proud'],
  [40.4, 'smug'], [43.3, 'happy'], [46.2, 'calm'], [47.6, 'neutral'],
  [53.8, 'curious'], [54.2, 'proud'], [57.1, 'smug'], [58.5, 'proud'], [59.2, 'joy'], [61.2, 'curious'], [64.6, 'happy'],
  [67.8, 'proud'], [70.4, 'happy'], [73.6, 'smug'], [75.6, 'happy'], [77.1, 'calm'], [79.4, 'joy'],
  [80.5, 'smug'], [83.0, 'shock'], [84.2, 'confused'],
];
// Head turns layered on top of the pose: [t, [headY, headX], blend]
export const LOOK_C = [
  [0, [0, 0]], [0.6, [0.35, 0], 0.2], [4.1, [0, 0], 0.2], [5.5, [0.35, 0], 0.2], [9.2, [0.4, -0.1], 0.3],
  [13.6, [0, 0], 0.3], [17.7, [0.6, -0.4], 0.12], [18.3, [0.1, -0.4], 0.5], [18.9, [-0.5, -0.35], 0.4], [19.4, [0, 0], 0.3],
  [20.2, [0.5, 0.2], 0.2], [21.2, [0, 0], 0.3], [27.5, [0.3, 0], 0.2], [29.2, [0, -0.45], 0.25], [30.3, [0.3, 0], 0.2],
  [36.4, [0, 0], 0.2], [37.0, [0, 0.35], 0.4], [40.3, [0, 0], 0.2], [43.3, [0.2, -0.15], 0.3], [47.8, [-0.12, 0], 0.05],
  [49.1, [-0.5, 0], 0.15], [49.7, [0.5, 0], 0.15], [50.3, [-0.1, 0], 0.2], [53.8, [0.2, 0], 0.3], [73.3, [-0.1, 0], 0.3], [75.6, [0.3, 0], 0.3],
];
export const LOOK_S = [
  [0, [0, 0]], [0.8, [-0.3, 0], 0.3], [9.0, [0.6, 0], 0.3], [10.4, [0, 0], 0.3], [13.6, [-0.25, 0], 0.3],
  [17.7, [-0.2, -0.3], 0.3], [18.8, [-0.7, -0.3], 0.4], [19.4, [-0.3, 0], 0.3], [29.2, [-0.4, -0.2], 0.3], [36.4, [-0.3, 0.3], 0.4],
  [38.9, [-0.6, 0.2], 0.06], [39.6, [-0.3, 0.3], 0.3], [40.4, [-0.3, 0], 0.3], [43.3, [0.2, -0.2], 0.3], [47.6, [-0.3, 0], 0.3],
  [53.8, [-0.2, 0], 0.3],
];

// ---------------------------------------------------------------- camera
// [t, [px, py, pz], [tx, ty, tz], blend, ease]   ease: 'io' (inOut) | 'out' | 'cut'
export const CAM = [
  [0, [0.4, 4.2, 19.5], [0.2, 3.1, 0]],
  [0.1, [0.15, 3.7, 16.0], [0.1, 3.25, 0], 3.6, 'io'],
  [3.9, [-1.0, 3.75, 9.8], [-1.25, 3.4, 0], 0.5, 'out'],
  [6.8, [0.6, 3.6, 10.5], [0.9, 3.2, 0], 0.5, 'out'],
  [7.8, [0.5, 4.6, 21.5], [0.45, 3.7, -1.2], 1.4, 'out'],
  [13.6, [-1.1, 3.8, 14.0], [-1.2, 3.3, 0], 0.7, 'out'],
  [17.3, [-0.4, 3.9, 16.5], [-0.6, 3.9, -1], 0.6, 'out'],
  [19.7, [-0.9, 3.5, 13.0], [-0.8, 3.0, 0], 0.5, 'out'],
  [22.0, [-1.1, 4.2, 13.5], [-1.2, 3.8, 0], 1.0, 'io'],
  [24.6, [-1.2, 3.6, 9.5], [-1.3, 3.5, 0], 0.4, 'out'],
  [27.4, [0.0, 4.0, 17.0], [-0.1, 3.3, 0], 0.18, 'out'],
  [31.4, [-0.6, 4.4, 15.0], [-1.0, 3.2, 0], 0.8, 'io'],
  [33.4, [-1.1, 3.9, 11.0], [-1.25, 3.6, 0], 0.4, 'out'],
  [36.3, [-0.6, 4.4, 13.0], [-1.0, 3.2, 0], 0.5, 'out'],
  [37.1, [-0.7, 7.6, 10.2], [-1.1, 0.2, 2.6], 1.5, 'io'],
  [40.3, [-1.1, 3.8, 10.0], [-1.25, 3.5, 0], 0.35, 'out'],
  [42.7, [0.0, 4.6, 17.5], [0.0, 3.6, -1.5], 1.0, 'io'],
  [44.7, [0.3, 4.4, 15.0], [0.0, 3.8, -1.8], 3.0, 'io'],
  [47.8, [-1.33, 3.6, 4.9], [-1.33, 3.45, 0], 0, 'cut'],
  [48.9, [-1.2, 3.7, 7.5], [-1.3, 3.4, 0], 0.5, 'out'],
  [50.6, [-1.15, 3.55, 5.6], [-1.3, 3.45, 0], 2.4, 'io'],
  [53.6, [0.9, 3.7, 9.0], [1.25, 3.3, 0], 0.6, 'out'],
  [58.4, [0.1, 4.0, 16.0], [0.0, 3.4, 0], 0.6, 'out'],
  [61.2, [0.0, 3.9, 13.0], [0.0, 3.4, 0], 0.6, 'io'],
  [64.6, [0.3, 5.0, 15.5], [0.25, 2.5, 1.0], 0.6, 'io'],
  [67.8, [0.0, 4.2, 16.5], [0.0, 3.5, 0], 0.6, 'io'],
  [71.6, [-0.8, 3.8, 11.0], [-1.0, 3.2, 0], 0.6, 'io'],
  [73.3, [-0.9, 3.9, 8.6], [-1.0, 3.7, 0], 0.5, 'out'],
  [75.8, [0.0, 3.8, 12.5], [0.0, 3.4, 0], 0.7, 'io'],
  [79.3, [0.0, 3.9, 8.5], [0.0, 3.7, 0], 0.5, 'out'],
  [80.4, [0.1, 3.9, 13.5], [0.0, 3.3, 0], 0.6, 'io'],
  [82.6, [-0.2, 4.4, 14.5], [-0.4, 2.6, 0], 0.6, 'io'],
  [84.4, [-0.2, 11.0, 11.5], [-0.5, 3.6, -1.6], 3.2, 'io'],
];
// Camera shakes: [t, amplitude (world units), decay seconds]
export const SHAKES = [[0.6, 0.06, 0.25], [27.5, 0.22, 0.35], [32.9, 0.1, 0.3], [33.5, 0.08, 0.2], [42.9, 0.05, 0.5], [59.3, 0.08, 0.3], [83.3, 0.16, 0.4]];

// Background mood: [t, mood, blend]
export const MOOD = [
  [0, 'studio'], [27.4, 'angry', 0.15], [42.7, 'spot', 0.5], [47.8, 'deadpan', 0.0], [49.0, 'spot', 0.3],
  [53.6, 'warm', 0.6], [75.8, 'golden', 0.8], [84.2, 'end', 1.2],
];
