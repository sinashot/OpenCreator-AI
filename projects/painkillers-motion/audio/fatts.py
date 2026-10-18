import ctypes, re, json, sys, numpy as np, espeakng_loader, onnxruntime as ort, soundfile as sf
_lib=ctypes.cdll.LoadLibrary(espeakng_loader.get_library_path())
_lib.espeak_Initialize(0x02,0,espeakng_loader.get_data_path().encode(),0)
_lib.espeak_SetVoiceByName(b'fa')
_lib.espeak_TextToPhonemes.restype=ctypes.c_char_p
def esp(w):
    p=ctypes.c_char_p(w.encode()); out=[]
    pp=ctypes.pointer(p)
    while p.value:
        r=_lib.espeak_TextToPhonemes(pp,1,0x02)
        if r: out.append(r.decode())
    return ' '.join(out)
LEX={}
def load_lex(path):
    for line in open(path,encoding='utf8'):
        line=line.strip()
        if not line or line.startswith('#'): continue
        w,p=line.split('\t'); LEX[w]=p
PUN={'،':',','؛':';','؟':'?','!':'!','.':'.',':':':','…':'.'}
def strip_marks(w): return re.sub('[ً-ْ]','',w)
def phonemize(text, debug=False):
    text=text.replace('...','…')
    toks=re.findall(r'[^\s،؛؟!\.:…]+|[،؛؟!\.:…]',text)
    out=''; dbg=[]
    for t in toks:
        if t in PUN:
            out=out.rstrip()+PUN[t]+' '; continue
        ph=LEX.get(t) or LEX.get(strip_marks(t)) or esp(t)
        dbg.append((t,ph)); out+=ph+' '
    if debug: return out.strip(), dbg
    return out.strip()
class Voice:
    def __init__(s,d):
        import glob
        s.cfg=json.load(open(glob.glob(d+'/*.onnx.json')[0])); s.m=ort.InferenceSession(glob.glob(d+'/*.onnx')[0])
        s.map=s.cfg['phoneme_id_map']
    def ids(s,ph):
        ids=[*s.map['^'],*s.map['_']]
        for ch in ph:
            if ch in s.map: ids+= [*s.map[ch],*s.map['_']]
        ids+=s.map['$']; return ids
    def synth(s,ph,length=1.0,noise=0.667,noise_w=0.8):
        ids=np.array([s.ids(ph)],dtype=np.int64)
        a=s.m.run(None,{'input':ids,'input_lengths':np.array([ids.shape[1]],dtype=np.int64),'scales':np.array([noise,length,noise_w],dtype=np.float32)})[0]
        return a.squeeze().astype(np.float32), s.cfg['audio']['sample_rate']
if __name__=='__main__':
    load_lex('lex.tsv') if len(sys.argv)>1 else None
    for line in open('vo/lines.tsv',encoding='utf8'):
        k,t=line.rstrip('\n').split('\t'); ph,d=phonemize(t,True)
        print(k,' | '.join(f'{a}={b}' for a,b in d))
