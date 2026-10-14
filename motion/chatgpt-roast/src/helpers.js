// ---------- easing ----------
function bez(x1,y1,x2,y2){return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<10;i++){const f=3*x1*t*(1-t)**2+3*x2*t*t*(1-t)+t**3-x;const d=3*x1*(1-t)**2+6*(x2-x1)*t*(1-t)+3*(1-x2)*t*t;if(Math.abs(d)<1e-6)break;t=Math.min(1,Math.max(0,t-f/d));}return 3*y1*t*(1-t)**2+3*y2*t*t*(1-t)+t**3;};}
const EO=bez(.16,1,.3,1),EI=bez(.7,0,.84,0),EIO=bez(.65,0,.35,1);
const k=(t,a,d,e=EO)=>e(Math.min(1,Math.max(0,(t-a)/d)));
const L=(a,b,p)=>a+(b-a)*p;
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
function rnd(i){const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function mix(c1,c2,p){const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);const r=Math.round(L(a>>16,b>>16,p)),g=Math.round(L(a>>8&255,b>>8&255,p)),bl=Math.round(L(a&255,b&255,p));return `rgb(${r},${g},${bl})`;}

// ---------- primitives ----------
function rr(x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function font(sz,wg){ctx.font=`${wg} ${sz}px Vaz`;ctx.direction='rtl';ctx.textBaseline='alphabetic';}
function txt(s,x,y,sz,wg,col,align='center'){font(sz,wg);ctx.textAlign=align;ctx.fillStyle=col;ctx.fillText(s,x,y);}

// a line of whole words, laid out right-to-left; each word enters on its own time
// words: [{s, t, c, bg, bc}]
function line(t,words,y,sz,o={}){
  const wg=o.w||800,cx=o.cx??540,ex=o.exit??1e9;
  font(sz,wg);ctx.textAlign='center';
  const pad=sz*0.22,sp=sz*0.28;
  const ws=words.map(w=>ctx.measureText(w.s).width+(w.bg?pad*2:0));
  const tot=ws.reduce((a,b)=>a+b,0)+sp*(words.length-1);
  let x=cx+tot/2;
  const pe=k(t,ex,0.28,EI);
  words.forEach((w,i)=>{
    const pin=k(t,w.t,0.45);
    const cxw=x-ws[i]/2; x-=ws[i]+sp;
    if(pin<=0||pe>=1)return;
    ctx.save();
    ctx.globalAlpha=(o.a??1)*Math.min(1,pin*1.6)*(1-pe);
    ctx.translate(cxw,y+(1-pin)*sz*0.5-pe*sz*0.45);
    const s=0.86+0.14*pin;ctx.scale(s,s);
    if(w.bg){ctx.fillStyle=w.bg;const bw=ws[i]*Math.min(1,pin*1.3);rr(ws[i]/2-bw,-sz*0.98,bw,sz*1.42,sz*0.24);ctx.fill();}
    font(sz,wg);ctx.textAlign='center';ctx.fillStyle=w.c||(o.c||C.white);ctx.fillText(w.s,0,0);
    ctx.restore();
  });
}
const Wd=(s,t,extra={})=>Object.assign({s,t},extra);
