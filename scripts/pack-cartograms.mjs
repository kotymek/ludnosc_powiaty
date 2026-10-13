import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const data=JSON.parse(await readFile('data/population.json'));
const frames=[];
let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
for(const year of data.years){const f=JSON.parse(await readFile(`data/cartograms/${year}.json`));for(const feature of f.features)for(const ring of feature.rings)for(const[x,y]of ring){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}frames.push(f);}
const scale=Math.min(730/(maxX-minX),615/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
for(const frame of frames){for(const f of frame.features)for(const ring of f.rings)for(const p of ring){p[0]=Math.round(((p[0]-cx)*scale+400)*100)/100;p[1]=Math.round(((p[1]-cy)*scale+330)*100)/100;}await writeFile(`data/cartograms/${frame.year}.json.gz`,gzipSync(JSON.stringify(frame),{level:9}));}
const index={years:data.years,pixelsSquaredPerPerson:scale*scale,maxRelativeAreaError:Math.max(...frames.map(f=>f.maxRelativeAreaError)),algorithm:'Gastner–Seguy–More (2018), go-cart-wasm 0.5.0',missingPolicy:'NA: neutral geographic-area reserve, not a population estimate',observations:Object.fromEntries(frames.map(f=>[f.year,f.observations]))};
await writeFile('data/cartograms/index.json',JSON.stringify(index));
console.log(JSON.stringify({maxError:index.maxRelativeAreaError,scale,years:frames.length}));
