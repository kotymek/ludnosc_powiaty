import {mkdir,writeFile} from 'node:fs/promises';
const base='https://bdl.stat.gov.pl/api/v1';
async function json(url){const r=await fetch(url);if(!r.ok)throw Error(`${r.status} ${url}`);const d=await r.json();if(d.error)throw Error(JSON.stringify(d.error));return d;}
await mkdir('data',{recursive:true});
const variable=await json(`${base}/variables/72305?format=json`);
const subject=await json(`${base}/subjects/P2137?format=json`);
const years=variable.years.filter(y=>y>=1998);
let url=`${base}/data/by-variable/72305?format=json&unit-level=5&page-size=100&${years.map(y=>'year='+y).join('&')}`;
const rows=[];
while(url){const page=await json(url);rows.push(...page.results);url=page.links.next;}
const geoUrl='https://mapy.geoportal.gov.pl/wss/ims/maps/PRG_gugik_wyszukiwarka/FeatureServer/1/query?where=1%3D1&outFields=teryt,nazwa&returnGeometry=true&outSR=4326&maxAllowableOffset=0.003&geometryPrecision=4&f=json';
const geo=await json(geoUrl);
if(geo.exceededTransferLimit)throw Error('Truncated boundaries');
const features=geo.features.map(f=>({type:'Feature',properties:{id:f.attributes.teryt,name:f.attributes.nazwa},geometry:{type:'Polygon',coordinates:f.geometry.rings}}));
if(features.length!==380)throw Error(`Expected 380 boundaries, got ${features.length}`);
const counties=rows.map(r=>({id:r.id.slice(2,4)+r.id.slice(7,9),bdlId:r.id,name:r.name,values:Object.fromEntries(r.values.map(v=>[v.year,v.val])),attributes:Object.fromEntries(r.values.filter(v=>v.attrId!==1).map(v=>[v.year,v.attrId]))}));
const ids=new Set(features.map(f=>f.properties.id));
const missing=features.filter(f=>!counties.some(c=>c.id===f.properties.id));if(missing.length)throw Error(JSON.stringify(missing));
const data={downloadedAt:new Date().toISOString(),variable,subject,years:years.filter(y=>y>=1999),comparisonYears:years,counties,boundarySource:geoUrl};
await writeFile('data/population.json',JSON.stringify(data));
await writeFile('data/counties.geojson',JSON.stringify({type:'FeatureCollection',features}));
console.log(JSON.stringify({years:data.years,records:rows.length,boundaries:features.length,unmapped:counties.filter(c=>!ids.has(c.id)).map(c=>({id:c.id,name:c.name})),coverage:years.map(y=>[y,counties.filter(c=>ids.has(c.id)&&c.values[y]!=null).length])}));
