import numpy as np, json, sys, wave
d=sys.argv[1]; SR=48000; DUR=75.0; N=int(SR*DUR)
sfx=json.load(open(d+'/sfx.json')); model=json.load(open(d+'/model.json'))
T_OFF=model['T_OFF']; O=model['heart'][0]
rng=np.random.default_rng(3)
amb=np.zeros(N); fx=np.zeros(N)
def add(buf,sig,t,g=1.0):
    i=int(t*SR)
    if i<0 or i>=N: return
    n=min(len(sig),N-i); buf[i:i+n]+=sig[:n]*g
def env(n,a,dcy):
    tt=np.arange(n)/SR; return np.minimum(1,tt/max(a,1e-4))*np.exp(-tt/dcy)
def lp(x,a):  # one-pole lowpass, a in (0,1)
    y=np.empty_like(x);p=0.0
    for i in range(len(x)): p+=a*(x[i]-p); y[i]=p
    return y
def noise(n): return rng.standard_normal(n)
def hp(x,a=0.9):
    return x-lp(x,1-a)
def boom(dur=1.6,f0=70,f1=32):
    n=int(dur*SR);tt=np.arange(n)/SR;f=f1+(f0-f1)*np.exp(-tt*6);ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-tt*2.2)+0.4*lp(noise(n),0.05)*np.exp(-tt*5)
def heartbeat(g=1.0):
    n=int(0.5*SR);tt=np.arange(n)/SR
    def th(f): return np.sin(2*np.pi*f*tt)*np.exp(-tt*28)
    b=th(55)+0.6*th(80); out=np.zeros(int(0.8*SR)); out[:n]+=b; s=int(0.24*SR); out[s:s+n]+=0.7*b[:len(out)-s]
    return out*g
# --- ambient drone: grows as breathing fails
t=np.arange(N)/SR
inten=np.clip((t-2)/62,0,1)**1.5
drone=(np.sin(2*np.pi*55*t)+0.6*np.sin(2*np.pi*55.4*t)+0.35*np.sin(2*np.pi*82.6*t+0.3*np.sin(2*np.pi*0.1*t)))
dark=lp(noise(N),0.004)*3
amb+= (0.25+0.75*inten)*(0.5*drone+0.6*dark)*np.clip(t/1.5,0,1)
# high tension tone after alcohol
amb+=0.12*np.clip((t-40)/10,0,1)*np.sin(2*np.pi*880*t+2*np.sin(2*np.pi*5.5*t))*(t<T_OFF)
amb*= (t<T_OFF+0.4)
# --- heartbeat: 72 bpm → slowing → stops at T_OFF
tb=O
while tb<T_OFF:
    bpm=72 if tb<38 else (72-(tb-38)*1.1)
    bpm=max(38,bpm)
    g=0.55 if tb<5 else 0.28+0.4*np.clip((tb-55)/10,0,1)
    add(amb,heartbeat(g),tb); tb+=60/bpm
# one soft beat on the end card
add(amb,heartbeat(0.45),T_OFF+6.3)
# --- events
for e in sfx:
    kind,tt=e[0],e[1]
    if kind=='impact': add(fx,boom(1.2,90,40),tt,0.8)
    elif kind=='boom': add(fx,boom(2.5,60,25),tt,1.2); n=int(1.5*SR); add(fx,hp(noise(n),0.6)*env(n,0.001,0.25),tt,0.4)
    elif kind=='glitch':
        n=int(0.35*SR); x=noise(n); x=np.round(x*3)/3; x*=np.repeat(rng.random(n//600+1)>0.4,600)[:n]; add(fx,hp(x,0.7)*env(n,0.001,0.15),tt,0.22)
    elif kind=='rain':
        for i in range(40): n=int(0.05*SR); add(fx,np.sin(2*np.pi*(1800+rng.random()*2500)*np.arange(n)/SR)*env(n,0.001,0.01),tt+0.3+rng.random()*1.2,0.08)
    elif kind=='whoosh':
        n=int(0.6*SR); x=hp(noise(n),0.8); e2=np.sin(np.pi*np.arange(n)/n)**2; add(fx,x*e2,tt-0.3,0.18)
    elif kind=='pop': n=int(0.1*SR); add(fx,np.sin(2*np.pi*660*np.arange(n)/SR)*env(n,0.002,0.03),tt,0.18)
    elif kind=='tick': n=int(0.15*SR); add(fx,np.sin(2*np.pi*1200*np.arange(n)/SR)*env(n,0.001,0.04),tt,0.25); add(fx,boom(0.6,100,50),tt,0.4)
    elif kind=='ding': n=int(1.0*SR); tt2=np.arange(n)/SR; add(fx,(np.sin(2*np.pi*880*tt2)+0.3*np.sin(2*np.pi*1760*tt2))*env(n,0.003,0.3),tt,0.12)
    elif kind=='sting': n=int(1.6*SR); tt2=np.arange(n)/SR; add(fx,(np.sin(2*np.pi*233*tt2)+np.sin(2*np.pi*247*tt2)+0.5*np.sin(2*np.pi*349*tt2))*env(n,0.01,0.6),tt,0.18)
    elif kind=='slow': n=int(2.5*SR); tt2=np.arange(n)/SR; f=300*np.exp(-tt2*1.2)+40; add(fx,np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.02,1.0),tt,0.25)
    elif kind=='rise': n=int(2.0*SR); x=hp(noise(n),0.85)*(np.arange(n)/n)**2; add(fx,x,tt,0.25)
    elif kind=='splash': n=int(0.7*SR); add(fx,lp(noise(n),0.3)*env(n,0.002,0.12),tt,0.35); add(fx,boom(0.5,140,60),tt,0.3)
    elif kind=='pulse': n=int(0.06*SR); add(fx,np.sin(2*np.pi*1500*np.arange(n)/SR)*env(n,0.001,0.012),tt,0.04)
    elif kind=='breath':
        a,r=e[2],e[3]; dur=min(2.2,max(0.6,60/max(r,0.5)*0.45)); n=int(dur*SR); x=lp(noise(n),0.08); e2=np.sin(np.pi*np.arange(n)/n)**1.5
        add(fx,x*e2,tt,0.35*a)
    elif kind=='flat':
        n=int(2.4*SR); tt2=np.arange(n)/SR; add(fx,np.sin(2*np.pi*1000*tt2)*np.minimum(1,tt2/0.01),tt,0.16)
    elif kind=='crt': n=int(0.4*SR); tt2=np.arange(n)/SR; add(fx,np.sin(2*np.pi*(9000*np.exp(-tt2*8)+60)*tt2)*env(n,0.001,0.12),tt,0.15)
def wav(p,x):
    x=np.clip(x,-1,1); dd=(x*32767).astype(np.int16)
    with wave.open(p,'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(dd.tobytes())
amb/=np.abs(amb).max()+1e-9; fx/=max(1,np.abs(fx).max())
wav(d+'/amb.wav',amb*0.9); wav(d+'/fx.wav',fx*0.9); print('ok')
