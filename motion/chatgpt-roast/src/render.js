const {chromium}=require('playwright');
const {spawn}=require('child_process');const fs=require('fs');const http=require('http');const path=require('path');
const dir=process.argv[2], mode=process.argv[3], out=process.argv[4];
const srv=http.createServer((q,r)=>{const f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)){r.writeHead(404);return r.end();}
 r.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.ttf')?'font/ttf':'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(8765);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>chromium.launch());
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://localhost:8765/index.html');await p.waitForFunction('window.ready===true');
 fs.writeFileSync(path.join(dir,'sfx.json'),JSON.stringify(await p.evaluate('window.SFX')));
 if(mode==='stills'){const ts=out.split(',').map(Number);
   for(const t of ts){const d=await p.evaluate(t=>{draw(t);return document.getElementById('cv').toDataURL('image/jpeg',0.85).slice(23)},t);fs.writeFileSync(path.join(dir,`still_${t.toFixed(2)}.jpg`),Buffer.from(d,'base64'));}
 } else {
   const fps=30,N=Math.round(await p.evaluate('DUR')*fps);
   const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
   for(let f=0;f<N;f++){const d=await p.evaluate(t=>{draw(t);return document.getElementById('cv').toDataURL('image/jpeg',0.95).slice(23)},f/fps);
     if(!ff.stdin.write(Buffer.from(d,'base64')))await new Promise(r=>ff.stdin.once('drain',r)); if(f%150===0)console.log('frame',f,'/',N);}
   ff.stdin.end();await new Promise(r=>ff.on('close',r));
 }
 await b.close();srv.close();
})();
