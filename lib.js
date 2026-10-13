export const colors=['#a54430','#ce7554','#e6af8d','#efdbc1','#edf0e6','#b6d1bf','#77af9c','#3a897b','#146357'];
export function change(values,year,base){const a=values[year],b=values[base];return Number.isFinite(a)&&Number.isFinite(b)&&b>0?{percent:(a/b-1)*100,absolute:a-b,current:a,previous:b}:null;}
export function colorFor(value,mode){if(value===null||!Number.isFinite(value))return 'url(#missing)';const breaks=mode==='annual'?[-3,-2,-1,-.25,.25,1,2,3]:[-30,-20,-10,-2,2,10,20,30];return colors[breaks.findIndex(b=>value<b)===-1?8:breaks.findIndex(b=>value<b)];}
export function terytFromBdl(id){return id.slice(2,4)+id.slice(7,9);}
