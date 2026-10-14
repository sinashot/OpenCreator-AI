const {chromium}=require('playwright');const fs=require('fs');const http=require('http');const path=require('path');
const dir=process.argv[2];
const srv=http.createServer((q,r)=>{const f=path.join(dir,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)){r.writeHead(404);return r.end();}fs.createReadStream(f).pipe(r);}).listen(8766);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
 const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://localhost:8766/cover.html');await p.waitForFunction('window.ready===true');
 for(const g of [false,true]){const d=await p.evaluate(g=>{cover(g);return document.getElementById('cv').toDataURL('image/png').slice(22)},g);
   fs.writeFileSync(path.join(dir,g?'cover_guides.png':'cover.png'),Buffer.from(d,'base64'));}
 await b.close();srv.close();})();
