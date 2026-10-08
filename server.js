// Delta Life server. Needs Node 18+. Run: node server.js  (set DATABASE_URL to use Postgres)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const G=require('./game.js'),openStore=require('./store.js');
const PORT=process.env.PORT||3000,PAGE=path.join(__dirname,'public','index.html');
const hits={},limited=ip=>{const n=Date.now(),a=hits[ip]=(hits[ip]||[]).filter(t=>n-t<60000);a.push(n);return a.length>15};
const send=(res,c,o)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
const hashPw=(pw,salt)=>new Promise((ok,no)=>crypto.scrypt(pw,salt,64,(e,k)=>e?no(e):ok(k.toString('hex'))));
const body=req=>new Promise((ok,no)=>{let d='';req.on('data',c=>{d+=c;if(d.length>2e5){no(new Error('big'));req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(d||'{}'))}catch(e){no(e)}})});
const locks={};const withLock=(k,fn)=>{const p=(locks[k]||Promise.resolve()).then(fn,fn);locks[k]=p.catch(()=>{});return p};
(async()=>{
 const S=await openStore();
 const newTok=async em=>{const t=crypto.randomBytes(32).toString('hex');await S.addSession(t,em);return t};
 http.createServer(async(req,res)=>{
  try{
   if(req.method==='POST'&&req.url.startsWith('/api/')){
    const ep=req.url.slice(5),b=await body(req);
    if((ep==='signup'||ep==='login')&&limited(req.socket.remoteAddress))return send(res,429,{error:'Too many attempts. Wait a minute.'});
    const em=String(b.email||'').trim().toLowerCase(),pw=String(b.password||'');
    if(ep==='signup'){
     if(!/^\S+@\S+\.\S+$/.test(em)||em.length>120)return send(res,400,{error:'Enter a valid email.'});
     if(pw.length<6||pw.length>200)return send(res,400,{error:'Password must be 6 to 200 characters.'});
     if(await S.getUser(em))return send(res,409,{error:'That email already has an account. Log in instead.'});
     const salt=crypto.randomBytes(16).toString('hex'),save=G.fresh();
     try{await S.addUser(em,salt,await hashPw(pw,salt),save)}catch(e){return send(res,409,{error:'That email already has an account. Log in instead.'})}
     return send(res,200,{token:await newTok(em),email:em,save});}
    if(ep==='login'){
     const u=await S.getUser(em);
     if(!u||!crypto.timingSafeEqual(Buffer.from(await hashPw(pw,u.salt),'hex'),Buffer.from(u.hash,'hex')))return send(res,401,{error:'Wrong email or password.'});
     return send(res,200,{token:await newTok(em),email:em,save:u.save});}
    const who=await S.getSession((req.headers.authorization||'').replace('Bearer ',''));
    if(!who)return send(res,401,{error:'Please log in again.'});
    if(ep==='me')return send(res,200,{email:who,save:(await S.getUser(who)).save});
    if(ep==='reset'||ep==='do'){
     const save=await withLock(who,async()=>{let s=(await S.getUser(who)).save;
      if(ep==='reset'){const av=s.av;s=G.fresh();if(av)s.av=av}else G.step(s,{t:String(b.t||''),i:Number.isInteger(b.i)?b.i:-1,p:String(b.p||'')},Math.random);
      await S.setSave(who,s);return s});
     return send(res,200,{state:save});}
    if(ep==='avatar'){const lim={skin:4,hair:3,hc:4,top:5,bot:3,cap:1},av={};
     for(const k in lim){const x=b[k];if(!Number.isInteger(x)||x<0||x>lim[k])return send(res,400,{error:'Bad look.'});av[k]=x}
     const save=await withLock(who,async()=>{const s=(await S.getUser(who)).save;s.av=av;await S.setSave(who,s);return s});
     return send(res,200,{state:save});}
    return send(res,404,{error:'Not found'});}
   if(req.method==='GET'&&req.url==='/api/leaderboard')
    return send(res,200,(await S.top()).map(([e,s])=>({name:e.split('@')[0].slice(0,2)+'***',net:s.m+s.shops*G.SHOP,day:s.d,deg:s.deg})));
   const F={'/game.js':'game.js','/town3d.js':'public/town3d.js'};if(F[req.url])return fs.readFile(path.join(__dirname,F[req.url]),(e,j)=>{res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8'});res.end(j)});
   fs.readFile(PAGE,(e,h)=>{res.writeHead(e?500:200,{'Content-Type':'text/html; charset=utf-8'});res.end(e?'Page missing':h)});
  }catch(e){console.error(e);send(res,400,{error:'Bad request.'})}
 }).listen(PORT,()=>console.log('Delta Life running on port '+PORT+' using '+S.kind+' storage'));
})();
