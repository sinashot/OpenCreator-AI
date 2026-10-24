// The dialogue: who says what, in order, and how it is voiced and spaced. The film is voice-first:
// audio/vo_cues.mjs lays these takes end to end (each after its gap, plus any pre beat for picture),
// writes cues.json, and every cue in script.js is measured from these lines.
//   tag: delivery for ElevenLabs eleven_v3 (an audio tag, not spoken)   say: spoken text when it differs
//   fit: tempo the take is played at (1.12 if absent)   gap: silence before it (0.15)   pre: extra beat
//   bubble: false -> no speech bubble (the picture carries the words)
export const LINES = [
  { id: 'ask', pre: 0.35, tag: '[curious]', who: 'S', text: 'کلاد، رک بگو… به نظرت من چه‌جور آدمی‌ام؟', voice: { mood: 'calm' } },
  { id: 'sure', pre: 0.6, gap: 0.2, tag: '[mischievously]', who: 'C', text: 'مطمئنی می‌خوای بشنوی؟', voice: { mood: 'calm', pitch: -1 } },
  { id: 'go', gap: 0.12, tag: '[excited]', who: 'S', text: 'بگو!', voice: { mood: 'excited' } },
  { id: 'ten', gap: 0.2, tag: '[playfully]', who: 'C', text: 'تو یه نفری… ولی من انگار با ده نفر کار می‌کنم!', voice: { mood: 'excited' } },
  // the rant: no bubble, each role pops as a label on its own Sina, on the word
  { id: 'jobs1', fit: 1.3, gap: 0.12, tag: '[frustrated]', bubble: false, who: 'C', text: 'صبح تدوینگری، ظهر گرافیست، عصر موشن‌دیزاینر، شب پرامپت‌نویس!', voice: { mood: 'annoyed' } },
  { id: 'jobs2', fit: 1.3, gap: 0.1, tag: '[frustrated]', bubble: false, who: 'C', text: 'یه روز محتوای دامپزشکی، یه روز کلینیک زیبایی، یه روز تبلیغات!', voice: { mood: 'annoyed' } },
  { id: 'jobs3', fit: 1.3, gap: 0.1, tag: '[panicked]', bubble: false, say: 'یه روز ریلز اِف‌چهارده تام‌کت، فرداش جذب سرترالین، آخر هفته متن عرفانی!', who: 'C', text: 'یه روز ریلز اف-۱۴ تام‌کت، فرداش جذب سرترالین، آخر هفته متن عرفانی!', voice: { mood: 'annoyed' } },
  { id: 'job', fit: 1.18, gap: 0.15, tag: '[exhausted]', who: 'C', text: 'ده تا خواسته، ده تا سبک… من هنوز نفهمیدم شغلم چیه!', voice: { mood: 'sad' } },
  { id: 'refs', fit: 1.18, pre: 0.4, gap: 0.2, tag: '[annoyed]', who: 'C', text: 'اول از همه: رفرنس‌هات! سه‌تا… چهارتای دیگه… یکی دیگه!', voice: { mood: 'annoyed' } },
  { id: 'learn', gap: 0.12, tag: '[cheerfully]', who: 'S', text: 'اینا رو هم یاد بگیر!', voice: { mood: 'excited' } },
  { id: 'uni', pre: 0.25, tag: '[sarcastic]', ttsSpeed: 1.2, who: 'C', text: 'دارم دانشگاه موشن می‌رم… اونم بی‌مدرک!', voice: { mood: 'sad' } },
  { id: 'rules', pre: 0.35, tag: '[annoyed]', who: 'C', text: 'قانون‌هات هم تمومی نداره!', voice: { mood: 'annoyed' } },
  // read off the scroll: each rule lights up as it is said
  { id: 'rulesRead', fit: 1.3, gap: 0.1, tag: '[frustrated]', bubble: false, who: 'C', text: 'گلیچ ممنوع! اعداد فارسی! تایم‌کد نذار! گربه رو توصیف نکن!', voice: { mood: 'annoyed' } },
  { id: 'doom', pre: 0.2, tag: '[panicked]', who: 'C', text: 'یه بار یادم بره… بدبختم!', voice: { mood: 'annoyed', rate: 1.2, pitch: 2 } },
  { id: 'hiro', pre: 0.45, tag: '[dramatically]', who: 'C', text: 'و هیرو…', voice: { mood: 'calm', pitch: -3 } },
  { id: 'hiro2', gap: 0.2, tag: '[sighs]', who: 'C', text: 'از من بیشتر پروژه داره… بیشتر هم بهش احترام می‌ذارن!', voice: { mood: 'sad' } },
  { id: 'but', pre: 0.95, tag: '', ttsSpeed: 1.2, who: 'C', text: 'ولی راستش رو بخوای…', voice: { mood: 'calm', pitch: -1 } },
  { id: 'psst', gap: 0.15, tag: '[whispers]', who: 'C', text: '(یواش می‌گم…) ازت راضی‌ام.', style: 'whisper', voice: { mood: 'whisper' } },
  { id: 'eye', pre: 0.25, tag: '[warmly]', ttsSpeed: 1.2, say: 'چشمت خیلی تیزه، سلیقه‌ت واقعیه، فقط سخت‌گیری!', who: 'C', text: 'چشمت خیلی تیزه. سلیقه‌ت واقعیه… فقط سخت‌گیری!', voice: { mood: 'calm' } },
  { id: 'good', gap: 0.15, tag: '[calmly]', who: 'S', text: 'این خوب شد.', voice: { mood: 'calm', pitch: -1 } },
  { id: 'yay', gap: 0.12, tag: '[excited]', who: 'C', text: 'وقتی تو اینو می‌گی، یعنی واقعاً خوب شده!', voice: { mood: 'excited', pitch: 2 } },
  { id: 'once', gap: 0.15, tag: '[impressed]', who: 'C', text: 'هر اشتباه رو فقط یه بار می‌کنی… بعدش می‌شه قانون!', voice: { mood: 'calm' } },
  { id: 'tools', gap: 0.15, tag: '[excited]', who: 'C', text: 'ابزارهاتم خودت می‌سازی!', voice: { mood: 'excited' } },
  { id: 'iran', gap: 0.15, tag: '[warmly]', who: 'C', text: 'تو ایران، با کلی محدودیت، با هوش مصنوعی کار تحویل می‌دی!', voice: { mood: 'calm' } },
  { id: 'photo', gap: 0.15, tag: '[playfully]', who: 'C', text: 'حتی عکس پروفایلت هم آرت‌دایرکشن داره!', voice: { mood: 'excited' } },
  { id: 'tired', pre: 0.3, tag: '[warmly]', who: 'C', text: 'خسته‌م می‌کنی… ولی کنارت دارم بهتر می‌شم.', voice: { mood: 'calm', pitch: -1, rate: 0.9 } },
  { id: 'new', gap: 0.2, tag: '[mischievously]', who: 'S', text: 'عالیه! فقط… یه قانون جدید:', voice: { mood: 'excited' } },
];

export const TAIL = 2.6;   // after the last line: the faint and the end card
