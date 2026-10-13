import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import initGoCart from 'go-cart-wasm';

const require=createRequire(import.meta.url);
const wasm=await readFile(join(dirname(require.resolve('go-cart-wasm')),'cart.wasm'));
const engine=await initGoCart({wasmBinary:wasm,print:()=>{},printErr:()=>{}});
const data=JSON.parse(await readFile('data/population.json'));
const geo=JSON.parse(await readFile('data/counties.geojson'));
const countyById=new Map(data.counties.map(c=>[c.id,c]));
const radians=Math.PI/180,cos52=Math.cos(52*radians);
const project=([lon,lat])=>[(lon-19)*radians*cos52,(Math.sin(lat*radians)-Math.sin(52*radians))/cos52];
const signedArea=r=>r.reduce((a,p,i)=>{const q=r[(i+1)%r.length];return a+(p[0]*q[1]-q[0]*p[1])/2;},0);
function contains(r,[x,y]){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function polygons(rings){const outer=rings.filter(r=>signedArea(r)<0).map(r=>[r]);for(const hole of rings.filter(r=>signedArea(r)>0)){const polygon=outer.find(p=>contains(p[0],hole[0]));if(!polygon)throw Error('Unassigned hole');polygon.push(hole);}return outer;}
const features=geo.features.map((f,i)=>({type:'Feature',properties:{id:f.properties.id,cartogram_id:String(i+1)},geometry:{type:'MultiPolygon',coordinates:polygons(f.geometry.coordinates).map(p=>p.map(r=>r.map(project)))}}));
const allPoints=features.flatMap(f=>f.geometry.coordinates.flat(2));
const bbox=[0,1].map(i=>Math.min(...allPoints.map(p=>p[i]))).concat([0,1].map(i=>Math.max(...allPoints.map(p=>p[i]))));
const rings=f=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();
const area=f=>Math.abs(rings(f).reduce((sum,r)=>sum+signedArea(r),0));
function observation(id,year){let c=countyById.get(id);if(c.values[year]!=null)return{value:c.values[year],sourceId:id};const historical=id==='1465'&&year<2002?'1431':id==='0265'&&year<=2002?'0263':null;c=countyById.get(historical);return c?.values[year]!=null?{value:c.values[year],sourceId:historical}:{value:null,sourceId:null};}
await mkdir('data/cartograms',{recursive:true});
const requested=process.argv.slice(2).map(Number),years=requested.length?requested:data.years;
for(const year of years){
 const observations=Object.fromEntries(features.map(f=>[f.properties.id,observation(f.properties.id,year)]));
 const input={type:'FeatureCollection',bbox,features};
 const csv='Region Id, Region Data\n'+features.map(f=>`${f.properties.cartogram_id}, ${observations[f.properties.id].value??'NA'}`).join('\n');
 if(!engine.FS.findObject('/data'))engine.FS.mkdir('/data');
 engine.FS.writeFile('/data/map.json',JSON.stringify(input));engine.FS.writeFile('/data/values.csv',csv);
 const start=Date.now();
 const status=engine.ccall('doCartogram','number',['string','string'],['/data/map.json','/data/values.csv']);if(status!==0)throw Error(`Cartogram failed: ${year}`);
 const result=JSON.parse(engine.FS.readFile('cartogram.json',{encoding:'utf8'}));
 const known=result.features.filter(f=>observations[f.properties.id].value!==null);
 const totalArea=known.reduce((s,f)=>s+area(f),0),totalPopulation=known.reduce((s,f)=>s+observations[f.properties.id].value,0);
 // Identical area-per-person in every year, never independently fit each year.
 const scale=Math.sqrt(totalPopulation/totalArea);
 let maxError=0;for(const f of known){maxError=Math.max(maxError,Math.abs(area(f)*scale*scale/observations[f.properties.id].value-1));}
 const output={year,observations,maxRelativeAreaError:maxError,features:result.features.map(f=>({id:f.properties.id,rings:rings(f).map(r=>r.map(([x,y])=>[x*scale,-y*scale]))}))};
 await writeFile(`data/cartograms/${year}.json`,JSON.stringify(output));
 console.log(JSON.stringify({year,seconds:(Date.now()-start)/1000,maxError,known:known.length}));
 for(const file of ['/data/map.json','/data/values.csv','cartogram.json','area_error.dat'])engine.FS.unlink(file);
}

