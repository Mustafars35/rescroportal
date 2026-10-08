'use client';
import {useI18n} from "@/components/i18n-provider";
import {Plus,Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {partTypes,profileTypes,profileColors,plasticTypes,plasticColors,remakeReasons,requestCategories,itemSummary,isFabricPart,defaultStations,newJob,type RequestJob,type RequestCategory} from '@/lib/factory-requests';
import type {PoolOrder} from '@/lib/order-pool';
export function FactoryRequestJobEditor({jobs,order,category,onChange}:{jobs:RequestJob[];order:PoolOrder;category:RequestCategory;onChange:(jobs:RequestJob[])=>void}){ const {t,locale} = useI18n(); 
 const parts=category===requestCategories[1];
 const update=(id:string,patch:Partial<RequestJob>)=>onChange(jobs.map(j=>j.id===id?{...j,...patch}:j));
 const text=(job:RequestJob,label:string,field:keyof RequestJob)=> <label>{t(label)}<input value={String(job[field]??'')} onChange={e=>update(job.id,{[field]:e.target.value})}/></label>;
 const select=(job:RequestJob,label:string,field:keyof RequestJob,options:readonly string[])=> <label>{t(label)}<select aria-label={t(label)} value={String(job[field]??'')} onChange={e=>update(job.id,{[field]:e.target.value})}><option value="">{t("Seçin")}</option>{options.map(x=><option key={x} value={x}>{t(x)}</option>)}</select></label>;
 return <>
 {!parts&&<section className="factory-source"><h3>{order.id} {t(" · Sipariş Kalemleri")}</h3>{order.items.map((item,index)=><div key={item.id}><span>{itemSummary(item,index,t,locale)}</span><Button variant="outline" disabled={jobs.some(j=>j.itemId===item.id)} onClick={()=>onChange([...jobs,newJob(item,category)])}><Plus/> {t(" Kalem Ekle")}</Button></div>)}</section>}
 {jobs.map((job,index)=><section className="factory-job" key={job.id}><header><h3>{parts ? t("Parça {0}{1}", {0: index+1, 1: job.operation?` · ${t(job.operation)}`:''}) : itemSummary(job.original,order.items.findIndex(i=>i.id===job.itemId),t,locale)}</h3><Button variant="ghost" aria-label={parts ? t("Parçayı kaldır") : t("İşi kaldır")} onClick={()=>onChange(jobs.filter(j=>j.id!==job.id))}><Trash2/></Button></header>
 {parts&&<label className="factory-part-type">{t("Parça Türü")}<select aria-label={t("Parça Türü")} value={job.operation} onChange={e=>update(job.id,{operation:e.target.value,stations:defaultStations(category,e.target.value),color:['Profil','Plastikler'].includes(e.target.value)?'':job.original.color,profileType:'',profileLengthMm:'',plasticType:'',meshType:'',curtainType:'',curtainColor:'',lengthCm:'',widthMm:String(job.original.widthMm??''),heightMm:String(job.original.heightMm??'')})}><option value="">{t("Parça türü seçin")}</option>{partTypes.map(x=><option key={x} value={x}>{t(x)}</option>)}</select></label>}
 {(!parts||job.operation)&&<>
 <div className="factory-form-grid">
 {parts&&isFabricPart(job.operation)&&<label className="factory-item-choice">{t("Kalem Seçimi")}<select aria-label={t("Kalem Seçimi")} value={job.itemId} onChange={e=>{const item=order.items.find(i=>i.id===e.target.value)!;update(job.id,{itemId:item.id,itemName:item.name,original:item,widthMm:String(item.widthMm??''),heightMm:String(item.heightMm??''),color:item.color});}}>{order.items.map((item,i)=><option key={item.id} value={item.id}>{itemSummary(item,i,t,locale)}</option>)}</select></label>}
 {!parts&&<>{text(job,'Renk','color')}{select(job,'Neden','reason',remakeReasons)}{text(job,'Ürün / Tül / Perde Türü','productType')}</>}
 {parts&&['Tül','Tül + Perde'].includes(job.operation)&&text(job,'Tül Türü','meshType')}
 {parts&&['Perde','Tül + Perde'].includes(job.operation)&&<>{text(job,'Perde Türü','curtainType')}{text(job,'Perde Rengi','curtainColor')}</>}
 {parts&&job.operation==='Profil'&&<>{select(job,'Profil Türü','profileType',profileTypes)}<label>{t("Profil Ölçüsü (mm)")}<input type="number" min={0.1} step="any" value={job.profileLengthMm??''} onChange={e=>update(job.id,{profileLengthMm:e.target.value})}/></label>{select(job,'Renk','color',profileColors)}</>}
 {parts&&job.operation==='Plastikler'&&<>{select(job,'Plastik Türü','plasticType',plasticTypes)}{select(job,'Renk','color',plasticColors)}</>}
 {parts&&job.operation==='Bant'&&<><label>{t("Boy (cm)")}<input type="number" min={0.1} step="any" value={job.lengthCm} onChange={e=>update(job.id,{lengthCm:e.target.value})}/></label>{text(job,'Renk','color')}</>}
 <label>{t("Adet")}<input type="number" min={1} value={job.quantity} onChange={e=>update(job.id,{quantity:Number(e.target.value)})}/></label>
 </div>
 <label>{t("Üretim / Parça / Paketleme Notu")}<textarea value={job.note} onChange={e=>update(job.id,{note:e.target.value})}/></label>
 {parts&&<label className="factory-destination">{t("Gönderim Yeri")}<select aria-label={t("Gönderim Yeri")} value={job.destination} onChange={e=>update(job.id,{destination:e.target.value as RequestJob['destination']})}><option value={"Müşteriye"}>{t("Müşteriye")}</option><option value={"Depoya"}>{t("Depoya")}</option></select></label>}
 </>}
 </section>)}
 {parts&&<Button variant="outline" className="factory-add-part" onClick={()=>onChange([...jobs,newJob(order.items[0],category)])}><Plus/> {t(" Parça Ekle")}</Button>}
 </>;
}
