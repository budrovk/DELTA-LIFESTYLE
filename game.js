(function(root){
const L={
Warri:{hotel:["Protea Hotel Delta",25000],sch:[["Federal University of Petroleum Resources (FUPRE)",600000,10,"BSc",2],["Petroleum Training Institute, Effurun",250000,6,"Polytechnic Diploma",1.5]],a:[
["Hustle at Warri Main Market",35000,-15,-8,-3,"You sell till your voice dey go small."],
["Work a shift at Delta Mall, Effurun",45000,-15,-8,-2,"Customers dey come. Shift long but pay dey."],
["Okada runs at PTI Junction",30000,-20,-10,-4,"Traffic, dust, small change. You survive."],
["Buy suya and kilishi at the Hausa quarters",-3500,3,30,10,"Suya pepper strong, kilishi crunchy. Belle and mood both happy."],
["Eat banga soup and starch",-3000,5,40,6,"Banga hot, starch soft. Belle full."],
["Enjoy Funcity Amusement Park",-8000,-5,-5,20,"Rides, laughter, no wahala today."]]},
Asaba:{hotel:["Best Western Plus Elomaz Hotel",30000],sch:[["Dennis Osadebay University",550000,10,"BSc",2]],a:[
["Run errands near the Secretariat",45000,-15,-8,-4,"Many signatures, small money, but e count."],
["Trade at Ogbeogonogo Market",40000,-18,-8,-3,"Haggle, laugh, collect. Market sweet."],
["Buy suya and kilishi at the Hausa quarters",-3500,3,30,10,"Suya pepper strong, kilishi crunchy. Belle and mood both happy."],
["Eat ofe onugbu with fufu",-4000,5,40,6,"Bitter leaf soup sweet pass."],
["Drink and gist at a lounge on DBS Road",-10000,-5,-6,18,"Music loud, friends plenty."],
["Watch the River Niger at sunset",0,5,-5,12,"The bridge lights come on. Peace."]]},
"Ogwashi-Uku":{hotel:["Vacation Villa Hotel & Suites",18000],sch:[["Delta State Polytechnic, Ogwashi-Uku",250000,6,"Polytechnic ND",1.5]],a:[
["Tutor students at the polytechnic gate",30000,-10,-6,-2,"Students need help before exams. Pay dey."],
["Sell provisions in Ogwashi-Uku",33000,-15,-8,-3,"Small shop, steady customers."],
["Eat roasted yam and fish",-3000,5,38,7,"Yam hot, fish pepper-ed. Sweet."]]},
Agbor:{hotel:["a local guest house",12000],sch:[["College of Education, Agbor",200000,6,"NCE",1.4]],a:[
["Sell at Agbor Market",32000,-15,-8,-3,"Fresh produce moves fast today."],
["Fix phones for people on the roadside",38000,-12,-6,-2,"Cracked screens, steady cash."],
["Eat fresh pepper soup",-3500,5,38,7,"Pepper wake you up proper."]]},
Sapele:{hotel:["Dallas Grand Beach Hotel & Resort",22000],sch:[],a:[
["Load timber at the port",40000,-20,-10,-5,"Your back go remember today."],
["Eat fresh fish pepper soup",-3500,5,35,8,"Pepper dey sweet."],
["Relax by the Ethiope",-1000,0,-5,10,"Cool breeze, no wahala."]]},
Abraka:{hotel:["Abraka Turf & Country Club",20000],sch:[["Delta State University (DELSU), Abraka",400000,10,"BSc",2]],a:[
["Tutor students",35000,-10,-6,-2,"Students pay with prayers and cash."],
["Eat starch with owho soup",-3000,5,40,7,"Urhobo food no dey disappoint."],
["Swim in River Ethiope",-1000,-5,-5,14,"Clear water. You forget sapa."]]}};
const EV=[["NEPA take light. You sweat through the evening.",0,0,-8],["Fuel for generator finish. You buy more.",-5000,0,-3],["Old friend sends alert. Nice one!",25000,0,8],["Pothole almost swallow your keke.",0,-5,-4]];

const T=["Morning","Afternoon","Evening","Night"],GOAL=10000000,SHOP=1000000;
const cl=v=>Math.max(0,Math.min(100,v)),ng=n=>"\u20a6"+Math.round(n).toLocaleString();
const fresh=()=>({m:3000000,e:100,f:70,mo:60,d:1,t:0,l:"Warri",edu:null,deg:"No certificate",mult:1,shops:0,log:"\u20a63,000,000 welcome bonus received. Pick what to do."});
// All game rules run here. The client only sends commands, never state.
function step(s,c,rnd){
 const P=L[s.l],poor=()=>{s.log="Money no reach."};
 const newDay=()=>{s.d++;if(s.shops){const g=s.shops*20000;s.m+=g;s.log+=" Your shops earned "+ng(g)+"."}};
 const tick=()=>{s.t++;s.f=cl(s.f-8);if(s.t>3){s.t=0;newDay()}};
 const after=()=>{
  if(rnd()<.25){const v=EV[Math.floor(rnd()*EV.length)];s.m=Math.max(0,s.m+v[1]);s.e=cl(s.e+v[2]);s.mo=cl(s.mo+v[3]);s.log+=" "+v[0]}
  if(s.e<=0){s.m=Math.max(0,s.m-20000);s.e=40;tick();s.log="You faint from tire. Clinic cost \u20a620,000."}
  if(s.m>=GOAL)s.log="\ud83c\udf89 Day "+s.d+": you reach "+ng(GOAL)+". You are now a Delta big name. You win!"};
 switch(c.t){
 case"act":{const a=P.a[c.i];if(!a)break;if(s.m+a[1]<0){poor();break}
  s.m+=a[1]>0?a[1]*s.mult:a[1];s.e=cl(s.e+a[2]);s.f=cl(s.f+a[3]);s.mo=cl(s.mo+a[4]);s.log=a[5];tick();after();break}
 case"go":{if(!L[c.p]||c.p===s.l)break;if(s.m<5000){poor();break}
  s.m-=5000;s.l=c.p;s.e=cl(s.e-5);tick();s.log="You enter bus to "+c.p+" (\u20a65,000).";after();break}
 case"hotel":{const h=P.hotel;if(s.m<h[1]){poor();break}
  s.m-=h[1];s.e=100;s.mo=cl(s.mo+15);s.f=cl(s.f-10);s.t=0;s.log="You sleep well at "+h[0]+". New day, fresh energy.";newDay();break}
 case"enroll":{const x=P.sch[c.i];if(!x||s.edu)break;if(s.m<x[1]){poor();break}
  s.m-=x[1];s.edu={n:x[0],need:x[2],p:0,lab:x[3],mult:x[4],town:s.l};s.log="You enroll at "+x[0]+" for "+ng(x[1])+". Attend classes to graduate.";break}
 case"cls":{const e=s.edu;if(!e||e.town!==s.l)break;
  s.e=cl(s.e-15);s.f=cl(s.f-8);s.mo=cl(s.mo-3);e.p++;
  if(e.p>=e.need){s.deg=e.lab;s.mult=Math.max(s.mult,e.mult);s.log="\ud83c\udf93 You graduate with a "+e.lab+" from "+e.n+". Your hustle pay now rise!";s.edu=null}
  else s.log="Class at "+e.n+": "+e.p+"/"+e.need+" done.";
  tick();after();break}
 case"shop":{if(s.m<SHOP){poor();break}s.m-=SHOP;s.shops++;s.log="You buy a shop for "+ng(SHOP)+". It will pay \u20a620,000 every day.";break}
 }
 return s}
const G={L,EV,T,GOAL,SHOP,fresh,step,ng};
if(typeof module!=='undefined')module.exports=G;else root.G=G;
})(this);
