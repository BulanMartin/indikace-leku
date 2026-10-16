const DRUGS = {
 forxiga:{name:'Forxiga',sub:'dapagliflozin',group:'SGLT2 inhibitor',desc:'Diabetes 2. typu · srdeční selhání · chronické onemocnění ledvin',packs:[['0193660','10 mg · 30×1 (DM / CKD)'],['0193661','10 mg · 90×1 (DM / CKD)'],['0193658','10 mg · 28 KAL (srdeční selhání)'],['0193659','10 mg · 98 KAL (srdeční selhání)']]},
 trajenta:{name:'Trajenta',sub:'linagliptin',group:'DPP-4 inhibitor',desc:'Diabetes 2. typu · samostatná účinná látka',packs:[['0168447','5 mg · 30×1'],['0168451','5 mg · 90×1']]},
 jentadueto:{name:'Jentadueto',sub:'linagliptin / metformin',group:'Fixní kombinace',desc:'Diabetes 2. typu · kombinovaná léčba',packs:[['0185273','2,5 / 850 mg · 60×1'],['0185287','2,5 / 1 000 mg · 60×1'],['0249518','2,5 / 1 000 mg · 180 (3×60×1)']]}
};
function evaluate(drug,v){
 const out={ind:[],safe:[],pay:[],gp:[]};
 const yes=(x)=>v[x]==='yes', known=x=>v[x]!==''&&v[x]!==undefined, n=x=>known(x)?Number(v[x]):null;
 const dependencies=text=>{
  if(text.startsWith('Je zvolena'))return ['route'];
  if(text.startsWith('Je určena'))return ['phase'];
  if(text.startsWith('Nedostatečná kompenzace'))return v.regimen==='switch'?['regimen']:['regimen','uncontrolled','maxmet'];
  if(text.startsWith('Přídatná léčba'))return v.regimen==='none'?['regimen','metintol',...(drug==='trajenta'?['metrenal']:[])]:['regimen'];
  if(text.startsWith('Vybrané hrazené')||text.startsWith('Balení odpovídá'))return ['pack'];
  if(text.startsWith('Kombinace léčby'))return ['regimen'];
  if(text.startsWith('Po 6 měsících relativní'))return ['hba0','hba6'];
  if(text.startsWith('Po 6 měsících současně'))return ['weight0','weight6'];
  if(text.startsWith('eGFR 20–90'))return ['gfr','dm',...(n('gfr')>(yes('dm')?75:45)?['uacr']:[])];
  if(text.startsWith('NYHA'))return ['nyha'];
  if(text.startsWith('Doplnit ejekční'))return ['ef'];
  if(text.startsWith('Při EF'))return ['ef','nt','af'];
  return [];
 };
 const check=(part,condition,text,keys=dependencies(text))=>out[part].push({status:condition===null?'unknown':condition?'pass':'fail',text,keys});
 const b=(part,key,text)=>check(part,known(key)?yes(key):null,text,[key]);
 const num=(part,key,fn,text)=>check(part,n(key)===null?null:fn(n(key)),text,[key]);
 const route=v.route||'dm', f=drug==='forxiga',j=drug==='jentadueto';
 check('ind',known('route')?true:null,'Je zvolena posuzovaná indikace.');
 check('safe',known('phase')?true:null,'Je určena fáze léčby.');
 num('ind','age',x=>x>=(f&&route==='dm'?10:18),'Věk odpovídá registrované indikaci.');
 if(route==='dm'){
 b('ind','dm','Potvrzen diabetes mellitus 2. typu.'); b('ind','lifestyle','Léčba doplňuje dietní a pohybová opatření.');
 if(j){check('ind',known('regimen')?(v.regimen==='switch'||(['met','metsu','meti'].includes(v.regimen)&&yes('uncontrolled')&&yes('maxmet'))):null,'Nedostatečná kompenzace na maximální tolerované dávce metforminu (± další lék), nebo převod z linagliptinu + metforminu.');}
 else { b('ind','uncontrolled','Je potřebné zlepšit glykemickou kompenzaci.');check('ind',known('regimen')?(v.regimen!=='none'||yes('metintol')||(!f&&yes('metrenal'))):null,'Přídatná léčba, nebo monoterapie při nevhodnosti metforminu dle SPC.'); }
 } else b('ind','diagnosis',route==='hf'?'Potvrzené symptomatické chronické srdeční selhání.':'Potvrzené chronické onemocnění ledvin.');
 ['allergy','type1','acute','pregnant'].forEach(k=>check('safe',known(k)?!yes(k):null,({allergy:'Bez hypersenzitivity na složky přípravku.',type1:'Nejde o diabetes 1. typu.',acute:'Bez akutního stavu vyžadujícího odklad / přerušení léčby.',pregnant:'Bez těhotenství či kojení vyžadujícího individuální rozhodnutí.'})[k],[k]));
 if(f){num('safe','gfr',x=>v.phase==='start'?x>=25:true,'Při zahájení GFR ≥25 ml/min; při nižší hodnotě se zahájení nedoporučuje.');b('safe','riskreview','Posouzena hydratace, hypotenze, riziko ketoacidózy, infekce, jaterní funkce a interakce dle SPC.');}
 if(j){num('safe','gfr',x=>x>=30,'GFR ≥30 ml/min; pod 30 je metformin kontraindikován.');num('safe','gfr',x=>x>=45,'Fixní síla 850/1 000 mg 2× denně je slučitelná s renálním limitem; při GFR 30–44 použít samostatné složky.');b('safe','metreview','Vyloučeny kontraindikace metforminu: acidóza/prekomatózní stav, dehydratace, závažná infekce/šok, hypoxie, jaterní insuficience, intoxikace alkoholem/alkoholismus.');b('safe','dosereview','Síla odpovídá dosavadní dávce a toleranci metforminu; posouzena přerušení při kontrastu / operaci.');}
 if(!f)b('safe','riskreview','Posouzena pankreatitida, pemfigoid, hypoglykemie a lékové interakce dle SPC.');
 b('safe','review','Lékař provedl úplnou kontrolu SPC a souběžné medikace.');
 check('pay',known('pack')?DRUGS[drug].packs.some(p=>p[0]===v.pack):null,'Vybrané hrazené balení je v číselníku SÚKL 1. 10. 2026.');
 if(f)check('pay',known('pack')?(route==='hf'?['0193658','0193659']:['0193660','0193661']).includes(v.pack):null,'Balení odpovídá zvolené úhradové indikaci.');
 if(route==='dm'){
 b('pay','dm','Úhrada pro diabetes 2. typu.');
 const switcher=j&&v.regimen==='switch';
 check('pay',known('regimen')?(f?['met','meti','ins']:j?['met','metsu','switch']:['met','metsu']).includes(v.regimen):null,'Kombinace léčby splňuje úhradové omezení (linagliptin s inzulinem není hrazen).');
 if(!switcher){num('pay','months',x=>x>=3,'Předchozí léčba trvala alespoň 3 měsíce.');b('pay','maxmet','Předchozí léčba splnila požadavek maximální tolerované dávky, pokud jej omezení vyžaduje.');b('pay','lifestyle','Současně byla zavedena režimová opatření.');num('pay','hba0',x=>x>=(f&&['meti','ins'].includes(v.regimen)?60:53),'Vstupní HbA1c ≥53 mmol/mol (Forxiga s inzulinem ≥60 mmol/mol).');}
 if(v.phase==='review'){
 check('pay',n('hba0')!==null&&n('hba6')!==null?(n('hba0')-n('hba6'))/n('hba0')>=.07-1e-10:null,'Po 6 měsících relativní pokles HbA1c alespoň 7 % oproti výchozí hodnotě.');
 if(f)check('pay',n('weight0')!==null&&n('weight6')!==null?(n('weight0')-n('weight6'))/n('weight0')>=.02-1e-10:null,'Po 6 měsících současně pokles hmotnosti alespoň 2 %.');
 } else if(switcher)b('pay','priorcheck','U převodu z volné kombinace ověřena dosavadní délka léčby a případná 6měsíční kontrola účinku.');
 }else if(route==='ckd'){
 num('pay','age',x=>x>=18,'Dospělý pacient.');b('pay','ace','Stabilní léčba ACEi/ARB, nebo její kontraindikace.');
 const g=n('gfr'),a=n('uacr');check('pay',g===null||!known('dm')?null:g<20||g>90?false:g<=(yes('dm')?75:45)?true:a===null?null:a>=200,'eGFR 20–90 ml/min/1,73 m²; nad 75 při DM2 / nad 45 bez DM2 navíc UACR ≥200 mg/g.');
 }else{
 num('pay','gfr',x=>x>25,'eGFR >25 ml/min/1,73 m² (přesně 25 nestačí).');check('pay',known('nyha')?['2','3'].includes(v.nyha):null,'NYHA II–III.');
 if(n('ef')===null)check('pay',null,'Doplnit ejekční frakci levé komory.');
 else if(n('ef')<=40)b('pay','optimal','Přetrvávají příznaky navzdory ACEi/ARB/ARNI + betablokátoru + MRA v cílových či maximálně tolerovaných dávkách.');
 else check('pay',n('nt')===null||!known('af')?null:n('nt')>(yes('af')?600:300),'Při EF >40 %: NT-proBNP >300 pg/ml; při fibrilaci síní >600 pg/ml.');
 }
 b('gp','gp','Předepisuje lékař se specializovanou způsobilostí ve všeobecném praktickém lékařství.');b('gp','contract','Pro tuto odbornost je uzavřena smlouva s pojišťovnou pacienta.');b('gp','restriction','Ověřeno, že SPC / registrační příloha nevyžaduje jinou odbornost pro daného pacienta.');
 const state=arr=>arr.some(x=>x.status==='fail')?'fail':arr.some(x=>x.status==='unknown')?'unknown':'pass';
 out.states=Object.fromEntries(['ind','safe','pay','gp'].map(k=>[k,state(out[k])]));out.total=state(Object.values(out).filter(Array.isArray).flat());return out;
}
function fieldFeedback(result,key,values){
 const relevant=part=>result[part].filter(x=>x.keys.includes(key));
 const clinical=[...relevant('ind'),...relevant('safe')],prescription=[...relevant('pay'),...relevant('gp')];
 const all=[...clinical,...prescription];
 if(values[key]===''||values[key]===undefined||!all.length)return {tone:'neutral',text:'Zatím neposouzeno / pro tuto větev se nehodnotí.'};
 // Coupled conditions remain pending until their necessary inputs are available.
 if(clinical.some(x=>x.status==='fail'&&x.keys.every(k=>values[k]!==''&&values[k]!==undefined)))return {tone:'red',text:'Podání ani hrazený předpis nelze potvrdit: '+clinical.filter(x=>x.status==='fail').map(x=>x.text).join(' ')};
 if(all.some(x=>x.status==='unknown'||(x.status!=='pass'&&x.keys.some(k=>values[k]===''||values[k]===undefined))))return {tone:'neutral',text:'Doplňte související údaje pro posouzení tohoto pole.'};
 if(prescription.some(x=>x.status==='fail'))return {tone:'yellow',text:'Tento údaj nebrání podání, ale nesplňuje podmínku hrazeného předpisu: '+prescription.filter(x=>x.status==='fail').map(x=>x.text).join(' ')};
 return {tone:'green',text:'Podmínky podání i hrazeného předpisu pro tento údaj jsou splněny. Celkové posouzení je v panelu výsledku.'};
}
if(typeof module!=='undefined')module.exports={evaluate,DRUGS,fieldFeedback};
