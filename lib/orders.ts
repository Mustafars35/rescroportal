export type Stage = "Waiting for Mesh" | "Cord & Eyelet" | "Waiting for Frame" | "Waiting for Assembly" | "Quality Control" | "Waiting for Packing" | "Packed" | "Finished";
export type RiskLevel = "Normal" | "Risk" | "Delayed";
export type Order = { id:string; customer:string; date:string; store:string; stage:Stage; last:string; eta:string; product:string; color:string; width:number; height:number; direction:"Vertical"|"Horizontal"; threshold:string; quantity:number; ageDays:number; stageEnteredDays:number; risk:RiskLevel };

export const stages:Stage[] = ["Waiting for Mesh","Cord & Eyelet","Waiting for Frame","Waiting for Assembly","Quality Control","Waiting for Packing","Packed","Finished"];
const customers=["Sophie de Vries","Lukas Schneider","Camille Bernard","Daan Jansen","María González","Freja Nielsen","Oliver Taylor","Zofia Kowalska","Mila Smit","Anna Fischer","Bianca Karte","Stefan Müller","Elise Dubois","John Smith","Lars Jansen","Emma Visser"];
const products=["Single screen","Single screen - Pollen","Double screen","Curtain screen"];
const colors=["White","Anthracite","Black","RAL 7016","Light Grey"];
const stores=[".nl",".de",".fr",".dk",".uk",".es",".pl"];
const prefixes:Record<string,string>={".nl":"NL",".de":"DE",".fr":"FR",".dk":"DK",".uk":"UK",".es":"ES",".pl":"PL"};
const last:Record<Stage,string>={"Waiting for Mesh":"-","Cord & Eyelet":"Mesh completed","Waiting for Frame":"Cord & Eyelet completed","Waiting for Assembly":"Frame completed","Quality Control":"Assembly completed","Waiting for Packing":"QC completed",Packed:"Packing completed",Finished:"Manually finished"};
function dateFor(ageDays:number){const d=new Date(Date.UTC(2026,8,14));d.setUTCDate(d.getUTCDate()-ageDays);return d.toLocaleDateString("en-GB",{timeZone:"UTC"});}
function makeOrder(index:number):Order{const store=stores[index%stores.length];const stage=stages[(index*5+Math.floor(index/7))%stages.length];const ageDays=1+(index*7)%29;const stageEnteredDays=Math.min(ageDays,1+(index*5+stages.indexOf(stage)*2)%12);const risk:RiskLevel=stage==="Finished"?"Normal":ageDays>=22?"Delayed":ageDays>=14?"Risk":"Normal";const product=products[index%products.length];const width=88+(index*11)%135;const height=195+(index*13)%55;return {id:`${prefixes[store]}101-${11072-index*3}`,customer:customers[index%customers.length],date:dateFor(ageDays),store,stage,last:last[stage],eta:stage==="Finished"?"-":stage==="Packed"?"Ready":risk==="Delayed"?"Overdue":`Upcoming ${1+index%5} days`,product,color:colors[index%colors.length],width,height,direction:index%3?"Vertical":"Horizontal",threshold:index%4===0?"35 mm":index%7===0?"9 mm":"None",quantity:index%6===0?2:1,ageDays,stageEnteredDays,risk};}
export const orders:Order[]=Array.from({length:128},(_,index)=>makeOrder(index));
export function getOrder(orderId:string){return orders.find(order=>order.id===decodeURIComponent(orderId));}
