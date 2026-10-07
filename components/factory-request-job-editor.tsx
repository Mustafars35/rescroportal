'use client';
import {Plus,Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {partTypes,profileTypes,profileColors,plasticTypes,plasticColors,remakeReasons,requestCategories,itemSummary,isFabricPart,defaultStations,newJob,type RequestJob,type RequestCategory} from '@/lib/factory-requests';
import type {PoolOrder} from '@/lib/order-pool';
export function FactoryRequestJobEditor({jobs,order,category,onChange}:{jobs:RequestJob[];order:PoolOrder;category:RequestCategory;onChange:(jobs:RequestJob[])=>void}){
 const parts=category===requestCategories[1];
 const update=(id:string,patch:Partial<RequestJob>)=>onChange(jobs.map(j=>j.id===id?{...j,...patch}:j));
 const text=(job:RequestJob,label:string,field:keyof RequestJob)=> <label>{label}<input value={String(job[field]??'')} onChange={e=>update(job.id,{[field]:e.target.value})}/></label>;
 const select=(job:RequestJob,label:string,field:keyof RequestJob,options:readonly string[])=> <label>{label}<select aria-label={label} value={String(job[field]??'')} onChange={e=>update(job.id,{[field]:e.target.value})}><option value="">Seçin</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>;
 return <>
 {!parts&&<section className="factory-source"><h3>{order.id} · Sipariş Kalemleri</h3>{order.items.map((item,index)=><div key={item.id}><span>{itemSummary(item,index)}</span><Button variant="outline" disabled={jobs.some(j=>j.itemId===item.id)} onClick={()=>onChange([...jobs,newJob(item,category)])}><Plus/> Kalem Ekle</Button></div>)}</section>}
 {jobs.map((job,index)=><section className="factory-job" key={job.id}><header><h3>{parts?`Parça ${index+1}${job.operation?` · ${job.operation}`:''}`:itemSummary(job.original,order.items.findIndex(i=>i.id===job.itemId))}</h3><Button variant="ghost" aria-label={parts?'Parçayı kaldır':'İşi kaldır'} onClick={()=>onChange(jobs.filter(j=>j.id!==job.id))}><Trash2/></Button></header>
 {parts&&<label className="factory-part-type">Parça Türü<select aria-label="Parça Türü" value={job.operation} onChange={e=>update(job.id,{operation:e.target.value,stations:defaultStations(category,e.target.value),color:['Profil','Plastikler'].includes(e.target.value)?'':job.original.color,profileType:'',profileLengthMm:'',plasticType:'',meshType:'',curtainType:'',curtainColor:'',lengthCm:'',widthMm:String(job.original.widthMm??''),heightMm:String(job.original.heightMm??'')})}><option value="">Parça türü seçin</option>{partTypes.map(x=><option key={x}>{x}</option>)}</select></label>}
 {(!parts||job.operation)&&<>
 <div className="factory-form-grid">
 {parts&&isFabricPart(job.operation)&&<label className="factory-item-choice">Kalem Seçimi<select aria-label="Kalem Seçimi" value={job.itemId} onChange={e=>{const item=order.items.find(i=>i.id===e.target.value)!;update(job.id,{itemId:item.id,itemName:item.name,original:item,widthMm:String(item.widthMm??''),heightMm:String(item.heightMm??''),color:item.color});}}>{order.items.map((item,i)=><option key={item.id} value={item.id}>{itemSummary(item,i)}</option>)}</select></label>}
 {!parts&&<>{text(job,'Renk','color')}{select(job,'Neden','reason',remakeReasons)}{text(job,'Ürün / Tül / Perde Türü','productType')}</>}
 {parts&&['Tül','Tül + Perde'].includes(job.operation)&&text(job,'Tül Türü','meshType')}
 {parts&&['Perde','Tül + Perde'].includes(job.operation)&&<>{text(job,'Perde Türü','curtainType')}{text(job,'Perde Rengi','curtainColor')}</>}
 {parts&&job.operation==='Profil'&&<>{select(job,'Profil Türü','profileType',profileTypes)}<label>Profil Ölçüsü (mm)<input type="number" min={0.1} step="any" value={job.profileLengthMm??''} onChange={e=>update(job.id,{profileLengthMm:e.target.value})}/></label>{select(job,'Renk','color',profileColors)}</>}
 {parts&&job.operation==='Plastikler'&&<>{select(job,'Plastik Türü','plasticType',plasticTypes)}{select(job,'Renk','color',plasticColors)}</>}
 {parts&&job.operation==='Bant'&&<><label>Boy (cm)<input type="number" min={0.1} step="any" value={job.lengthCm} onChange={e=>update(job.id,{lengthCm:e.target.value})}/></label>{text(job,'Renk','color')}</>}
 <label>Adet<input type="number" min={1} value={job.quantity} onChange={e=>update(job.id,{quantity:Number(e.target.value)})}/></label>
 </div>
 <label>Üretim / Parça / Paketleme Notu<textarea value={job.note} onChange={e=>update(job.id,{note:e.target.value})}/></label>
 {parts&&<label className="factory-destination">Gönderim Yeri<select aria-label="Gönderim Yeri" value={job.destination} onChange={e=>update(job.id,{destination:e.target.value as RequestJob['destination']})}><option>Müşteriye</option><option>Depoya</option></select></label>}
 </>}
 </section>)}
 {parts&&<Button variant="outline" className="factory-add-part" onClick={()=>onChange([...jobs,newJob(order.items[0],category)])}><Plus/> Parça Ekle</Button>}
 </>;
}
