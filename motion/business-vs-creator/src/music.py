import numpy as np, json, sys, wave
SR=44100; DUR=30.0; N=int(SR*DUR)
out_dir=sys.argv[1]; VO=0.42; CUT1=23.5; CUT2=27.85
sfx=json.load(open(out_dir+'/sfx.json'))
rng=np.random.default_rng(7)
mus=np.zeros(N); fx=np.zeros(N)
def add(buf,sig,t,g=1.0):
    i=int(t*SR); 
    if i>=N: return
    n=min(len(sig),N-i); buf[i:i+n]+=sig[:n]*g
def env(n,a=0.005,d=0.2):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
def kick():
    n=int(.45*SR);t=np.arange(n)/SR;f=45+90*np.exp(-t*30);ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)+0.3*np.sin(ph)*np.exp(-t*40)
def noise(n): return rng.standard_normal(n)
def hp(x,a=0.85):
    y=np.zeros_like(x);p=0;px=0
    for i in range(len(x)): p=a*(p+x[i]-px);px=x[i];y[i]=p
    return y
HAT=hp(noise(int(.06*SR)),0.95)*env(int(.06*SR),0.001,0.015)
CLAP=hp(noise(int(.25*SR)),0.8)*env(int(.25*SR),0.002,0.06)
def tone(freq,dur,dec,harm=(1,.5,.25)):
    n=int(dur*SR);t=np.arange(n)/SR
    s=sum(h*np.sin(2*np.pi*freq*(i+1)*t) for i,h in enumerate(harm))
    return s*env(n,0.004,dec)
# Dastgah Shur on D (D Eb* F G A Bb C) — Eb a quarter-tone flat
def hz(semi): return 146.83*2**(semi/12)
SHUR=[0,1.5,3,5,7,8,10,12]
beat=0.5
KICK=kick()
for b in range(int(DUR/beat)):
    t=b*beat
    if t>=29.0: break
    if t>=CUT2-0.5 and t<CUT2: continue           # breath before the final hit
    drop = t>=8.0
    if drop or b%2==0: add(mus,KICK,t,0.9 if drop else 0.55)
    if t>=4.0: add(mus,HAT,t+beat/2,0.25)
    if drop:
        add(mus,HAT,t+beat/4,0.12);add(mus,HAT,t+3*beat/4,0.12)
        if b%2==1: add(mus,CLAP,t,0.45)
# bass + pluck pattern per bar
roots=[0,0,-2,-4]  # D D C Bb
pat=[0,2,4,7,4,2,5,4]
for bar in range(15):
    t0=bar*2.0
    r=roots[bar%4]
    if t0>=4.0 and t0<29:
        for q in range(4):
            add(mus,tone(hz(r-24),0.45,0.18,(1,.3)),t0+q*0.5+0.25,0.55)
    for i in range(16 if t0>=8 else 8):
        tt=t0+i*(0.125 if t0>=8 else 0.25)
        if tt>=29 or (CUT2-0.5<=tt<CUT2): continue
        deg=pat[i%8]; semi=SHUR[deg%8]+r*0 + (12 if (bar%4==3 and i%8>5) else 0)
        add(mus,tone(hz(semi),0.4,0.09,(1,.35,.12,.05)),tt,0.16)
# pad
t=np.arange(N)/SR
pad=sum(np.sin(2*np.pi*hz(s-12)*t+0.3*np.sin(2*np.pi*0.2*t)) for s in (0,7,12))*0.05
mus+=pad*np.clip(t/3,0,1)*np.clip((29.8-t)/1.5,0,1)
# sfx
for kind,tt in sfx:
    if kind=='pop': add(fx,tone(880,0.12,0.03,(1,.4)),tt,0.35)
    elif kind=='tick': add(fx,hp(noise(int(.03*SR)),0.9)*env(int(.03*SR),0.001,0.008),tt,0.5)
    elif kind in('blip','blip2'): add(fx,tone(1320 if kind=='blip' else 1760,0.08,0.02,(1,)),tt,0.18)
    elif kind=='ding': add(fx,tone(1046.5,1.2,0.35,(1,.0,.3,.0,.1)),tt,0.3)
    elif kind=='whoosh':
        n=int(.5*SR);x=hp(noise(n),0.7);e=np.sin(np.pi*np.arange(n)/n)**2;add(fx,x*e,tt-0.25,0.25)
    elif kind in('rise','rise2'):
        d=2.9 if kind=='rise' else 1.6;n=int(d*SR);x=hp(noise(n),0.9);e=(np.arange(n)/n)**2;add(fx,x*e,tt,0.18)
    elif kind=='impact':
        add(fx,kick(),tt,1.0);n=int(1.5*SR);add(fx,hp(noise(n),0.6)*env(n,0.002,0.4),tt,0.25)
def wav(path,x):
    x=np.clip(x,-1,1);d=(x*32767).astype(np.int16)
    with wave.open(path,'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(d.tobytes())
mus/=np.abs(mus).max()+1e-9; fx/=max(1,np.abs(fx).max())
wav(out_dir+'/music.wav',mus*0.9); wav(out_dir+'/fx.wav',fx*0.9)
print('ok')
