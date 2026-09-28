export type PoolItem={id:string;name:string;quantity:number;color:string};
export type PoolOrder={id:string;date:string;customer:string;items:PoolItem[]};
const names=["Plissé Door","Plissé Window","Double Plissé Door","Curtain Screen","Easyclick"];
const colors=["RAL 7016","Black","White","Anthracite","RAL 9010","Light Grey"];
const customers=["Sophie de Vries","Lukas Schneider","Mila Smit","Anna Fischer","Daan Jansen","Camille Bernard"];
function day(index:number){const d=new Date(Date.UTC(2026,8,28));d.setUTCDate(d.getUTCDate()-(index%55));return d.toLocaleDateString("en-GB",{timeZone:"UTC"});}
export const poolOrders:PoolOrder[]=Array.from({length:500},(_,index)=>{const count=1+(index%4);return{id:`${["NL","DE","FR","DK","UK","ES","PL"][index%7]}101-${12001+index}`,date:day(index),customer:customers[index%customers.length],items:Array.from({length:count},(_,itemIndex)=>{const name=names[(index+itemIndex*2)%names.length];return{id:`pool-${index+1}-${itemIndex+1}`,name,quantity:1+((index+itemIndex)%3),color:colors[(index*3+itemIndex)%colors.length]}})}});
