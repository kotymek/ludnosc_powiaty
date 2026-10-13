import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const index=JSON.parse(await readFile(new URL('../data/cartograms/index.json',import.meta.url)));
const frames=await Promise.all(index.years.map(async year=>JSON.parse(gunzipSync(await readFile(new URL(`../data/cartograms/${year}.json.gz`,import.meta.url))))));
const area=rings=>Math.abs(rings.reduce((sum,r)=>sum+r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+(p[0]*q[1]-q[0]*p[1])/2;},0),0));
test('Every year has 380 finite geometries and matching vertices for smooth interpolation',()=>{
 const shapes=new Map(frames[0].features.map(f=>[f.id,f.rings.map(r=>r.length)]));
 for(const frame of frames){assert.equal(frame.features.length,380);assert.equal(new Set(frame.features.map(f=>f.id)).size,380);for(const f of frame.features){assert.deepEqual(f.rings.map(r=>r.length),shapes.get(f.id),`${frame.year} ${f.id}`);for(const r of f.rings){assert.deepEqual(r[0],r.at(-1));for(const[x,y]of r){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=0&&x<=800&&y>=0&&y<=700);}}}}
});
test('Rendered polygon areas represent absolute population at ONE scale across all 27 years (error < 1.2%)',()=>{
 for(const frame of frames)for(const f of frame.features){const population=frame.observations[f.id].value;if(population===null)continue;const expected=population*index.pixelsSquaredPerPerson;assert.ok(Math.abs(area(f.rings)/expected-1)<.012,`${frame.year} ${f.id}`);}
});
test('Shapes really change, Warsaw expands and Łódź shrinks between endpoints',()=>{
 for(const[id,grows]of [['1465',true],['1061',false]]){const a=frames[0].features.find(f=>f.id===id),b=frames.at(-1).features.find(f=>f.id===id);assert.notDeepEqual(a.rings,b.rings);assert.equal(area(b.rings)>area(a.rings),grows);}
});
test('Missing population is NA, never zero; historical sources are explicit',()=>{
 assert.equal(Object.values(frames[0].observations).filter(o=>o.value===null).length,7);
 assert.equal(frames[0].observations['1465'].sourceId,'1431');assert.equal(frames[0].observations['0265'].sourceId,'0263');
 assert.equal(frames.find(f=>f.year===2005).observations['0265'].value,null);
 assert.ok(Object.values(frames.at(-1).observations).every(o=>o.value>0));
});
