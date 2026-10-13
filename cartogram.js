const cache=new Map();
export function loadFrame(year){
 if(!cache.has(year))cache.set(year,(async()=>{const response=await fetch(`data/cartograms/${year}.json.gz`);if(!response.ok)throw Error(`Nie udało się pobrać geometrii ${year}`);const stream=response.body.pipeThrough(new DecompressionStream('gzip'));return new Response(stream).json();})().catch(e=>{cache.delete(year);throw e;}));
 return cache.get(year);
}
export function preload(years){let next=0;async function worker(){while(next<years.length){try{await loadFrame(years[next++]);}catch{/* An explicit year selection offers a retry. */}}}worker();worker();}
export const pathData=rings=>rings.map(r=>'M'+r.map(([x,y])=>x.toFixed(2)+','+y.toFixed(2)).join('L')+'Z').join('');
let animation=0;
const displayed=new Map();
export function morph(paths,features,animate=true){
 cancelAnimationFrame(animation);
 const duration=animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches?700:0;
 const transitions=features.map(f=>{const old=displayed.get(f.id),compatible=old&&old.length===f.rings.length&&old.every((r,i)=>r.length===f.rings[i].length);return {id:f.id,start:compatible?old:f.rings,end:f.rings};});
 const start=performance.now();
 function tick(now){const t=duration?Math.min(1,(now-start)/duration):1,e=t*t*(3-2*t);for(const f of transitions){const rings=t===1?f.end:f.end.map((r,i)=>r.map((p,j)=>[f.start[i][j][0]+(p[0]-f.start[i][j][0])*e,f.start[i][j][1]+(p[1]-f.start[i][j][1])*e]));displayed.set(f.id,rings);paths.get(f.id).setAttribute('d',pathData(rings));}if(t<1)animation=requestAnimationFrame(tick);}
 animation=requestAnimationFrame(tick);
}
