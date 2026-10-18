import sys, os, soundfile as sf, json
from fatts import Voice, phonemize, load_lex
load_lex('lex.tsv')
voice=sys.argv[1]; outd=sys.argv[2]; length=float(sys.argv[3]) if len(sys.argv)>3 else 1.0
os.makedirs(outd,exist_ok=True)
v=Voice(f'tts/vits-piper-fa_IR-{voice}-medium'); meta=[]
for line in open('vo/lines.tsv',encoding='utf8'):
    k,t=line.rstrip('\n').split('\t'); ph=phonemize(t)
    a,sr=v.synth(ph,length=length,noise=0.6,noise_w=0.7)
    sf.write(f'{outd}/{k}.wav',a,sr); meta.append((k,len(a)/sr))
json.dump(meta,open(f'{outd}/meta.json','w'))
print(sum(d for _,d in meta))
