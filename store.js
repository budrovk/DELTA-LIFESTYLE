// Storage layer: Postgres when DATABASE_URL is set, otherwise data.json on disk.
const fs=require('fs'),path=require('path');
const G=require('./game.js');
function fileStore(){
 const F=path.join(__dirname,'data.json');let db={users:{},sessions:{}};
 try{db=JSON.parse(fs.readFileSync(F,'utf8'))}catch(e){}
 let dirty=false;const flush=()=>{if(!dirty)return;dirty=false;fs.writeFile(F+'.tmp',JSON.stringify(db),e=>{if(!e)fs.rename(F+'.tmp',F,()=>{})})};
 setInterval(flush,2000);process.on('SIGINT',()=>{fs.writeFileSync(F,JSON.stringify(db));process.exit()});
 return{kind:'file',
  async getUser(e){return db.users[e]||null},
  async addUser(e,salt,hash,save){db.users[e]={salt,hash,save};dirty=true},
  async setSave(e,save){db.users[e].save=save;dirty=true},
  async addSession(t,e){db.sessions[t]=e;dirty=true},
  async getSession(t){return db.sessions[t]},
  async top(){return Object.entries(db.users).filter(([,u])=>u.save).map(([e,u])=>[e,u.save]).sort((a,b)=>net(b[1])-net(a[1])).slice(0,10)}}}
const net=s=>s.m+s.shops*G.SHOP;
async function pgStore(url){
 const {Pool}=require('pg');
 const pool=new Pool({connectionString:url,ssl:(process.env.PGSSL==='1'||/sslmode=require/.test(url))?{rejectUnauthorized:false}:/localhost|127\.0\.0\.1|\.railway\.internal/.test(url)?false:{rejectUnauthorized:false}});
 await pool.query(`create table if not exists users(email text primary key,salt text not null,hash text not null,save jsonb not null);
  create table if not exists sessions(token text primary key,email text not null references users(email),created timestamptz default now());`);
 return{kind:'postgres',
  async getUser(e){const r=await pool.query('select salt,hash,save from users where email=$1',[e]);return r.rows[0]||null},
  async addUser(e,salt,hash,save){await pool.query('insert into users(email,salt,hash,save) values($1,$2,$3,$4)',[e,salt,hash,save])},
  async setSave(e,save){await pool.query('update users set save=$2 where email=$1',[e,save])},
  async addSession(t,e){await pool.query('insert into sessions(token,email) values($1,$2)',[t,e])},
  async getSession(t){const r=await pool.query("select email from sessions where token=$1 and created>now()-interval '30 days'",[t]);return r.rows[0]&&r.rows[0].email},
  async top(){const r=await pool.query("select email,save from users order by ((save->>'m')::numeric+(save->>'shops')::numeric*$1) desc limit 10",[G.SHOP]);return r.rows.map(x=>[x.email,x.save])}}}
module.exports=async()=>process.env.DATABASE_URL?pgStore(process.env.DATABASE_URL):fileStore();
