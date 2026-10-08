import {poolOrders,type PoolItem} from '@/lib/order-pool';
// Historical prototype dimensions are display-only and apply solely to the original demo items.
// Never persist these values or use them to release factory requests.
const prototypeItems=new Map(poolOrders.flatMap(order=>order.items.map(item=>[item.id,item] as const)));
export type Instruction={curtain:boolean;windowLike:boolean;pollen:boolean;width:number|null;height:number|null;piles:number;meshLength:string|null;cordLength:number|null;profileColor:string;thresholdColor:string;direction:string;closingDirection:string;montage:boolean;exampleMeasurements:boolean};
const recorded=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
export function instructionFor(item:PoolItem,index:number):Instruction{
 const source=prototypeItems.get(item.id);const prototype=source?.name===item.name&&source.manufactured===item.manufactured;
 const recordedWidth=recorded(item.widthMm),recordedHeight=recorded(item.heightMm);
 const width=recordedWidth??(prototype?900+index*100:null),height=recordedHeight??(prototype?2100+index*50:null);
 const curtain=item.name.includes('Curtain');
 return {curtain,windowLike:item.name.includes('Window')||curtain,pollen:item.name.includes('Pollen')||index%3===1,width,height,piles:45+index*4,meshLength:height!==null?(height/10-4.2).toFixed(1):null,cordLength:width!==null&&height!==null?Math.round((width+height)/10+20):null,profileColor:item.color,thresholdColor:index%2?'Black':item.color,direction:index%2?'Vertical':'Horizontal',closingDirection:index%2?'Right':'Left',montage:index%4===0,exampleMeasurements:Boolean(prototype&&(recordedWidth===null||recordedHeight===null))};
}
export function instructionSize(value:number|string|null,unit:string){return value===null?'—':`${value} ${unit}`;}
export function finalMeasurement(data:Instruction){return `${data.width??'—'} × ${data.height??'—'} mm`;}
